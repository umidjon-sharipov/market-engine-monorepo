import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import {
  MovementStatus,
  MovementType,
  OrderStatus,
  Prisma,
  WarehouseTaskStatus,
} from '@prisma/client';
import { StockMovementsService } from '../stock-movements/stock-movements.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovements: StockMovementsService,
  ) {}

  async findAll(marketId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const where = { marketId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          stockReservations: true,
          warehouseTasks: { orderBy: { createdAt: 'asc' } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: safePage * safeLimit < total,
    };
  }

  async create(createOrderDto: CreateOrderDto) {
    if (!createOrderDto.items.length) {
      throw new BadRequestException('Savatda kamida bitta mahsulot bo‘lishi kerak.');
    }
    const name = createOrderDto.name.trim();
    const phone = createOrderDto.phone.trim();
    const address = createOrderDto.address.trim();
    if (name.length < 2 || phone.length < 7 || address.length < 5) {
      throw new BadRequestException(
        'Ism, telefon raqami va manzilni to‘liq kiriting.',
      );
    }
    if (
      (createOrderDto.deliveryLatitude === undefined) !==
      (createOrderDto.deliveryLongitude === undefined)
    ) {
      throw new BadRequestException(
        'Yetkazib berish koordinatalari juft holda yuborilishi kerak.',
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const previousCheckout = await tx.order.findMany({
            where: { checkoutId: createOrderDto.checkoutId },
            select: { id: true, marketId: true, status: true, total: true },
          });
          if (previousCheckout.length) return previousCheckout;

          const productIds = [...new Set(createOrderDto.items.map((item) => item.productId))];
          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
            include: {
              options: {
                include: {
                  items: { include: { includedProduct: true } },
                },
              },
            },
          });
          const productsById = new Map(products.map((product) => [product.id, product]));
          if (productsById.size !== productIds.length) {
            throw new BadRequestException('Savatda mavjud bo‘lmagan mahsulot bor.');
          }

          const ordersByMarket = new Map<string, {
            lines: Record<string, unknown>[];
            demand: Map<string, number>;
            total: number;
          }>();
          const addDemand = (marketId: string, productId: string, quantity: number) => {
            const marketOrder = ordersByMarket.get(marketId);
            if (!marketOrder) throw new BadRequestException('Buyurtma marketi topilmadi.');
            marketOrder.demand.set(
              productId,
              (marketOrder.demand.get(productId) ?? 0) + quantity,
            );
          };

          for (const line of createOrderDto.items) {
            const product = productsById.get(line.productId)!;
            if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
              throw new BadRequestException('Mahsulot miqdori noto‘g‘ri.');
            }
            const marketOrder = ordersByMarket.get(product.marketId) ?? {
              lines: [],
              demand: new Map<string, number>(),
              total: 0,
            };
            ordersByMarket.set(product.marketId, marketOrder);

            const selections = line.optionSelections ?? {};
            const groupsById = new Map(product.options.map((group) => [group.id, group]));
            if (Object.keys(selections).some((groupId) => !groupsById.has(groupId))) {
              throw new BadRequestException('Savatdagi option tanlovi mahsulotga tegishli emas.');
            }
            const selectedOptions: {
              groupId: string;
              title: string;
              productId: string;
              productTitle: string;
              unitPrice: number;
            }[] = [];
            for (const group of product.options) {
              const selectedItemId = selections[group.id];
              if (!group.isOptional && !selectedItemId) {
                throw new BadRequestException(`“${group.title}” uchun mahsulot tanlang.`);
              }
              if (!selectedItemId) continue;
              const selectedItem = group.items.find((item) => item.id === selectedItemId);
              const includedProduct = selectedItem?.includedProduct;
              if (!includedProduct || includedProduct.marketId !== product.marketId) {
                throw new BadRequestException('Tanlangan option mahsuloti yaroqsiz.');
              }
              selectedOptions.push({
                groupId: group.id,
                title: group.title,
                productId: includedProduct.id,
                productTitle: includedProduct.title,
                unitPrice: includedProduct.price,
              });
              addDemand(product.marketId, includedProduct.id, line.quantity);
            }
            addDemand(product.marketId, product.id, line.quantity);
            const unitPrice = product.price + selectedOptions.reduce(
              (sum, option) => sum + option.unitPrice,
              0,
            );
            const lineTotal = Math.round(unitPrice * line.quantity * 100) / 100;
            marketOrder.total += lineTotal;
            marketOrder.lines.push({
              productId: product.id,
              title: product.title,
              quantity: line.quantity,
              unitPrice,
              options: selectedOptions,
              total: lineTotal,
            });
          }

          if (createOrderDto.pickPointId && ordersByMarket.size !== 1) {
            throw new BadRequestException('Bir nechta market uchun pickup point alohida tanlanishi kerak.');
          }

          const createdOrders = [];
          for (const [marketId, marketOrder] of ordersByMarket) {
            if (createOrderDto.pickPointId) {
              const pickPoint = await tx.pickPoint.findFirst({
                where: {
                  id: createOrderDto.pickPointId,
                  warehouse: { marketId, },
                  isActive: true,
                },
                select: { id: true },
              });
              if (!pickPoint) {
                throw new BadRequestException('Tanlangan pickup point ushbu marketda faol emas.');
              }
            }
            const order = await tx.order.create({
              data: {
                checkoutId: createOrderDto.checkoutId,
                marketId,
                name,
                product: marketOrder.lines.map((line) => String(line.title)).join(', '),
                phone,
                address,
                deliveryLatitude: createOrderDto.deliveryLatitude,
                deliveryLongitude: createOrderDto.deliveryLongitude,
                pickPointId: createOrderDto.pickPointId,
                total: Math.round(marketOrder.total * 100) / 100,
                items: marketOrder.lines as Prisma.InputJsonValue,
                status: OrderStatus.NEW,
              },
              select: { id: true, marketId: true, status: true, total: true },
            });
            for (const [productId, quantity] of marketOrder.demand) {
              await this.reserveDemand(tx, order.id, marketId, productId, quantity);
            }
            createdOrders.push(order);
          }
          return createdOrders;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Ombor qoldig‘i parallel o‘zgardi. Buyurtmani qayta yuboring.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const previousCheckout = await this.prisma.order.findMany({
          where: { checkoutId: createOrderDto.checkoutId },
          select: { id: true, marketId: true, status: true, total: true },
        });
        if (previousCheckout.length) return previousCheckout;
      }
      throw error;
    }
  }

  async updateStatus(id: string, input: UpdateOrderStatusDto) {
    if (!Object.values(OrderStatus).includes(input.status)) {
      throw new BadRequestException('Order status noto‘g‘ri.');
    }
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          include: {
            stockReservations: {
              where: { releasedAt: null, fulfilledAt: null },
            },
          },
        });
        if (!order) throw new NotFoundException('Order topilmadi.');
        if (
          order.status === OrderStatus.CANCELLED &&
          input.status !== OrderStatus.CANCELLED
        ) {
          throw new BadRequestException(
            'Bekor qilingan buyurtma holatini qayta faollashtirib bo‘lmaydi.',
          );
        }
        const allowedNextStatuses: Record<OrderStatus, OrderStatus[]> = {
          [OrderStatus.NEW]: [
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.CANCELLED,
          ],
          [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
          [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
          [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
          [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
          [OrderStatus.COMPLETED]: [],
          [OrderStatus.CANCELLED]: [],
        };
        if (
          input.status !== order.status &&
          !allowedNextStatuses[order.status].includes(input.status)
        ) {
          throw new BadRequestException('Order holatini bu bosqichga o‘zgartirib bo‘lmaydi.');
        }

        if (
          input.status === OrderStatus.CANCELLED &&
          order.status !== OrderStatus.CANCELLED
        ) {
          if (
            order.status === OrderStatus.SHIPPED ||
            order.status === OrderStatus.DELIVERED ||
            order.status === OrderStatus.COMPLETED
          ) {
            throw new BadRequestException(
              'Jo‘natilgan yoki yakunlangan buyurtmani bekor qilib bo‘lmaydi.',
            );
          }
          const pickedTask = await tx.warehouseTask.findFirst({
            where: {
              orderId: order.id,
              status: {
                in: [
                  WarehouseTaskStatus.PICKED,
                  WarehouseTaskStatus.IN_TRANSIT,
                  WarehouseTaskStatus.COMPLETED,
                ],
              },
            },
            select: { id: true },
          });
          if (pickedTask) {
            throw new ConflictException(
              'Mahsulot ombordan chiqarilgan. Bunday buyurtmani bekor qilib bo‘lmaydi.',
            );
          }
          for (const reservation of order.stockReservations) {
            await this.stockMovements.releaseReservation(
              reservation.productId,
              reservation.warehouseId,
              reservation.binId,
              reservation.quantity,
              reservation.lotNumber,
              tx,
            );
            await tx.orderStockReservation.update({
              where: { id: reservation.id },
              data: { releasedAt: new Date() },
            });
          }
          await tx.warehouseTask.updateMany({
            where: {
              orderId: order.id,
              status: {
                notIn: [
                  WarehouseTaskStatus.COMPLETED,
                  WarehouseTaskStatus.CANCELLED,
                ],
              },
            },
            data: {
              status: WarehouseTaskStatus.CANCELLED,
              cancelledAt: new Date(),
            },
          });
        }
        if (
          input.status === OrderStatus.DELIVERED &&
          order.status !== OrderStatus.DELIVERED
        ) {
          const incompleteTask = await tx.warehouseTask.findFirst({
            where: {
              orderId: order.id,
              status: { not: WarehouseTaskStatus.COMPLETED },
            },
            select: { id: true },
          });
          if (incompleteTask) {
            throw new ConflictException(
              'Buyurtmani yetkazilgan deb belgilashdan oldin ombor topshiriqlarini yakunlang.',
            );
          }
          await this.fulfillReservations(tx, order.id, order.stockReservations);
        }
        return tx.order.update({
          where: { id },
          data: { status: input.status },
          include: { stockReservations: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async fulfillReservations(
    tx: Prisma.TransactionClient,
    orderId: string,
    reservations: {
      id: string;
      productId: string;
      warehouseId: string;
      binId: string;
      lotNumber: string;
      quantity: number;
    }[],
  ) {
    const fulfilledProducts = new Set<string>();
    for (const reservation of reservations) {
      const inventory = await tx.warehouseInventory.updateMany({
        where: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
          binId: reservation.binId,
          lotNumber: reservation.lotNumber,
          quantity: { gte: reservation.quantity },
          reservedQuantity: { gte: reservation.quantity },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        data: {
          quantity: { decrement: reservation.quantity },
          reservedQuantity: { decrement: reservation.quantity },
        },
      });
      if (inventory.count !== 1) {
        throw new ConflictException(
          'Band qilingan ombor qoldig‘i topilmadi yoki o‘zgargan.',
        );
      }
      const reservationUpdate = await tx.orderStockReservation.updateMany({
        where: {
          id: reservation.id,
          releasedAt: null,
          fulfilledAt: null,
        },
        data: { fulfilledAt: new Date() },
      });
      if (reservationUpdate.count !== 1) {
        throw new ConflictException(
          'Order ombor rezervatsiyasi parallel ravishda o‘zgartirildi.',
        );
      }
      await tx.stockMovement.create({
        data: {
          productId: reservation.productId,
          type: MovementType.OUTBOUND,
          status: MovementStatus.COMPLETED,
          quantity: reservation.quantity,
          lotNumber: reservation.lotNumber,
          fromWarehouseId: reservation.warehouseId,
          fromBinId: reservation.binId,
          note: `Delivered order ${orderId}`,
          completedAt: new Date(),
        },
      });
      fulfilledProducts.add(reservation.productId);
    }

    for (const productId of fulfilledProducts) {
      const inventory = await tx.warehouseInventory.aggregate({
        where: { productId },
        _sum: { quantity: true },
      });
      await tx.product.update({
        where: { id: productId },
        data: { quantity: inventory._sum.quantity ?? 0 },
      });
    }
  }

  private async reserveDemand(
    tx: Prisma.TransactionClient,
    orderId: string,
    marketId: string,
    productId: string,
    quantity: number,
  ) {
    const lots = await tx.warehouseInventory.findMany({
      where: {
        productId,
        warehouse: { marketId },
        quantity: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { updatedAt: 'asc' },
      select: {
        warehouseId: true,
        binId: true,
        quantity: true,
        reservedQuantity: true,
        expiresAt: true,
      },
    });
    lots.sort((left, right) => {
      if (!left.expiresAt) return right.expiresAt ? 1 : 0;
      if (!right.expiresAt) return -1;
      return left.expiresAt.getTime() - right.expiresAt.getTime();
    });

    const locations = new Map<string, { warehouseId: string; binId: string; available: number }>();
    for (const lot of lots) {
      const available = lot.quantity - lot.reservedQuantity;
      if (available <= 0) continue;
      const key = `${lot.warehouseId}:${lot.binId}`;
      const location = locations.get(key) ?? {
        warehouseId: lot.warehouseId,
        binId: lot.binId,
        available: 0,
      };
      location.available += available;
      locations.set(key, location);
    }

    let remaining = quantity;
    for (const location of locations.values()) {
      const allocatedQuantity = Math.min(location.available, remaining);
      if (allocatedQuantity <= 0) continue;
      const allocations = await this.stockMovements.reserveStock(
        productId,
        location.warehouseId,
        location.binId,
        allocatedQuantity,
        tx,
      );
      for (const allocation of allocations) {
        const reservation = await tx.orderStockReservation.create({
          data: {
            orderId,
            productId,
            warehouseId: location.warehouseId,
            binId: location.binId,
            lotNumber: allocation.lotNumber,
            quantity: allocation.quantity,
          },
          select: { id: true },
        });
        await tx.warehouseTask.create({
          data: {
            marketId,
            assignedWorkerId: null,
            warehouseId: location.warehouseId,
            sourceBinId: location.binId,
            productId,
            orderId,
            reservationId: reservation.id,
            quantity: allocation.quantity,
            status: WarehouseTaskStatus.OPEN,
            note: `Order pick task for ${orderId}`,
          },
        });
        remaining -= allocation.quantity;
      }
      if (remaining <= 0.0000001) break;
    }
    if (remaining > 0.0000001) {
      throw new BadRequestException('Omborda buyurtma uchun yetarli qoldiq yo‘q.');
    }
  }
}