import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateStockMovementDto,
  UpdateStockMovementStatusDto,
} from './dto/create-stock-movement.dto';
import { StockMovementsService } from './stock-movements.service';

interface AuthenticatedRequest extends Request {
  user?: { email?: string };
}

@Controller('stock-movements')
@UseGuards(JwtAuthGuard)
export class StockMovementsController {
  constructor(
    private readonly movements: StockMovementsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateStockMovementDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: body.productId },
      select: { marketId: true },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi.');
    await this.assertAccess(request, product.marketId, 'create');
    return this.movements.create(body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateStockMovementStatusDto,
  ) {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id },
      select: {
        fromWarehouseId: true,
        toWarehouseId: true,
      },
    });
    if (!movement) throw new NotFoundException('Stock movement topilmadi.');
    const warehouseIds = [
      ...new Set(
        [movement.fromWarehouseId, movement.toWarehouseId].filter(
          (warehouseId): warehouseId is string => !!warehouseId,
        ),
      ),
    ];
    const warehouses = await this.prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { marketId: true },
    });
    const marketIds = [...new Set(warehouses.map((warehouse) => warehouse.marketId))];
    if (marketIds.length !== 1) {
      throw new BadRequestException(
        'Stock movement omborlari bir marketga tegishli bo‘lishi shart.',
      );
    }
    await this.assertAccess(request, marketIds[0], 'update');
    return this.movements.updateStatus(id, body.status);
  }

  private async assertAccess(
    request: AuthenticatedRequest,
    marketId: string,
    action: 'create' | 'update',
  ) {
    const email = request.user?.email;
    if (!email) throw new ForbiddenException('Autentifikatsiya talab qilinadi.');
    const Guard = MarketAccessGuard(
      'warehouse',
      email,
      ['owner', 'admin', 'manager'],
      marketId,
      action,
    );
    const allowed = await new Guard(this.prisma).canActivate(
      new ExecutionContextHost([request]),
    );
    if (!allowed) throw new ForbiddenException('Stock movement uchun ruxsat yo‘q.');
  }
}
