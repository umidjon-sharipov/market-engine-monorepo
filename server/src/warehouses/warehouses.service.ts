import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WarehouseRepository } from './warehouse.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import {
  CreateWarehouseZoneDto,
  UpdateWarehouseZoneDto,
} from './dto/create-warehouse-zone.dto';
import {
  CreateStorageBinDto,
  UpdateStorageBinDto,
} from './dto/create-storage-bin.dto';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly warehouses: WarehouseRepository,
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.warehouses.findAll({
      orderBy: { createdAt: 'desc' },
      include: { market: { select: { id: true, title: true, logo: true } } },
    });
  }

  findOne(id: string) {
    return this.warehouses.findOne({ id });
  }

  create(body: CreateWarehouseDto) {
    return this.warehouses.create(this.toCreateInput(body));
  }

  update(id: string, body: UpdateWarehouseDto) {
    return this.warehouses.update({ id }, this.toUpdateInput(body));
  }

  delete(id: string) {
    return this.warehouses.delete({ id });
  }

  findZones(warehouseId: string) {
    return this.prisma.warehouseZone.findMany({
      where: { warehouseId },
      orderBy: { code: 'asc' },
      include: { bins: { orderBy: { code: 'asc' } } },
    });
  }

  async createZone(warehouseId: string, body: CreateWarehouseZoneDto) {
    await this.requireWarehouse(warehouseId);
    try {
      return await this.prisma.warehouseZone.create({
        data: { ...body, warehouseId, code: body.code.trim() },
      });
    } catch (error) {
      this.throwUniqueConflict(error, 'Bu omborda zone kodi band.');
    }
  }

  async updateZone(id: string, body: UpdateWarehouseZoneDto) {
    await this.requireZone(id);
    try {
      return await this.prisma.warehouseZone.update({
        where: { id },
        data: {
          ...(body.code !== undefined && { code: body.code.trim() }),
          ...(body.title !== undefined && { title: body.title }),
        },
      });
    } catch (error) {
      this.throwUniqueConflict(error, 'Bu omborda zone kodi band.');
    }
  }

  async deleteZone(id: string) {
    const zone = await this.prisma.warehouseZone.findUnique({
      where: { id },
      include: { _count: { select: { bins: true } } },
    });
    if (!zone) throw new NotFoundException('Warehouse zone topilmadi.');
    if (zone._count.bins) {
      throw new ConflictException('Avval zonadagi yacheykalarni o‘chiring.');
    }
    return this.prisma.warehouseZone.delete({ where: { id } });
  }

  findBins(zoneId: string) {
    return this.prisma.storageBin.findMany({
      where: { zoneId },
      orderBy: { code: 'asc' },
    });
  }

  async createBin(body: CreateStorageBinDto) {
    await this.requireZone(body.zoneId);
    try {
      return await this.prisma.storageBin.create({
        data: {
          zoneId: body.zoneId,
          code: body.code.trim(),
          title: body.title,
        },
      });
    } catch (error) {
      this.throwUniqueConflict(error, 'Yacheyka kodi band.');
    }
  }

  async updateBin(id: string, body: UpdateStorageBinDto) {
    await this.requireBin(id);
    if (body.zoneId) await this.requireZone(body.zoneId);
    try {
      return await this.prisma.storageBin.update({
        where: { id },
        data: {
          ...(body.zoneId && { zone: { connect: { id: body.zoneId } } }),
          ...(body.code !== undefined && { code: body.code.trim() }),
          ...(body.title !== undefined && { title: body.title }),
        },
      });
    } catch (error) {
      this.throwUniqueConflict(error, 'Yacheyka kodi band.');
    }
  }

  async deleteBin(id: string) {
    const bin = await this.requireBin(id);
    if (
      bin._count.inventories > 0 ||
      bin._count.outgoingMovements > 0 ||
      bin._count.incomingMovements > 0 ||
      bin._count.reservations > 0
    ) {
      throw new ConflictException(
        'Inventar, movement yoki reservation bilan bog‘langan yacheykani o‘chirib bo‘lmaydi.',
      );
    }
    return this.prisma.storageBin.delete({ where: { id } });
  }

  async findInventory(warehouseId: string) {
    await this.requireWarehouse(warehouseId);
    const inventory = await this.prisma.warehouseInventory.findMany({
      where: { warehouseId },
      orderBy: [{ bin: { code: 'asc' } }, { product: { title: 'asc' } }],
      include: {
        product: { select: { id: true, title: true, images: true, price: true } },
        bin: {
          select: {
            id: true,
            code: true,
            title: true,
            zone: { select: { id: true, code: true, title: true } },
          },
        },
      },
    });
    return inventory.map((row) => ({
      ...row,
      availableQuantity: row.quantity - row.reservedQuantity,
    }));
  }

  async getWarehouseMarketId(warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { marketId: true },
    });
    if (!warehouse) throw new NotFoundException('Warehouse topilmadi.');
    return warehouse.marketId;
  }

  async getZoneMarketId(zoneId: string) {
    const zone = await this.prisma.warehouseZone.findUnique({
      where: { id: zoneId },
      select: { warehouse: { select: { marketId: true } } },
    });
    if (!zone) throw new NotFoundException('Warehouse zone topilmadi.');
    return zone.warehouse.marketId;
  }

  async getZoneWarehouseId(zoneId: string) {
    const zone = await this.prisma.warehouseZone.findUnique({
      where: { id: zoneId },
      select: { warehouseId: true },
    });
    if (!zone) throw new NotFoundException('Warehouse zone topilmadi.');
    return zone.warehouseId;
  }

  async getBinMarketId(binId: string) {
    const bin = await this.prisma.storageBin.findUnique({
      where: { id: binId },
      select: {
        zone: { select: { warehouse: { select: { marketId: true } } } },
      },
    });
    if (!bin) throw new NotFoundException('Storage bin topilmadi.');
    return bin.zone.warehouse.marketId;
  }

  async getBinWarehouseId(binId: string) {
    const bin = await this.prisma.storageBin.findUnique({
      where: { id: binId },
      select: {
        zone: { select: { warehouseId: true } },
        _count: {
          select: {
            inventories: true,
            outgoingMovements: true,
            incomingMovements: true,
            reservations: true,
          },
        },
      },
    });
    if (!bin) throw new NotFoundException('Storage bin topilmadi.');
    return {
      warehouseId: bin.zone.warehouseId,
      isReferenced: Object.values(bin._count).some((count) => count > 0),
    };
  }

  private async requireWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse topilmadi.');
    return warehouse;
  }

  private async requireZone(id: string) {
    const zone = await this.prisma.warehouseZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Warehouse zone topilmadi.');
    return zone;
  }

  private async requireBin(id: string) {
    const bin = await this.prisma.storageBin.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventories: true,
            outgoingMovements: true,
            incomingMovements: true,
            reservations: true,
          },
        },
      },
    });
    if (!bin) throw new NotFoundException('Storage bin topilmadi.');
    return bin;
  }

  private throwUniqueConflict(error: unknown, message: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }
    throw error;
  }

  private toCreateInput(body: CreateWarehouseDto): Prisma.WarehouseCreateInput {
    return {
      title: body.title,
      lat: String(body.lat),
      lng: String(body.lng),
      market: { connect: { id: body.marketId } },
    };
  }

  private toUpdateInput(body: UpdateWarehouseDto): Prisma.WarehouseUpdateInput {
    return {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.lat !== undefined && { lat: String(body.lat) }),
      ...(body.lng !== undefined && { lng: String(body.lng) }),
      ...(body.marketId !== undefined && { market: { connect: { id: body.marketId } } }),
    };
  }
}