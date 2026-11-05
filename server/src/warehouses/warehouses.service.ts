import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/warehouse/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/warehouse/update-warehouse.dto';
import {
  CreateWarehouseZoneDto,
  UpdateWarehouseZoneDto,
} from './dto/zone/create-warehouse-zone.dto';
import {
  CreateWarehouseAisleDto,
  UpdateWarehouseAisleDto,
} from './dto/aisle/create-warehouse-aisle.dto';
import {
  CreateWarehouseRackDto,
  UpdateWarehouseRackDto,
} from './dto/rack/create-warehouse-rack.dto';
import {
  CreateWarehouseShelfDto,
  UpdateWarehouseShelfDto,
} from './dto/shelf/create-warehouse-shelf.dto';
import {
  CreateStorageBinDto,
  UpdateStorageBinDto,
} from './dto/bin/create-storage-bin.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== WAREHOUSE CRUD ====================

  async findAll(marketId: string) {
    return this.prisma.warehouse.findMany({
      where: { marketId },
      include: {
        zones: {
          include: {
            aisles: {
              include: {
                racks: {
                  include: {
                    shelfs: {
                      include: {
                        bins: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        zones: true,
      },
    });
    if (!warehouse) throw new NotFoundException('Ombor topilmadi.');
    return warehouse;
  }

  async create(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: dto });
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOne(id);
    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.warehouse.delete({ where: { id } });
  }

  // ==================== ZONE CRUD ====================

  async findZones(warehouseId: string) {
    return this.prisma.warehouseZone.findMany({
      where: { warehouseId },
      include: {
        aisles: {
          include: {
            racks: {
              include: {
                shelfs: {
                  include: { bins: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async createZone(warehouseId: string, dto: CreateWarehouseZoneDto) {
    return this.prisma.warehouseZone.create({
      data: {
        ...dto,
        type: dto.type ?? 'STORAGE',
        warehouse: {
          connect: { id: warehouseId },
        },
      },
    });
  }

  async updateZone(zoneId: string, dto: UpdateWarehouseZoneDto) {
    const zone = await this.prisma.warehouseZone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new NotFoundException('Zona topilmadi.');
    return this.prisma.warehouseZone.update({
      where: { id: zoneId },
      data: dto,
    });
  }

  async deleteZone(zoneId: string) {
    const zone = await this.prisma.warehouseZone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new NotFoundException('Zona topilmadi.');
    return this.prisma.warehouseZone.delete({ where: { id: zoneId } });
  }

  // ==================== AISLE CRUD ====================

  async createAisle(dto: CreateWarehouseAisleDto) {
    const zone = await this.prisma.warehouseZone.findUnique({ where: { id: dto.zoneId } });
    if (!zone) throw new NotFoundException('Zona topilmadi.');
    return this.prisma.warehouseAisle.create({ data: dto });
  }

  async updateAisle(aisleId: string, dto: UpdateWarehouseAisleDto) {
    const aisle = await this.prisma.warehouseAisle.findUnique({ where: { id: aisleId } });
    if (!aisle) throw new NotFoundException('Yo‘lak (Aisle) topilmadi.');
    return this.prisma.warehouseAisle.update({
      where: { id: aisleId },
      data: dto,
    });
  }

  async deleteAisle(aisleId: string) {
    const aisle = await this.prisma.warehouseAisle.findUnique({ where: { id: aisleId } });
    if (!aisle) throw new NotFoundException('Yo‘lak (Aisle) topilmadi.');
    return this.prisma.warehouseAisle.delete({ where: { id: aisleId } });
  }

  // ==================== RACK CRUD ====================

  async createRack(dto: CreateWarehouseRackDto) {
    const aisle = await this.prisma.warehouseAisle.findUnique({ where: { id: dto.aisleId } });
    if (!aisle) throw new NotFoundException('Yo‘lak (Aisle) topilmadi.');
    return this.prisma.warehouseRack.create({ data: dto });
  }

  async updateRack(rackId: string, dto: UpdateWarehouseRackDto) {
    const rack = await this.prisma.warehouseRack.findUnique({ where: { id: rackId } });
    if (!rack) throw new NotFoundException('Stellaj (Rack) topilmadi.');
    return this.prisma.warehouseRack.update({
      where: { id: rackId },
      data: dto,
    });
  }

  async deleteRack(rackId: string) {
    const rack = await this.prisma.warehouseRack.findUnique({ where: { id: rackId } });
    if (!rack) throw new NotFoundException('Stellaj (Rack) topilmadi.');
    return this.prisma.warehouseRack.delete({ where: { id: rackId } });
  }

  // ==================== SHELF CRUD ====================

  async createShelf(dto: CreateWarehouseShelfDto) {
    const rack = await this.prisma.warehouseRack.findUnique({ where: { id: dto.rackId } });
    if (!rack) throw new NotFoundException('Stellaj (Rack) topilmadi.');
    return this.prisma.warehouseShelf.create({ data: dto });
  }

  async updateShelf(shelfId: string, dto: UpdateWarehouseShelfDto) {
    const shelf = await this.prisma.warehouseShelf.findUnique({ where: { id: shelfId } });
    if (!shelf) throw new NotFoundException('Tokcha (Shelf) topilmadi.');
    return this.prisma.warehouseShelf.update({
      where: { id: shelfId },
      data: dto,
    });
  }

  async deleteShelf(shelfId: string) {
    const shelf = await this.prisma.warehouseShelf.findUnique({ where: { id: shelfId } });
    if (!shelf) throw new NotFoundException('Tokcha (Shelf) topilmadi.');
    return this.prisma.warehouseShelf.delete({ where: { id: shelfId } });
  }

  // ==================== STORAGE BIN CRUD ====================

  async createBin(dto: CreateStorageBinDto) {
    const shelf = await this.prisma.warehouseShelf.findUnique({ where: { id: dto.shelfId } });
    if (!shelf) throw new NotFoundException('Tokcha (Shelf) topilmadi.');
    return this.prisma.storageBin.create({ data: dto });
  }

  async updateBin(binId: string, dto: UpdateStorageBinDto) {
    const bin = await this.prisma.storageBin.findUnique({ where: { id: binId } });
    if (!bin) throw new NotFoundException('Yacheyka (Bin) topilmadi.');

    if (dto.shelfId) {
      const shelf = await this.prisma.warehouseShelf.findUnique({ where: { id: dto.shelfId } });
      if (!shelf) throw new NotFoundException('Yangi tokcha (Shelf) topilmadi.');
    }

    return this.prisma.storageBin.update({
      where: { id: binId },
      data: dto,
    });
  }

  async deleteBin(binId: string) {
    const bin = await this.prisma.storageBin.findUnique({ where: { id: binId } });
    if (!bin) throw new NotFoundException('Yacheyka (Bin) topilmadi.');
    return this.prisma.storageBin.delete({ where: { id: binId } });
  }

  // ==================== MARKET ID FINDERS (HELPERS) ====================

  async getWarehouseMarketId(warehouseId: string): Promise<string> {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new NotFoundException('Ombor topilmadi.');
    return warehouse.marketId;
  }

  async getZoneMarketId(zoneId: string): Promise<string> {
    const zone = await this.prisma.warehouseZone.findUnique({
      where: { id: zoneId },
      include: { warehouse: true },
    });
    if (!zone) throw new NotFoundException('Zona topilmadi.');
    return zone.warehouse.marketId;
  }

  async getAisleMarketId(zoneId: string): Promise<string> {
    const zone = await this.prisma.warehouseZone.findUnique({
      where: { id: zoneId },
      include: { warehouse: true },
    });
    if (!zone) throw new NotFoundException('Zona topilmadi.');
    return zone.warehouse.marketId;
  }

  async getAisleMarketIdByAisleId(aisleId: string): Promise<string> {
    const aisle = await this.prisma.warehouseAisle.findUnique({
      where: { id: aisleId },
      include: { zone: { include: { warehouse: true } } },
    });
    if (!aisle) throw new NotFoundException('Yo‘lak (Aisle) topilmadi.');
    return aisle.zone.warehouse.marketId;
  }

  async getRackMarketId(aisleId: string): Promise<string> {
    const aisle = await this.prisma.warehouseAisle.findUnique({
      where: { id: aisleId },
      include: { zone: { include: { warehouse: true } } },
    });
    if (!aisle) throw new NotFoundException('Yo‘lak (Aisle) topilmadi.');
    return aisle.zone.warehouse.marketId;
  }

  async getRackMarketIdByRackId(rackId: string): Promise<string> {
    const rack = await this.prisma.warehouseRack.findUnique({
      where: { id: rackId },
      include: { aisle: { include: { zone: { include: { warehouse: true } } } } },
    });
    if (!rack) throw new NotFoundException('Stellaj (Rack) topilmadi.');
    return rack.aisle.zone.warehouse.marketId;
  }

  async getShelfMarketIdByRackId(rackId: string): Promise<string> {
    const rack = await this.prisma.warehouseRack.findUnique({
      where: { id: rackId },
      include: { aisle: { include: { zone: { include: { warehouse: true } } } } },
    });
    if (!rack) throw new NotFoundException('Stellaj (Rack) topilmadi.');
    return rack.aisle.zone.warehouse.marketId;
  }

  async getShelfMarketId(shelfId: string): Promise<string> {
    const shelf = await this.prisma.warehouseShelf.findUnique({
      where: { id: shelfId },
      include: {
        rack: {
          include: {
            aisle: {
              include: {
                zone: { include: { warehouse: true } },
              },
            },
          },
        },
      },
    });
    if (!shelf) throw new NotFoundException('Tokcha (Shelf) topilmadi.');
    return shelf.rack.aisle.zone.warehouse.marketId;
  }

  async getShelfWarehouseId(shelfId: string): Promise<string> {
    const shelf = await this.prisma.warehouseShelf.findUnique({
      where: { id: shelfId },
      include: {
        rack: {
          include: {
            aisle: { include: { zone: true } },
          },
        },
      },
    });
    if (!shelf) throw new NotFoundException('Tokcha (Shelf) topilmadi.');
    return shelf.rack.aisle.zone.warehouseId;
  }

  async getBinMarketId(binId: string): Promise<string> {
    const bin = await this.prisma.storageBin.findUnique({
      where: { id: binId },
      include: {
        shelf: {
          include: {
            rack: {
              include: {
                aisle: {
                  include: {
                    zone: { include: { warehouse: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!bin) throw new NotFoundException('Yacheyka (Bin) topilmadi.');
    return bin.shelf.rack.aisle.zone.warehouse.marketId;
  }

  async getBinWarehouseId(binId: string): Promise<{ warehouseId: string; isReferenced: boolean }> {
    const bin = await this.prisma.storageBin.findUnique({
      where: { id: binId },
      include: {
        shelf: {
          include: {
            rack: {
              include: {
                aisle: { include: { zone: true } },
              },
            },
          },
        },
        inventories: true,
      },
    });
    if (!bin) throw new NotFoundException('Yacheyka (Bin) topilmadi.');

    return {
      warehouseId: bin.shelf.rack.aisle.zone.warehouseId,
      isReferenced: bin.inventories.length > 0,
    };
  }

  async searchBins(warehouseId: string, search: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.StorageBinWhereInput = {
      status: 'active',
      shelf: {
        rack: {
          aisle: {
            zone: {
              warehouseId,
            },
          },
        },
      },
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: 'insensitive' } },
              { title: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.storageBin.findMany({
        where,
        orderBy: [{ code: 'asc' }, { id: 'asc' }],
        skip,
        take: limit,
        include: {
          shelf: {
            include: {
              rack: {
                include: {
                  aisle: {
                    include: {
                      zone: {
                        select: { id: true, code: true, title: true, type: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.storageBin.count({ where }),
    ]);
    return {
      data,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  async findInventory(warehouseId: string) {
    return this.prisma.warehouseInventory.findMany({
      where: { warehouseId },
      include: { product: true, bin: true },
    });
  }

  async searchBinInventory(
    warehouseId: string,
    binId: string,
    search: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.WarehouseInventoryWhereInput = {
      warehouseId,
      binId,
      ...(search
        ? {
            product: {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.warehouseInventory.findMany({
        where,
        orderBy: [{ product: { title: 'asc' } }, { lotNumber: 'asc' }],
        skip,
        take: limit,
        include: { product: true, bin: true },
      }),
      this.prisma.warehouseInventory.count({ where }),
    ]);
    return {
      data,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }
}