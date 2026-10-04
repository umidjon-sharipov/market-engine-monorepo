import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseFloatPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePickPointDto,
  UpdatePickPointDto,
} from './dto/pickpoint.dto';
import { PickPointsService } from './pickpoints.service';

interface AuthenticatedRequest extends Request {
  user?: { email?: string };
}

@Controller('pickpoints')
export class PickPointsController {
  constructor(
    private readonly pickPoints: PickPointsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('marketId', ParseUUIDPipe) marketId: string,
  ) {
    await this.assertAccess(request, marketId, 'get');
    return this.pickPoints.findAll(marketId);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics(
    @Req() request: AuthenticatedRequest,
    @Query('marketId', ParseUUIDPipe) marketId: string,
  ) {
    await this.assertAccess(request, marketId, 'get');
    return this.pickPoints.getMetrics(marketId);
  }

  @Get('nearest')
  findNearest(
    @Query('marketId', ParseUUIDPipe) marketId: string,
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
  ) {
    return this.pickPoints.findNearest(marketId, latitude, longitude);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const marketId = await this.pickPoints.getMarketId(id);
    await this.assertAccess(request, marketId, 'get');
    return this.pickPoints.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreatePickPointDto,
  ) {
    await this.assertAccess(request, body.marketId, 'create');
    return this.pickPoints.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePickPointDto,
  ) {
    const marketId = await this.pickPoints.getMarketId(id);
    await this.assertAccess(request, marketId, 'update');
    return this.pickPoints.update(id, marketId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const marketId = await this.pickPoints.getMarketId(id);
    await this.assertAccess(request, marketId, 'delete');
    return this.pickPoints.delete(id, marketId);
  }

  private async assertAccess(
    request: AuthenticatedRequest,
    marketId: string,
    action: 'get' | 'create' | 'update' | 'delete',
  ) {
    const email = request.user?.email;
    if (!email || !marketId) {
      throw new BadRequestException(
        'Market va autentifikatsiya ma’lumotlari talab qilinadi.',
      );
    }

    const GuardClass = MarketAccessGuard(
      'pickpoint',
      email,
      ['owner', 'admin', 'warehouse', 'manager'],
      marketId,
      action,
    );
    const allowed = await new GuardClass(this.prisma).canActivate(
      new ExecutionContextHost([request]),
    );
    if (!allowed) {
      throw new ForbiddenException('Bu market uchun ruxsat mavjud emas.');
    }
  }
}
