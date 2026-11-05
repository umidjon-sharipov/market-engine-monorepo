import { Module } from '@nestjs/common';
import { SlidersController } from './sliders.controller';
import { SlidersService } from './sliders.service';
import { SliderRepository } from './slider.repository';

@Module({
  controllers: [SlidersController],
  providers: [SlidersService, SliderRepository],
})
export class SlidersModule {}