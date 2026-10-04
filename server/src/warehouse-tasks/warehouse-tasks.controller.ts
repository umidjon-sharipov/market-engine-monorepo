import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ExecutionContext,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WarehouseTaskStatus } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWarehouseTaskDto,
  UpdateWarehouseTaskDto,
  UpdateWarehouseTaskStatusDto,
} from './dto/warehouse-task.dto';
import { WarehouseTasksService } from './warehouse-tasks.service';

type AuthenticatedRequest = Request & {
  user?: { email?: string };
};

@Controller('warehouse-tasks')
@UseGuards(JwtAuthGuard)
export class WarehouseTasksController {
  constructor(
    private readonly tasks: WarehouseTasksService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('marketId', ParseUUIDPipe) marketId: string,
    @Query('status') status?: string,
    @Query('assignedWorkerId') assignedWorkerId?: string,
    @Query('page') rawPage = '1',
    @Query('limit') rawLimit = '50',
  ) {
    if (
      status &&
      !Object.values(WarehouseTaskStatus).includes(
        status as WarehouseTaskStatus,
      )
    ) {
      throw new BadRequestException('Warehouse task statusi noto‘g‘ri.');
    }
    if (assignedWorkerId && !this.isUuid(assignedWorkerId)) {
      throw new BadRequestException('Worker ID UUID formatida bo‘lishi kerak.');
    }
    await this.assertAccess(request, marketId, 'get');
    const page = this.parsePositiveInteger(rawPage, 'page');
    const limit = Math.min(this.parsePositiveInteger(rawLimit, 'limit'), 100);
    return this.tasks.findAll(marketId, {
      status: status as WarehouseTaskStatus | undefined,
      assignedWorkerId,
      page,
      limit,
    });
  }

  @Get('options')
  async findOptions(
    @Req() request: AuthenticatedRequest,
    @Query('marketId', ParseUUIDPipe) marketId: string,
  ) {
    await this.assertAccess(request, marketId, 'get');
    return this.tasks.findOptions(marketId);
  }

  @Get(':id')
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('marketId', ParseUUIDPipe) marketId: string,
  ) {
    await this.assertAccess(request, marketId, 'get');
    const task = await this.tasks.findOne(marketId, id);
    if (!task) throw new NotFoundException('Warehouse task topilmadi.');
    return task;
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateWarehouseTaskDto,
  ) {
    await this.assertAccess(request, body.marketId, 'create');
    const creatorWorkerId = await this.tasks.resolveWorkerId(
      request.user?.email,
      body.marketId,
    );
    return this.tasks.create(body.marketId, body, creatorWorkerId);
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('marketId', ParseUUIDPipe) marketId: string,
    @Body() body: UpdateWarehouseTaskDto,
  ) {
    await this.assertTaskAccess(request, id, marketId, 'update');
    return this.tasks.update(marketId, id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('marketId', ParseUUIDPipe) marketId: string,
    @Body() body: UpdateWarehouseTaskStatusDto,
  ) {
    await this.assertTaskAccess(request, id, marketId, 'update');
    const actorWorkerId = await this.tasks.resolveWorkerId(
      request.user?.email,
      marketId,
    );
    return this.tasks.updateStatus(marketId, id, body.status, actorWorkerId);
  }

  @Delete(':id')
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('marketId', ParseUUIDPipe) marketId: string,
  ) {
    await this.assertTaskAccess(request, id, marketId, 'delete');
    return this.tasks.remove(marketId, id);
  }

  private async assertTaskAccess(
    request: AuthenticatedRequest,
    id: string,
    marketId: string,
    action: 'update' | 'delete',
  ) {
    const task = await this.prisma.warehouseTask.findFirst({
      where: { id, marketId },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Warehouse task topilmadi.');
    await this.assertAccess(request, marketId, action);
  }

  private async assertAccess(
    request: AuthenticatedRequest,
    marketId: string,
    action: 'get' | 'create' | 'update' | 'delete',
  ) {
    const email = request.user?.email;
    if (!email) {
      throw new ForbiddenException('Autentifikatsiya talab qilinadi.');
    }
    const Guard = MarketAccessGuard(
      'warehouse',
      email,
      ['owner', 'admin', 'warehouse', 'manager'],
      marketId,
      action,
    );
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    if (!(await new Guard(this.prisma).canActivate(context))) {
      throw new ForbiddenException('Warehouse task uchun ruxsat mavjud emas.');
    }
  }

  private parsePositiveInteger(value: string, name: string) {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${name} musbat butun son bo‘lishi kerak.`);
    }
    return parsed;
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
