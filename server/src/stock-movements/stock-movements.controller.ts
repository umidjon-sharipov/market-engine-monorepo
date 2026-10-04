import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { MovementStatus, MovementType } from '@prisma/client';
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

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('marketId', ParseUUIDPipe) marketId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    if (type && !Object.values(MovementType).includes(type as MovementType)) {
      throw new BadRequestException('Stock movement turi noto‘g‘ri.');
    }
    if (
      status &&
      !Object.values(MovementStatus).includes(status as MovementStatus)
    ) {
      throw new BadRequestException('Stock movement statusi noto‘g‘ri.');
    }
    await this.assertAccess(request, marketId, 'get');
    return this.movements.findAll(marketId, {
      type: type as MovementType | undefined,
      status: status as MovementStatus | undefined,
    });
  }

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
    if (body.type === MovementType.INBOUND) {
      await this.assertAccess(request, product.marketId, 'income');
    } else if (body.type === MovementType.TRANSFER) {
      await this.assertAccess(request, product.marketId, 'expense');
      await this.assertAccess(request, product.marketId, 'income');
    } else {
      await this.assertAccess(request, product.marketId, 'expense');
    }
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
        type: true,
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
    const marketIds = [
      ...new Set(warehouses.map((warehouse) => warehouse.marketId)),
    ];
    if (marketIds.length !== 1) {
      throw new BadRequestException(
        'Stock movement omborlari bir marketga tegishli bo‘lishi shart.',
      );
    }
    if (body.status === 'CANCELLED') {
      await this.assertAccess(request, marketIds[0], 'update');
    } else if (movement.type === MovementType.INBOUND) {
      await this.assertAccess(request, marketIds[0], 'income');
    } else if (movement.type === MovementType.TRANSFER) {
      await this.assertAccess(request, marketIds[0], 'expense');
      await this.assertAccess(request, marketIds[0], 'income');
    } else {
      await this.assertAccess(request, marketIds[0], 'expense');
    }
    return this.movements.updateStatus(id, body.status);
  }

  private async assertAccess(
    request: AuthenticatedRequest,
    marketId: string,
    action: 'get' | 'create' | 'update' | 'income' | 'expense',
  ) {
    const email = request.user?.email;
    if (!email)
      throw new ForbiddenException('Autentifikatsiya talab qilinadi.');
    const Guard = MarketAccessGuard(
      'warehouse',
      email,
      ['admin', 'warehouse', 'manager', 'owner'],
      marketId,
      action,
    );
    const allowed = await new Guard(this.prisma).canActivate(
      new ExecutionContextHost([request]),
    );
    if (!allowed)
      throw new ForbiddenException('Stock movement uchun ruxsat yo‘q.');
  }
}
