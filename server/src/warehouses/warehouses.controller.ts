import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('warehouses')
export class WarehousesController {
    constructor(private readonly warehousesService: WarehousesService, private readonly prisma: PrismaService) { }

    @Get()
    async findAll() {
        return await this.warehousesService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Req() req: any, @Body() body: CreateWarehouseDto) {
        const GuardClass = MarketAccessGuard('warehouse', req.user.email, ['admin', 'manager'], body.marketId, 'create');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        return await this.warehousesService.create(body);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: UpdateWarehouseDto,
    ) {
        const GuardClass = MarketAccessGuard('warehouse', req.user.email, ['admin', 'manager'], body.marketId, 'create');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        return await this.warehousesService.update(id, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Req() req: any, @Param('id') id: string) {
        const warehouse = await this.prisma.warehouse.findUnique({
            where: { id },
            select: { marketId: true },
        });

        if (!warehouse) {
            throw new NotFoundException('Warehouse topilmadi');
        }

        const GuardClass = MarketAccessGuard('warehouse', req.user.email, ['owner', 'admin'], warehouse.marketId || '', 'delete');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        return await this.warehousesService.delete(id);
    }
}