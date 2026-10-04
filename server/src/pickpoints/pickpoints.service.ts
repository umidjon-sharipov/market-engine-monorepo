import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePickPointDto,
  UpdatePickPointDto,
} from './dto/pickpoint.dto';

@Injectable()
export class PickPointsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(marketId: string) {
    return this.prisma.pickPoint.findMany({
      where: { warehouse: { marketId } },
      include: {
        warehouse: { select: { id: true, title: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMetrics(marketId: string) {
    const [total, active, inactive, radius] = await Promise.all([
      this.prisma.pickPoint.count({ where: { warehouse: { marketId } } }),
      this.prisma.pickPoint.count({
        where: { warehouse: { marketId }, isActive: true },
      }),
      this.prisma.pickPoint.count({
        where: { warehouse: { marketId }, isActive: false },
      }),
      this.prisma.pickPoint.aggregate({
        where: { warehouse: { marketId } },
        _avg: { serviceRadiusMeters: true },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      averageServiceRadiusMeters: radius._avg.serviceRadiusMeters ?? 0,
    };
  }

  async findNearest(marketId: string, latitude: number, longitude: number) {
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException('Koordinatalar noto‘g‘ri.');
    }

    const points = await this.prisma.pickPoint.findMany({
      where: { warehouse: { marketId }, isActive: true },
      select: {
        id: true,
        title: true,
        address: true,
        latitude: true,
        longitude: true,
        serviceRadiusMeters: true,
        warehouse: { select: { id: true, title: true } },
      },
    });
    const ranked = points
      .map((point) => {
        const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
        const latitudeDelta = toRadians(point.latitude - latitude);
        const longitudeDelta = toRadians(point.longitude - longitude);
        const haversine =
          Math.sin(latitudeDelta / 2) ** 2 +
          Math.cos(toRadians(latitude)) *
            Math.cos(toRadians(point.latitude)) *
            Math.sin(longitudeDelta / 2) ** 2;
        const distanceMeters =
          2 * 6_371_000 * Math.asin(Math.sqrt(Math.min(1, haversine)));
        return {
          ...point,
          distanceMeters: Math.round(distanceMeters),
          withinServiceRadius: distanceMeters <= point.serviceRadiusMeters,
        };
      })
      .sort((left, right) => left.distanceMeters - right.distanceMeters);

    return { nearest: ranked[0] ?? null, data: ranked.slice(0, 5) };
  }

  async findOne(id: string) {
    const pickPoint = await this.prisma.pickPoint.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, title: true, code: true, marketId: true } },
      },
    });
    if (!pickPoint) throw new NotFoundException('Pick point topilmadi.');
    return pickPoint;
  }

  async getMarketId(id: string) {
    const pickPoint = await this.prisma.pickPoint.findUnique({
      where: { id },
      select: { warehouse: { select: { marketId: true } } },
    });
    if (!pickPoint) throw new NotFoundException('Pick point topilmadi.');
    return pickPoint.warehouse.marketId;
  }

  async create(body: CreatePickPointDto) {
    await this.assertWarehouseInMarket(body.warehouseId, body.marketId);
    return this.prisma.pickPoint.create({
      data: {
        warehouseId: body.warehouseId,
        title: body.title.trim(),
        address: body.address?.trim() || null,
        latitude: body.latitude,
        longitude: body.longitude,
        serviceRadiusMeters: body.serviceRadiusMeters,
        isActive: body.isActive ?? true,
      },
      include: {
        warehouse: { select: { id: true, title: true, code: true } },
      },
    });
  }

  async update(id: string, marketId: string, body: UpdatePickPointDto) {
    const current = await this.prisma.pickPoint.findFirst({
      where: { id, warehouse: { marketId } },
      select: { id: true, warehouseId: true },
    });
    if (!current) throw new NotFoundException('Pick point topilmadi.');

    const warehouseId = body.warehouseId ?? current.warehouseId;
    await this.assertWarehouseInMarket(warehouseId, marketId);

    return this.prisma.pickPoint.update({
      where: { id },
      data: {
        ...(body.warehouseId !== undefined && { warehouseId }),
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.address !== undefined && {
          address: body.address.trim() || null,
        }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.serviceRadiusMeters !== undefined && {
          serviceRadiusMeters: body.serviceRadiusMeters,
        }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        warehouse: { select: { id: true, title: true, code: true } },
      },
    });
  }

  async delete(id: string, marketId: string) {
    const current = await this.prisma.pickPoint.findFirst({
      where: { id, warehouse: { marketId } },
      select: { id: true },
    });
    if (!current) throw new NotFoundException('Pick point topilmadi.');
    return this.prisma.pickPoint.delete({ where: { id } });
  }

  private async assertWarehouseInMarket(warehouseId: string, marketId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, marketId },
      select: { id: true },
    });
    if (!warehouse) {
      throw new BadRequestException(
        'Tanlangan ombor ushbu marketga tegishli emas.',
      );
    }
  }
}
