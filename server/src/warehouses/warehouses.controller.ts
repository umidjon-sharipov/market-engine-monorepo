import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
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
  CreateStorageBinDto,
  UpdateStorageBinDto,
} from './dto/create-storage-bin.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import {
  CreateWarehouseZoneDto,
  UpdateWarehouseZoneDto,
} from './dto/create-warehouse-zone.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehousesService } from './warehouses.service';

interface AuthenticatedRequest extends Request {
  user?: { email?: string };
}

@Controller('warehouses')
export class WarehousesController {
  constructor(
    private readonly warehousesService: WarehousesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('marketId', ParseUUIDPipe) marketId: string,
  ) {
    await this.assertAccess(request, marketId, 'get');
    return this.warehousesService.findAll(marketId);
  }

  @Get(':id/inventory')
  @UseGuards(JwtAuthGuard)
  async getInventory(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const marketId = await this.warehousesService.getWarehouseMarketId(id);
    await this.assertAccess(request, marketId, 'get');
    return this.warehousesService.findInventory(id);
  }

  @Get(':id/bins/:binId/inventory')
  @UseGuards(JwtAuthGuard)
  async getBinInventory(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('binId', ParseUUIDPipe) binId: string,
    @Query('search') search = '',
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    const marketId = await this.warehousesService.getWarehouseMarketId(id);
    await this.assertAccess(request, marketId, 'get');
    return this.warehousesService.searchBinInventory(id, binId, search, page, limit);
  }

  @Get(':id/zones')
  @UseGuards(JwtAuthGuard)
  async findZones(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const marketId = await this.warehousesService.getWarehouseMarketId(id);
    await this.assertAccess(request, marketId, 'get');
    return this.warehousesService.findZones(id);
  }

  @Post(':id/zones')
  @UseGuards(JwtAuthGuard)
  async createZone(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateWarehouseZoneDto,
  ) {
    const marketId = await this.warehousesService.getWarehouseMarketId(id);
    await this.assertAccess(request, marketId, 'create');
    return this.warehousesService.createZone(id, body);
  }

  @Patch('zones/:zoneId')
  @UseGuards(JwtAuthGuard)
  async updateZone(
    @Req() request: AuthenticatedRequest,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Body() body: UpdateWarehouseZoneDto,
  ) {
    const marketId = await this.warehousesService.getZoneMarketId(zoneId);
    await this.assertAccess(request, marketId, 'update');
    return this.warehousesService.updateZone(zoneId, body);
  }

  @Delete('zones/:zoneId')
  @UseGuards(JwtAuthGuard)
  async deleteZone(
    @Req() request: AuthenticatedRequest,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
  ) {
    const marketId = await this.warehousesService.getZoneMarketId(zoneId);
    await this.assertAccess(request, marketId, 'delete');
    return this.warehousesService.deleteZone(zoneId);
  }

  @Get('zones/:zoneId/bins')
  @UseGuards(JwtAuthGuard)
  async findBins(
    @Req() request: AuthenticatedRequest,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
  ) {
    const marketId = await this.warehousesService.getZoneMarketId(zoneId);
    await this.assertAccess(request, marketId, 'get');
    return this.warehousesService.findBins(zoneId);
  }

  @Get('bins/search')
  @UseGuards(JwtAuthGuard)
  async searchBins(
    @Req() request: AuthenticatedRequest,
    @Query('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query('search') search = '',
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    const marketId = await this.warehousesService.getWarehouseMarketId(warehouseId);
    await this.assertAccess(request, marketId, 'get');
    return this.warehousesService.searchBins(warehouseId, search, page, limit);
  }

  @Post('bins')
  @UseGuards(JwtAuthGuard)
  async createBin(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateStorageBinDto,
  ) {
    const marketId = await this.warehousesService.getZoneMarketId(body.zoneId);
    await this.assertAccess(request, marketId, 'create');
    return this.warehousesService.createBin(body);
  }

  @Patch('bins/:binId')
  @UseGuards(JwtAuthGuard)
  async updateBin(
    @Req() request: AuthenticatedRequest,
    @Param('binId', ParseUUIDPipe) binId: string,
    @Body() body: UpdateStorageBinDto,
  ) {
    const marketId = await this.warehousesService.getBinMarketId(binId);
    if (body.zoneId) {
      const targetMarketId = await this.warehousesService.getZoneMarketId(
        body.zoneId,
      );
      if (targetMarketId !== marketId) {
        throw new BadRequestException(
          'Yacheykani boshqa market zone’iga ko‘chirish mumkin emas.',
        );
      }
      const [current, targetWarehouseId] = await Promise.all([
        this.warehousesService.getBinWarehouseId(binId),
        this.warehousesService.getZoneWarehouseId(body.zoneId),
      ]);
      if (current.isReferenced && current.warehouseId !== targetWarehouseId) {
        throw new BadRequestException(
          'Harakatlar yoki qoldiqlar bilan bog‘langan yacheykani boshqa omborga ko‘chirish mumkin emas.',
        );
      }
    }
    await this.assertAccess(request, marketId, 'update');
    return this.warehousesService.updateBin(binId, body);
  }

  @Delete('bins/:binId')
  @UseGuards(JwtAuthGuard)
  async deleteBin(
    @Req() request: AuthenticatedRequest,
    @Param('binId', ParseUUIDPipe) binId: string,
  ) {
    const marketId = await this.warehousesService.getBinMarketId(binId);
    await this.assertAccess(request, marketId, 'delete');
    return this.warehousesService.deleteBin(binId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const marketId = await this.warehousesService.getWarehouseMarketId(id);
    await this.assertAccess(request, marketId, 'get');
    return this.warehousesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateWarehouseDto,
  ) {
    await this.assertAccess(request, body.marketId, 'create');
    return this.warehousesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateWarehouseDto,
  ) {
    const originalMarketId =
      await this.warehousesService.getWarehouseMarketId(id);
    const marketId = body.marketId ?? originalMarketId;
    await this.assertAccess(request, originalMarketId, 'update');
    if (marketId !== originalMarketId) {
      await this.assertAccess(request, marketId, 'create');
    }
    return this.warehousesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const marketId = await this.warehousesService.getWarehouseMarketId(id);
    await this.assertAccess(request, marketId, 'delete');
    return this.warehousesService.delete(id);
  }

  private async assertAccess(
    request: AuthenticatedRequest,
    marketId: string,
    action: 'get' | 'create' | 'update' | 'delete',
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
    if (!allowed) throw new ForbiddenException('Warehouse uchun ruxsat yo‘q.');
  }
}
