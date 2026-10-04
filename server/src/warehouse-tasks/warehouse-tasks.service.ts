import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WarehouseTaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWarehouseTaskDto,
  UpdateWarehouseTaskDto,
} from './dto/warehouse-task.dto';

const taskInclude = {
  assignedWorker: {
    select: {
      id: true,
      role: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  creatorWorker: {
    select: {
      id: true,
      role: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  pickerWorker: {
    select: {
      id: true,
      role: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  transporterWorker: {
    select: {
      id: true,
      role: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  warehouse: { select: { id: true, title: true, code: true } },
  sourceBin: {
    select: {
      id: true,
      code: true,
      title: true,
      zone: { select: { title: true } },
    },
  },
  destinationWarehouse: { select: { id: true, title: true, code: true } },
  destinationBin: {
    select: {
      id: true,
      code: true,
      title: true,
      zone: { select: { title: true } },
    },
  },
  product: { select: { id: true, title: true, uom: true } },
  optionItem: {
    select: { id: true, key: true, option: { select: { title: true } } },
  },
  reservation: {
    select: { id: true, lotNumber: true, quantity: true },
  },
} satisfies Prisma.WarehouseTaskInclude;

@Injectable()
export class WarehouseTasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(
    marketId: string,
    options: {
      status?: WarehouseTaskStatus;
      assignedWorkerId?: string;
      page: number;
      limit: number;
    },
  ) {
    const where: Prisma.WarehouseTaskWhereInput = {
      marketId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.assignedWorkerId
        ? { assignedWorkerId: options.assignedWorkerId }
        : {}),
    };
    return this.prisma.$transaction(async (tx) => {
      const [data, total] = await Promise.all([
        tx.warehouseTask.findMany({
          where,
          include: taskInclude,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip: (options.page - 1) * options.limit,
          take: options.limit,
        }),
        tx.warehouseTask.count({ where }),
      ]);
      return {
        data,
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      };
    });
  }

  findOne(marketId: string, id: string) {
    return this.prisma.warehouseTask.findFirst({
      where: { id, marketId },
      include: taskInclude,
    });
  }

  async findOptions(marketId: string) {
    const [workers, warehouses, products] = await Promise.all([
      this.prisma.worker.findMany({
        where: { marketId },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.prisma.warehouse.findMany({
        where: { marketId },
        select: {
          id: true,
          title: true,
          code: true,
          zones: {
            select: {
              title: true,
              bins: {
                select: { id: true, code: true, title: true },
                orderBy: { code: 'asc' },
              },
            },
            orderBy: { code: 'asc' },
          },
        },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.product.findMany({
        where: { marketId },
        select: {
          id: true,
          title: true,
          uom: true,
          options: {
            select: {
              id: true,
              title: true,
              items: { select: { id: true, key: true, value: true } },
            },
          },
        },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
      }),
    ]);
    return { workers, warehouses, products };
  }

  async resolveWorkerId(email: string | undefined, marketId: string) {
    if (!email) return null;
    const worker = await this.prisma.worker.findFirst({
      where: { marketId, user: { email } },
      select: { id: true },
    });
    return worker?.id ?? null;
  }

  async create(
    marketId: string,
    body: CreateWarehouseTaskDto,
    creatorWorkerId: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.validateReferences(tx, marketId, {
        assignedWorkerId: body.assignedWorkerId,
        warehouseId: body.warehouseId,
        sourceBinId: body.sourceBinId,
        destinationWarehouseId: body.destinationWarehouseId ?? null,
        destinationBinId: body.destinationBinId ?? null,
        productId: body.productId,
        optionItemId: body.optionItemId ?? null,
        quantity: body.quantity,
      });
      return tx.warehouseTask.create({
        data: {
          marketId,
          assignedWorkerId: body.assignedWorkerId,
          creatorWorkerId,
          warehouseId: body.warehouseId,
          sourceBinId: body.sourceBinId,
          destinationWarehouseId: body.destinationWarehouseId ?? null,
          destinationBinId: body.destinationBinId ?? null,
          productId: body.productId,
          optionItemId: body.optionItemId ?? null,
          quantity: body.quantity,
          note: body.note?.trim() || null,
          assignedAt: new Date(),
        },
        include: taskInclude,
      });
    });
  }

  async update(marketId: string, id: string, body: UpdateWarehouseTaskDto) {
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.warehouseTask.findFirst({
        where: { id, marketId },
      });
      if (!task) throw new NotFoundException('Warehouse task topilmadi.');
      if (
        task.status !== WarehouseTaskStatus.ASSIGNED &&
        task.status !== WarehouseTaskStatus.OPEN
      ) {
        throw new ConflictException(
          'Faqat hali boshlanmagan warehouse taskni tahrirlash mumkin.',
        );
      }
      if (
        task.reservationId &&
        ((body.warehouseId !== undefined &&
          body.warehouseId !== task.warehouseId) ||
          (body.sourceBinId !== undefined &&
            body.sourceBinId !== task.sourceBinId) ||
          (body.destinationWarehouseId !== undefined &&
            body.destinationWarehouseId !== task.destinationWarehouseId) ||
          (body.destinationBinId !== undefined &&
            body.destinationBinId !== task.destinationBinId) ||
          (body.productId !== undefined && body.productId !== task.productId) ||
          (body.optionItemId !== undefined &&
            body.optionItemId !== task.optionItemId) ||
          (body.quantity !== undefined && body.quantity !== task.quantity))
      ) {
        throw new ConflictException(
          'Order rezervatsiyasiga bog‘langan taskda mahsulot va joylashuvni o‘zgartirib bo‘lmaydi.',
        );
      }
      const next = {
        assignedWorkerId:
          body.assignedWorkerId === undefined
            ? task.assignedWorkerId
            : body.assignedWorkerId,
        warehouseId: body.warehouseId ?? task.warehouseId,
        sourceBinId: body.sourceBinId ?? task.sourceBinId,
        destinationWarehouseId:
          body.destinationWarehouseId === undefined
            ? task.destinationWarehouseId
            : body.destinationWarehouseId,
        destinationBinId:
          body.destinationBinId === undefined
            ? task.destinationBinId
            : body.destinationBinId,
        productId: body.productId ?? task.productId,
        optionItemId:
          body.optionItemId === undefined
            ? task.optionItemId
            : body.optionItemId,
        quantity: body.quantity ?? task.quantity,
      };
      await this.validateReferences(tx, marketId, next);

      const updated = await tx.warehouseTask.updateMany({
        where: { id, marketId, status: task.status },
        data: {
          ...next,
          ...(body.assignedWorkerId &&
            body.assignedWorkerId !== task.assignedWorkerId && {
              assignedAt: new Date(),
            }),
          ...(task.status === WarehouseTaskStatus.OPEN &&
            body.assignedWorkerId && {
              status: WarehouseTaskStatus.ASSIGNED,
            }),
          ...(body.note !== undefined && {
            note: body.note?.trim() || null,
          }),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'Faqat hali boshlanmagan warehouse taskni tahrirlash mumkin.',
        );
      }
      return tx.warehouseTask.findFirstOrThrow({
        where: { id, marketId },
        include: taskInclude,
      });
    });
  }

  async updateStatus(
    marketId: string,
    id: string,
    status: WarehouseTaskStatus,
    actorWorkerId: string | null,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const task = await tx.warehouseTask.findFirst({
            where: { id, marketId },
          });
          if (!task) throw new NotFoundException('Warehouse task topilmadi.');
          if (status === WarehouseTaskStatus.CANCELLED && task.reservationId) {
            const reservation = await tx.orderStockReservation.findUnique({
              where: { id: task.reservationId },
              select: { releasedAt: true },
            });
            if (reservation && !reservation.releasedAt) {
              throw new ConflictException(
                'Orderga bog‘langan taskni orderni bekor qilish orqali yakunlang.',
              );
            }
          }
          if (task.status === status) {
            return tx.warehouseTask.findFirstOrThrow({
              where: { id, marketId },
              include: taskInclude,
            });
          }
          if (
            !this.canTransition(task.status, status, !!task.destinationBinId)
          ) {
            throw new ConflictException(
              'Warehouse task statusini ushbu holatga o‘zgartirib bo‘lmaydi.',
            );
          }

          const now = new Date();
          const updated = await tx.warehouseTask.updateMany({
            where: { id, marketId, status: task.status },
            data: {
              status,
              ...(status === WarehouseTaskStatus.PICKING && {
                startedAt: now,
                pickerWorkerId: actorWorkerId ?? undefined,
              }),
              ...(status === WarehouseTaskStatus.PICKED && {
                pickedAt: now,
                pickerWorkerId:
                  actorWorkerId ?? task.pickerWorkerId ?? undefined,
              }),
              ...(status === WarehouseTaskStatus.IN_TRANSIT && {
                transportedAt: now,
                transporterWorkerId: actorWorkerId ?? undefined,
              }),
              ...(status === WarehouseTaskStatus.COMPLETED && {
                completedAt: now,
              }),
              ...(status === WarehouseTaskStatus.CANCELLED && {
                cancelledAt: now,
              }),
            },
          });
          if (updated.count !== 1) {
            throw new ConflictException(
              'Warehouse task parallel ravishda o‘zgartirildi.',
            );
          }
          return tx.warehouseTask.findFirstOrThrow({
            where: { id, marketId },
            include: taskInclude,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Warehouse task parallel yangilandi. Qayta urinib ko‘ring.',
        );
      }
      throw error;
    }
  }

  async remove(marketId: string, id: string) {
    const task = await this.prisma.warehouseTask.findFirst({
      where: { id, marketId },
      select: { status: true, reservationId: true },
    });
    if (!task) throw new NotFoundException('Warehouse task topilmadi.');
    if (task.reservationId) {
      throw new ConflictException(
        'Order rezervatsiyasiga bog‘langan taskni o‘chirib bo‘lmaydi.',
      );
    }
    if (
      task.status !== WarehouseTaskStatus.ASSIGNED &&
      task.status !== WarehouseTaskStatus.OPEN
    ) {
      throw new ConflictException(
        'Faqat hali bajarilmagan warehouse taskni o‘chirish mumkin.',
      );
    }
    return this.prisma.warehouseTask.delete({ where: { id } });
  }

  private canTransition(
    from: WarehouseTaskStatus,
    to: WarehouseTaskStatus,
    hasDestination: boolean,
  ) {
    if (to === WarehouseTaskStatus.CANCELLED) {
      return (
        from !== WarehouseTaskStatus.COMPLETED &&
        from !== WarehouseTaskStatus.CANCELLED
      );
    }
    const transitions: Partial<
      Record<WarehouseTaskStatus, WarehouseTaskStatus[]>
    > = {
      [WarehouseTaskStatus.ASSIGNED]: [WarehouseTaskStatus.PICKING],
      [WarehouseTaskStatus.PICKING]: [WarehouseTaskStatus.PICKED],
      [WarehouseTaskStatus.PICKED]: hasDestination
        ? [WarehouseTaskStatus.IN_TRANSIT]
        : [WarehouseTaskStatus.COMPLETED],
      [WarehouseTaskStatus.IN_TRANSIT]: [WarehouseTaskStatus.COMPLETED],
    };
    return transitions[from]?.includes(to) ?? false;
  }

  private async validateReferences(
    tx: PrismaService | Prisma.TransactionClient,
    marketId: string,
    input: {
      assignedWorkerId: string | null;
      warehouseId: string;
      sourceBinId: string;
      destinationWarehouseId: string | null;
      destinationBinId: string | null;
      productId: string;
      optionItemId: string | null;
      quantity: number;
    },
  ) {
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw new BadRequestException('Miqdor noldan katta bo‘lishi kerak.');
    }
    if (!!input.destinationWarehouseId !== !!input.destinationBinId) {
      throw new BadRequestException(
        'Manzil ombori va yacheykasi birgalikda ko‘rsatilishi kerak.',
      );
    }

    const [worker, product, sourceWarehouse] = await Promise.all([
      input.assignedWorkerId
        ? tx.worker.findFirst({
            where: { id: input.assignedWorkerId, marketId },
            select: { id: true },
          })
        : Promise.resolve(null),
      tx.product.findFirst({
        where: { id: input.productId, marketId },
        select: { id: true },
      }),
      tx.warehouse.findFirst({
        where: { id: input.warehouseId, marketId },
        select: { id: true },
      }),
    ]);
    if (input.assignedWorkerId && !worker) {
      throw new BadRequestException(
        'Tayinlangan ishchi ushbu marketga tegishli emas.',
      );
    }
    if (!product) {
      throw new BadRequestException('Mahsulot ushbu marketga tegishli emas.');
    }
    if (!sourceWarehouse) {
      throw new BadRequestException(
        'Manba ombori ushbu marketga tegishli emas.',
      );
    }
    await this.validateBin(tx, input.sourceBinId, input.warehouseId);

    if (input.destinationWarehouseId && input.destinationBinId) {
      const destinationWarehouse = await tx.warehouse.findFirst({
        where: { id: input.destinationWarehouseId, marketId },
        select: { id: true },
      });
      if (!destinationWarehouse) {
        throw new BadRequestException(
          'Manzil ombori ushbu marketga tegishli emas.',
        );
      }
      await this.validateBin(
        tx,
        input.destinationBinId,
        input.destinationWarehouseId,
      );
    }

    if (input.optionItemId) {
      const optionItem = await tx.productOptionItem.findFirst({
        where: {
          id: input.optionItemId,
          option: { productId: input.productId },
        },
        select: { id: true },
      });
      if (!optionItem) {
        throw new BadRequestException(
          'Tanlangan variant ushbu mahsulotga tegishli emas.',
        );
      }
    }
  }

  private async validateBin(
    tx: PrismaService | Prisma.TransactionClient,
    binId: string,
    warehouseId: string,
  ) {
    const bin = await tx.storageBin.findFirst({
      where: { id: binId, zone: { warehouseId } },
      select: { id: true },
    });
    if (!bin) {
      throw new BadRequestException(
        'Yacheyka ko‘rsatilgan omborga tegishli emas.',
      );
    }
  }
}
