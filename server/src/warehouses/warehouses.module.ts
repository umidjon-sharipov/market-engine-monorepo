import { Module } from '@nestjs/common';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { WarehouseRepository } from './warehouse.repository';

@Module({
    controllers: [WarehousesController],
    providers: [WarehousesService, WarehouseRepository],
})
export class WarehousesModule { }