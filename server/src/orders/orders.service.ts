import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { StockMovementsService } from '../stock-movements/stock-movements.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovements: StockMovementsService,
  ) {}

  async findAll() {
    return this.prisma.order.findMany();
  }

  async create(createOrderDto: CreateOrderDto) {
    const {
      name,
      product,
      phone,
      address,
      items,
      stockReservations = [],
      status = OrderStatus.NEW,
    } = createOrderDto;

    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.create({
          data: {
            name,
            product,
            phone,
            address,
            items: items ?? [],
            status,
          },
        });

        if (status !== OrderStatus.CANCELLED) {
          for (const reservation of stockReservations) {
            const allocations = await this.stockMovements.reserveStock(
              reservation.productId,
              reservation.warehouseId,
              reservation.binId,
              reservation.quantity,
              tx,
            );
            for (const allocation of allocations) {
              await tx.orderStockReservation.create({
                data: {
                  orderId: order.id,
                  productId: reservation.productId,
                  warehouseId: reservation.warehouseId,
                  binId: reservation.binId,
                  lotNumber: allocation.lotNumber,
                  quantity: allocation.quantity,
                },
              });
            }
          }
        }
        return tx.order.findUniqueOrThrow({
          where: { id: order.id },
          include: { stockReservations: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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
            stockReservations: { where: { releasedAt: null } },
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
}