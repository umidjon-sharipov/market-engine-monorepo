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
} from './dto/bin/create-storage-bin.dto';
import { CreateWarehouseDto } from './dto/warehouse/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/warehouse/update-warehouse.dto';
import {
    CreateWarehouseZoneDto,
    UpdateWarehouseZoneDto,
} from './dto/zone/create-warehouse-zone.dto';
import {
    CreateWarehouseAisleDto,
    UpdateWarehouseAisleDto,
} from './dto/aisle/create-warehouse-aisle.dto';
import {
    CreateWarehouseRackDto,
    UpdateWarehouseRackDto,
} from './dto/rack/create-warehouse-rack.dto';
import {
    CreateWarehouseShelfDto,
    UpdateWarehouseShelfDto,
} from './dto/shelf/create-warehouse-shelf.dto';
import { WarehousesService } from './warehouses.service';

interface AuthenticatedRequest extends Request {
    user?: { email?: string };
}

@Controller('warehouses')
export class WarehousesController {
    constructor(
        private readonly warehousesService: WarehousesService,
        private readonly prisma: PrismaService,
    ) { }

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

    // --- AISLE ENDPOINTS ---
    @Post('aisles')
    @UseGuards(JwtAuthGuard)
    async createAisle(
        @Req() request: AuthenticatedRequest,
        @Body() body: CreateWarehouseAisleDto,
    ) {
        const marketId = await this.warehousesService.getAisleMarketId(body.zoneId);
        await this.assertAccess(request, marketId, 'create');
        return this.warehousesService.createAisle(body);
    }

    @Patch('aisles/:aisleId')
    @UseGuards(JwtAuthGuard)
    async updateAisle(
        @Req() request: AuthenticatedRequest,
        @Param('aisleId', ParseUUIDPipe) aisleId: string,
        @Body() body: UpdateWarehouseAisleDto,
    ) {
        const marketId = await this.warehousesService.getAisleMarketIdByAisleId(aisleId);
        await this.assertAccess(request, marketId, 'update');
        return this.warehousesService.updateAisle(aisleId, body);
    }

    @Delete('aisles/:aisleId')
    @UseGuards(JwtAuthGuard)
    async deleteAisle(
        @Req() request: AuthenticatedRequest,
        @Param('aisleId', ParseUUIDPipe) aisleId: string,
    ) {
        const marketId = await this.warehousesService.getAisleMarketIdByAisleId(aisleId);
        await this.assertAccess(request, marketId, 'delete');
        return this.warehousesService.deleteAisle(aisleId);
    }

    // --- RACK ENDPOINTS ---
    @Post('racks')
    @UseGuards(JwtAuthGuard)
    async createRack(
        @Req() request: AuthenticatedRequest,
        @Body() body: CreateWarehouseRackDto,
    ) {
        const marketId = await this.warehousesService.getRackMarketId(body.aisleId);
        await this.assertAccess(request, marketId, 'create');
        return this.warehousesService.createRack(body);
    }

    @Patch('racks/:rackId')
    @UseGuards(JwtAuthGuard)
    async updateRack(
        @Req() request: AuthenticatedRequest,
        @Param('rackId', ParseUUIDPipe) rackId: string,
        @Body() body: UpdateWarehouseRackDto,
    ) {
        const marketId = await this.warehousesService.getRackMarketIdByRackId(rackId);
        await this.assertAccess(request, marketId, 'update');
        return this.warehousesService.updateRack(rackId, body);
    }

    @Delete('racks/:rackId')
    @UseGuards(JwtAuthGuard)
    async deleteRack(
        @Req() request: AuthenticatedRequest,
        @Param('rackId', ParseUUIDPipe) rackId: string,
    ) {
        const marketId = await this.warehousesService.getRackMarketIdByRackId(rackId);
        await this.assertAccess(request, marketId, 'delete');
        return this.warehousesService.deleteRack(rackId);
    }

    // --- SHELF ENDPOINTS ---
    @Post('shelves')
    @UseGuards(JwtAuthGuard)
    async createShelf(
        @Req() request: AuthenticatedRequest,
        @Body() body: CreateWarehouseShelfDto,
    ) {
        const marketId = await this.warehousesService.getShelfMarketIdByRackId(body.rackId);
        await this.assertAccess(request, marketId, 'create');
        return this.warehousesService.createShelf(body);
    }

    @Patch('shelves/:shelfId')
    @UseGuards(JwtAuthGuard)
    async updateShelf(
        @Req() request: AuthenticatedRequest,
        @Param('shelfId', ParseUUIDPipe) shelfId: string,
        @Body() body: UpdateWarehouseShelfDto,
    ) {
        const marketId = await this.warehousesService.getShelfMarketId(shelfId);
        await this.assertAccess(request, marketId, 'update');
        return this.warehousesService.updateShelf(shelfId, body);
    }

    @Delete('shelves/:shelfId')
    @UseGuards(JwtAuthGuard)
    async deleteShelf(
        @Req() request: AuthenticatedRequest,
        @Param('shelfId', ParseUUIDPipe) shelfId: string,
    ) {
        const marketId = await this.warehousesService.getShelfMarketId(shelfId);
        await this.assertAccess(request, marketId, 'delete');
        return this.warehousesService.deleteShelf(shelfId);
    }

    // --- BIN ENDPOINTS ---
    @Post('bins')
    @UseGuards(JwtAuthGuard)
    async createBin(
        @Req() request: AuthenticatedRequest,
        @Body() body: CreateStorageBinDto,
    ) {
        const marketId = await this.warehousesService.getShelfMarketId(body.shelfId);
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
        if (body.shelfId) {
            const targetMarketId = await this.warehousesService.getShelfMarketId(body.shelfId);
            if (targetMarketId !== marketId) {
                throw new BadRequestException('Yacheykani boshqa market shelf’iga ko‘chirish mumkin emas.');
            }
            const [current, targetWarehouseId] = await Promise.all([
                this.warehousesService.getBinWarehouseId(binId),
                this.warehousesService.getShelfWarehouseId(body.shelfId),
            ]);
            if (current.isReferenced && current.warehouseId !== targetWarehouseId) {
                throw new BadRequestException('Harakatlar yoki qoldiqlar bilan bog‘langan yacheykani boshqa omborga ko‘chirish mumkin emas.');
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
        const originalMarketId = await this.warehousesService.getWarehouseMarketId(id);
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
        if (!email) throw new ForbiddenException('Autentifikatsiya talab qilinadi.');
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