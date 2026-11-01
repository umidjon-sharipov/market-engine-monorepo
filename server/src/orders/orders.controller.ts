import {
  Controller,
  Get,
  Post,
  Body,
  ForbiddenException,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
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
import { WORKER_ROLES } from '../workers/worker-permissions';
import { Throttle } from '@nestjs/throttler';

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
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('marketId', ParseUUIDPipe) marketId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    await this.authorize(request, marketId, 'get');
    return this.ordersService.findAll(marketId, page, limit);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { marketId: true },
    });
    if (!order?.marketId) throw new NotFoundException('Marketga bog‘langan order topilmadi.');
    await this.authorize(request, order.marketId, 'update');
    return this.ordersService.updateStatus(id, body);
  }

  private async authorize(
    request: AuthenticatedRequest,
    marketId: string,
    action: 'get' | 'update',
  ) {
    if (!request.user?.email) {
      throw new ForbiddenException('Autentifikatsiya talab qilinadi.');
    }
    const Guard = MarketAccessGuard(
      'order',
      request.user.email,
      [...WORKER_ROLES, 'owner'],
      marketId,
      action,
    );
    const allowed = await new Guard(this.prisma).canActivate(
      new ExecutionContextHost([request]),
    );
    if (!allowed) {
      throw new ForbiddenException(`Order uchun ${action} ruxsati yo‘q.`);
    }
  }
}