import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePickPointDto,
  PickPointRecommendationsDto,
  UpdatePickPointDto,
} from './dto/pickpoint.dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class PickPointsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(marketId: string) {
    return this.prisma.pickPoint.findMany({
      where: { warehouse: { marketId } },
      include: {
        warehouse: { select: { id: true, title: true, code: true } },
        assignedSeller: {
          select: {
            id: true,
            role: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findSellers(marketId: string) {
    return this.prisma.worker.findMany({
      where: {
        marketId,
        role: { equals: 'seller', mode: 'insensitive' },
      },
      select: {
        id: true,
        role: true,
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
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

  async recommendForProducts(input: PickPointRecommendationsDto) {
    const { marketId, latitude, longitude } = input;
    const mainProductIds = [...new Set(input.items.map((item) => item.productId))];
    const mainProducts = await this.prisma.product.findMany({
      where: { id: { in: mainProductIds }, marketId },
      select: {
        id: true,
        title: true,
        status: true,
        isOptionOnly: true,
        options: {
          select: {
            items: {
              select: {
                includeProductId: true,
                includedProduct: {
                  select: { id: true, marketId: true, status: true },
                },
              },
            },
          },
        },
      },
    });
    const mainProductsById = new Map(
      mainProducts.map((product) => [product.id, product]),
    );
    if (mainProductsById.size !== mainProductIds.length) {
      throw new BadRequestException(
        'Buyurtma mahsulotlari bitta marketga tegishli bo‘lishi kerak.',
      );
    }

    const demand = new Map<string, number>();
    for (const line of input.items) {
      const product = mainProductsById.get(line.productId);
      if (
        !product ||
        product.status !== ProductStatus.ACTIVE ||
        product.isOptionOnly
      ) {
        throw new BadRequestException(
          'Sotuvda faol bo‘lmagan mahsulot uchun punkt tavsiya qilib bo‘lmaydi.',
        );
      }
      demand.set(
        product.id,
        (demand.get(product.id) ?? 0) + line.quantity,
      );

      const selectedOptions = [...(line.selectedOptions ?? [])];
      let currentParentIds = new Set([product.id]);
      let depth = 0;
      while (selectedOptions.length && depth < 8) {
        const currentSelections = selectedOptions.filter((option) =>
          currentParentIds.has(option.parentProductId),
        );
        if (!currentSelections.length) break;

        const parentIds = [...new Set(
          currentSelections.map((option) => option.parentProductId),
        )];
        const parents = await this.prisma.product.findMany({
          where: { id: { in: parentIds }, marketId },
          select: {
            id: true,
            options: {
              select: {
                items: {
                  select: {
                    includeProductId: true,
                    includedProduct: {
                      select: { id: true, marketId: true, status: true },
                    },
                  },
                },
              },
            },
          },
        });
        const linksByParent = new Map(
          parents.map((parent) => [
            parent.id,
            new Set(parent.options.flatMap((option) =>
              option.items.flatMap((item) =>
                item.includeProductId &&
                item.includedProduct?.marketId === marketId &&
                item.includedProduct.status === ProductStatus.ACTIVE
                  ? [item.includeProductId]
                  : [],
              ),
            )),
          ]),
        );
        const nextParentIds = new Set<string>();
        for (const selection of currentSelections) {
          if (!linksByParent.get(selection.parentProductId)?.has(selection.optionProductId)) {
            throw new BadRequestException(
              'Tanlangan option mahsuloti konfiguratsiyaga tegishli emas.',
            );
          }
          demand.set(
            selection.optionProductId,
            (demand.get(selection.optionProductId) ?? 0) + line.quantity,
          );
          nextParentIds.add(selection.optionProductId);
          selectedOptions.splice(selectedOptions.indexOf(selection), 1);
        }
        currentParentIds = nextParentIds;
        depth++;
      }
      if (selectedOptions.length) {
        throw new BadRequestException(
          'Option konfiguratsiyasi noto‘g‘ri yoki ruxsat etilgan chuqurlikdan oshgan.',
        );
      }
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
    if (!points.length) return { nearest: null, data: [] };

    const inventory = await this.prisma.warehouseInventory.groupBy({
      by: ['warehouseId', 'productId'],
      where: {
        warehouseId: { in: [...new Set(points.map((point) => point.warehouse.id))] },
        productId: { in: [...demand.keys()] },
        bin: { status: 'active' },
        quantity: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      _sum: { quantity: true, reservedQuantity: true },
    });
    const availableByWarehouseAndProduct = new Map(
      inventory.map((row) => [
        `${row.warehouseId}:${row.productId}`,
        (row._sum.quantity ?? 0) - (row._sum.reservedQuantity ?? 0),
      ]),
    );

    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const recommendations = points
      .map((point) => {
        const latitudeDelta = toRadians(point.latitude - latitude);
        const longitudeDelta = toRadians(point.longitude - longitude);
        const haversine =
          Math.sin(latitudeDelta / 2) ** 2 +
          Math.cos(toRadians(latitude)) *
            Math.cos(toRadians(point.latitude)) *
            Math.sin(longitudeDelta / 2) ** 2;
        const distanceMeters =
          2 * 6_371_000 * Math.asin(Math.sqrt(Math.min(1, haversine)));
        const hasStock = [...demand].every(
          ([productId, quantity]) =>
            (availableByWarehouseAndProduct.get(
              `${point.warehouse.id}:${productId}`,
            ) ?? 0) >= quantity,
        );
        return {
          ...point,
          distanceMeters: Math.round(distanceMeters),
          withinServiceRadius: distanceMeters <= point.serviceRadiusMeters,
          hasStock,
        };
      })
      .filter((point) => point.hasStock && point.withinServiceRadius)
      .sort((left, right) => left.distanceMeters - right.distanceMeters)
      .slice(0, 5)
      .map(({ hasStock: _hasStock, ...point }) => point);

    return {
      nearest: recommendations[0] ?? null,
      data: recommendations,
    };
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
    if (body.assignedSellerId) {
      await this.assertSellerInMarket(body.assignedSellerId, body.marketId);
    }
    return this.prisma.pickPoint.create({
      data: {
        warehouseId: body.warehouseId,
        assignedSellerId: body.assignedSellerId ?? null,
        title: body.title.trim(),
        address: body.address?.trim() || null,
        latitude: body.latitude,
        longitude: body.longitude,
        serviceRadiusMeters: body.serviceRadiusMeters,
        isActive: body.isActive ?? true,
      },
      include: {
        warehouse: { select: { id: true, title: true, code: true } },
        assignedSeller: {
          select: {
            id: true,
            role: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }

  async update(id: string, marketId: string, body: UpdatePickPointDto) {
    const current = await this.prisma.pickPoint.findFirst({
      where: { id, warehouse: { marketId } },
      select: { id: true, warehouseId: true, assignedSellerId: true },
    });
    if (!current) throw new NotFoundException('Pick point topilmadi.');

    const warehouseId = body.warehouseId ?? current.warehouseId;
    await this.assertWarehouseInMarket(warehouseId, marketId);
    const assignedSellerId =
      body.assignedSellerId === undefined
        ? current.assignedSellerId
        : body.assignedSellerId;
    if (assignedSellerId) {
      await this.assertSellerInMarket(assignedSellerId, marketId);
    }

    return this.prisma.pickPoint.update({
      where: { id },
      data: {
        ...(body.warehouseId !== undefined && { warehouseId }),
        ...(body.assignedSellerId !== undefined && { assignedSellerId }),
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
        assignedSeller: {
          select: {
            id: true,
            role: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
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

  private async assertSellerInMarket(workerId: string, marketId: string) {
    const worker = await this.prisma.worker.findFirst({
      where: {
        id: workerId,
        marketId,
        role: { equals: 'seller', mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (!worker) {
      throw new BadRequestException(
        'Tanlangan sotuvchi shu marketning sotuvchi xodimi bo‘lishi kerak.',
      );
    }
  }
}
