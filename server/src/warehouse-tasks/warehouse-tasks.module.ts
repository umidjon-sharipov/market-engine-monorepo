import { Module } from '@nestjs/common';
import { WarehouseTasksController } from './warehouse-tasks.controller';
import { WarehouseTasksService } from './warehouse-tasks.service';

@Module({
  controllers: [WarehouseTasksController],
  providers: [WarehouseTasksService],
})
export class WarehouseTasksModule {}
