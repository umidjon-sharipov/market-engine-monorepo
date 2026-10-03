import {
  Controller,
  Get,
  Post,
  Body,
  ForbiddenException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedRequest extends Request {
  user?: { email?: string };
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll() {
    return await this.ordersService.findAll();
  }

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.create(createOrderDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    const reservations = await this.prisma.orderStockReservation.findMany({
      where: { orderId: id },
      select: { warehouseId: true },
    });
    if (!reservations.length) {
      throw new NotFoundException('Order uchun warehouse ruxsat ma’lumoti topilmadi.');
    }
    const warehouses = await this.prisma.warehouse.findMany({
      where: { id: { in: [...new Set(reservations.map((item) => item.warehouseId))] } },
      select: { marketId: true },
    });
    const marketIds = [...new Set(warehouses.map((warehouse) => warehouse.marketId))];
    const email = request.user?.email;
    if (!email) throw new ForbiddenException('Autentifikatsiya talab qilinadi.');

    for (const marketId of marketIds) {
      const Guard = MarketAccessGuard(
        'warehouse',
        email,
        ['owner', 'admin', 'manager'],
        marketId,
        'update',
      );
      const allowed = await new Guard(this.prisma).canActivate(
        new ExecutionContextHost([request]),
      );
      if (!allowed) throw new ForbiddenException('Order statusini o‘zgartirishga ruxsat yo‘q.');
    }
    return this.ordersService.updateStatus(id, body);
  }
}