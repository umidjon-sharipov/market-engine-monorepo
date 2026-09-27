import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WarehouseRepository } from './warehouse.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly warehouses: WarehouseRepository) {}

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