import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MovementStatus, MovementType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

type InventoryLocation = {
  warehouseId: string;
  binId: string;
};

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  create(body: CreateStockMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.validateMovement(tx, body);
      return tx.stockMovement.create({
        data: { ...body, status: MovementStatus.PENDING },
      });
    });
  }

  async updateStatus(id: string, status: 'COMPLETED' | 'CANCELLED') {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const movement = await tx.stockMovement.findUnique({ where: { id } });
          if (!movement) throw new NotFoundException('Stock movement topilmadi.');
          if (movement.status === status) return movement;
          if (movement.status !== MovementStatus.PENDING) {
            throw new ConflictException(
              'Yakunlangan yoki bekor qilingan stock movement holatini o‘zgartirib bo‘lmaydi.',
            );
          }

          if (status === MovementStatus.COMPLETED) {
            await this.applyMovement(tx, movement);
          }

          const update = await tx.stockMovement.updateMany({
            where: { id, status: MovementStatus.PENDING },
            data: {
              status,
              completedAt:
                status === MovementStatus.COMPLETED ? new Date() : null,
            },
          });
          if (update.count !== 1) {
            throw new ConflictException(
              'Stock movement statusi parallel ravishda o‘zgartirildi.',
            );
          }
          return tx.stockMovement.findUniqueOrThrow({ where: { id } });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Stock movement parallel yangilandi. Qayta urinib ko‘ring.',
        );
      }
      throw error;
    }
  }

  reserveStock(
    productId: string,
    warehouseId: string,
    binId: string,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ) {
    if (tx) return this.reserveWithinTransaction(tx, { productId, warehouseId, binId, quantity });
    return this.prisma.$transaction(
      (transaction) =>
        this.reserveWithinTransaction(transaction, {
          productId,
          warehouseId,
          binId,
          quantity,
        }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  releaseReservation(
    productId: string,
    warehouseId: string,
    binId: string,
    quantity: number,
    tx?: Prisma.TransactionClient,
  ) {
    if (tx) return this.releaseWithinTransaction(tx, { productId, warehouseId, binId, quantity });
    return this.prisma.$transaction(
      (transaction) =>
        this.releaseWithinTransaction(transaction, {
          productId,
          warehouseId,
          binId,
          quantity,
        }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async validateMovement(
    tx: Prisma.TransactionClient,
    movement: CreateStockMovementDto,
  ) {
    if (
      movement.type !== MovementType.ADJUSTMENT &&
      movement.quantity <= 0
    ) {
      throw new BadRequestException('Miqdor noldan katta bo‘lishi kerak.');
    }

    const needsSource =
      movement.type === MovementType.OUTBOUND ||
      movement.type === MovementType.TRANSFER;
    const needsTarget =
      movement.type === MovementType.INBOUND ||
      movement.type === MovementType.TRANSFER ||
      movement.type === MovementType.ADJUSTMENT;

    if (needsSource && (!movement.fromWarehouseId || !movement.fromBinId)) {
      throw new BadRequestException(
        'Ushbu movement uchun fromWarehouseId va fromBinId talab qilinadi.',
      );
    }
    if (needsTarget && (!movement.toWarehouseId || !movement.toBinId)) {
      throw new BadRequestException(
        'Ushbu movement uchun toWarehouseId va toBinId talab qilinadi.',
      );
    }

    const product = await tx.product.findUnique({
      where: { id: movement.productId },
      select: { marketId: true },
    });
    if (!product) throw new BadRequestException('Mahsulot topilmadi.');

    if (needsSource) {
      await this.assertLocationMarket(
        tx,
        movement.fromWarehouseId!,
        movement.fromBinId!,
        product.marketId,
      );
    }
    if (needsTarget) {
      await this.assertLocationMarket(
        tx,
        movement.toWarehouseId!,
        movement.toBinId!,
        product.marketId,
      );
    }
    if (
      movement.type === MovementType.TRANSFER &&
      movement.fromBinId === movement.toBinId
    ) {
      throw new BadRequestException('Ko‘chirish manzili bir xil bo‘lishi mumkin emas.');
    }
  }

  private async assertLocationMarket(
    tx: Prisma.TransactionClient,
    warehouseId: string,
    binId: string,
    marketId: string,
  ) {
    const bin = await tx.storageBin.findUnique({
      where: { id: binId },
      select: {
        zone: {
          select: {
            warehouseId: true,
            warehouse: { select: { marketId: true } },
          },
        },
      },
    });
    if (!bin) throw new BadRequestException('Storage bin topilmadi.');
    if (bin.zone.warehouseId !== warehouseId) {
      throw new BadRequestException('Storage bin ko‘rsatilgan omborga tegishli emas.');
    }
    if (bin.zone.warehouse.marketId !== marketId) {
      throw new BadRequestException('Mahsulot va ombor bir marketga tegishli bo‘lishi shart.');
    }
  }

  private async applyMovement(
    tx: Prisma.TransactionClient,
    movement: Prisma.StockMovementGetPayload<object>,
  ) {
    if (movement.type === MovementType.INBOUND) {
      await this.increaseInventory(tx, movement.productId, {
        warehouseId: movement.toWarehouseId!,
        binId: movement.toBinId!,
      }, movement.quantity);
    } else if (movement.type === MovementType.OUTBOUND) {
      await this.decreaseInventory(tx, movement.productId, {
        warehouseId: movement.fromWarehouseId!,
        binId: movement.fromBinId!,
      }, movement.quantity);
    } else if (movement.type === MovementType.TRANSFER) {
      await this.decreaseInventory(tx, movement.productId, {
        warehouseId: movement.fromWarehouseId!,
        binId: movement.fromBinId!,
      }, movement.quantity);
      await this.increaseInventory(tx, movement.productId, {
        warehouseId: movement.toWarehouseId!,
        binId: movement.toBinId!,
      }, movement.quantity);
    } else {
      await this.adjustInventory(tx, movement.productId, {
        warehouseId: movement.toWarehouseId!,
        binId: movement.toBinId!,
      }, movement.quantity);
    }

    const total = await tx.warehouseInventory.aggregate({
      where: { productId: movement.productId },
      _sum: { quantity: true },
    });
    await tx.product.update({
      where: { id: movement.productId },
      data: { quantity: total._sum.quantity ?? 0 },
    });
  }

  private async increaseInventory(
    tx: Prisma.TransactionClient,
    productId: string,
    location: InventoryLocation,
    quantity: number,
  ) {
    await tx.warehouseInventory.upsert({
      where: { productId_binId: { productId, binId: location.binId } },
      update: { quantity: { increment: quantity } },
      create: {
        productId,
        warehouseId: location.warehouseId,
        binId: location.binId,
        quantity,
      },
    });
  }

  private async decreaseInventory(
    tx: Prisma.TransactionClient,
    productId: string,
    location: InventoryLocation,
    quantity: number,
  ) {
    const update = await tx.warehouseInventory.updateMany({
      where: {
        productId,
        warehouseId: location.warehouseId,
        binId: location.binId,
        quantity: { gte: quantity },
        reservedQuantity: { gte: quantity },
      },
      data: {
        quantity: { decrement: quantity },
        reservedQuantity: { decrement: quantity },
      },
    });
    if (!update.count) {
      throw new BadRequestException(
        'Omborda chiqim uchun yetarli zaxiralangan miqdor mavjud emas.',
      );
    }
  }

  private async adjustInventory(
    tx: Prisma.TransactionClient,
    productId: string,
    location: InventoryLocation,
    quantity: number,
  ) {
    const existing = await tx.warehouseInventory.findUnique({
      where: { productId_binId: { productId, binId: location.binId } },
      select: { reservedQuantity: true },
    });
    if (existing && quantity < existing.reservedQuantity) {
      throw new BadRequestException(
        'Inventarizatsiya miqdori band qilingan miqdordan kam bo‘lishi mumkin emas.',
      );
    }
    await tx.warehouseInventory.upsert({
      where: { productId_binId: { productId, binId: location.binId } },
      update: { quantity },
      create: { productId, ...location, quantity },
    });
  }

  private async reserveWithinTransaction(
    tx: Prisma.TransactionClient,
    input: { productId: string; warehouseId: string; binId: string; quantity: number },
  ) {
    this.validateReservationQuantity(input.quantity);
    await this.assertProductAndBin(tx, input.productId, input.warehouseId, input.binId);
    const inventory = await tx.warehouseInventory.upsert({
      where: {
        productId_binId: { productId: input.productId, binId: input.binId },
      },
      update: {},
      create: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        binId: input.binId,
      },
      select: { reservedQuantity: true },
    });
    const updated = await tx.warehouseInventory.updateMany({
      where: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        binId: input.binId,
        quantity: { gte: inventory.reservedQuantity + input.quantity },
        reservedQuantity: inventory.reservedQuantity,
      },
      data: { reservedQuantity: { increment: input.quantity } },
    });
    if (!updated.count) {
      throw new BadRequestException('Sotuvga ochiq qoldiq yetarli emas.');
    }
    return tx.warehouseInventory.findUniqueOrThrow({
      where: { productId_binId: { productId: input.productId, binId: input.binId } },
    });
  }

  private async releaseWithinTransaction(
    tx: Prisma.TransactionClient,
    input: { productId: string; warehouseId: string; binId: string; quantity: number },
  ) {
    this.validateReservationQuantity(input.quantity);
    const updated = await tx.warehouseInventory.updateMany({
      where: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        binId: input.binId,
        reservedQuantity: { gte: input.quantity },
      },
      data: { reservedQuantity: { decrement: input.quantity } },
    });
    if (!updated.count) {
      throw new BadRequestException('Yechish uchun band qilingan miqdor yetarli emas.');
    }
    return tx.warehouseInventory.findUniqueOrThrow({
      where: { productId_binId: { productId: input.productId, binId: input.binId } },
    });
  }

  private async assertProductAndBin(
    tx: Prisma.TransactionClient,
    productId: string,
    warehouseId: string,
    binId: string,
  ) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { marketId: true },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi.');
    await this.assertLocationMarket(tx, warehouseId, binId, product.marketId);
  }

  private validateReservationQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Band qilish miqdori musbat butun son bo‘lishi shart.');
    }
  }
}
