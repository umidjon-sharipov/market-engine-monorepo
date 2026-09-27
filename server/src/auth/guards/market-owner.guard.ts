import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { email?: string };
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      headers?: Record<string, string | string[] | undefined>;
    }>();

    const email = request.user?.email?.trim().toLowerCase();
    if (!email) {
      throw new ForbiddenException('Foydalanuvchi autentifikatsiyadan o\'tmagan.');
    }

    const body = request.body ?? {};
    const marketId = this.readRequestValue(request, 'marketId', body.marketId ?? body.market);
    const warehouseId = this.readRequestValue(request, 'warehouseId', body.warehouseId);
    const productId = request.params?.id;

    let resolvedMarketId = marketId;
    let resolvedWarehouseId = warehouseId;

    if (productId && (!resolvedMarketId || !resolvedWarehouseId)) {
      if (!isUUID(productId)) {
        throw new BadRequestException('Product ID UUID formatida bo\'lishi kerak.');
      }
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { marketId: true, warehouseId: true },
      });
      if (!product) {
        throw new NotFoundException('Product topilmadi.');
      }
      resolvedMarketId ??= product.marketId;
      resolvedWarehouseId ??= product.warehouseId;
    }

    if (!resolvedMarketId || !isUUID(resolvedMarketId)) {
      throw new BadRequestException('marketId UUID formatida kiritilishi shart.');
    }
    if (!resolvedWarehouseId || !isUUID(resolvedWarehouseId)) {
      throw new BadRequestException('warehouseId UUID formatida kiritilishi shart.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      throw new ForbiddenException('Foydalanuvchi topilmadi.');
    }

    const market = await this.prisma.market.findFirst({
      where: { id: resolvedMarketId, email },
      select: { id: true },
    });

    const isWorker = await this.prisma.worker.findFirst({
      where: {
        marketId: resolvedMarketId,
        userId: user.id,
        role: { in: ['admin', 'owner'] },
      },
      select: { id: true },
    });

    if (!market && !isWorker) {
      throw new ForbiddenException(
        'Sizda bu marketda o\'zgartirish kiritish huquqi yo\'q.',
      );
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: resolvedWarehouseId, marketId: resolvedMarketId },
      select: { id: true },
    });
    if (!warehouse) {
      throw new ForbiddenException(
        'Tanlangan warehouse ushbu marketga tegishli emas.',
      );
    }

    request.body = {
      ...body,
      marketId: resolvedMarketId,
      warehouseId: resolvedWarehouseId,
    };
    return true;
  }

  private readRequestValue(
    request: { headers?: Record<string, string | string[] | undefined> },
    key: string,
    bodyValue: unknown,
  ): string | undefined {
    const headerKeys =
      key === 'marketId'
        ? ['marketId', 'marketid', 'market-id']
        : ['warehouseId', 'warehouseid', 'warehouse-id'];
    const headerValue = headerKeys
      .map((headerKey) => request.headers?.[headerKey])
      .find((value) => value !== undefined);
    const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    return typeof value === 'string' && value.trim()
      ? value.trim()
      : typeof bodyValue === 'string' && bodyValue.trim()
        ? bodyValue.trim()
        : undefined;
  }
}
