import { Module } from '@nestjs/common';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  controllers: [ReactionsController],
  providers: [ReactionsService],
})
export class ReactionsModule {}