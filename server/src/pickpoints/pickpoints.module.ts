import { Module } from '@nestjs/common';
import { PickPointsController } from './pickpoints.controller';
import { PickPointsService } from './pickpoints.service';

@Module({
  controllers: [PickPointsController],
  providers: [PickPointsService],
})
export class PickPointsModule {}
