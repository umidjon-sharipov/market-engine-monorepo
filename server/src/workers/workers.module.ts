import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { WorkerRepository } from './worker.repository';

@Module({
    controllers: [WorkersController],
    providers: [WorkersService, WorkerRepository],
})
export class WorkersModule { }