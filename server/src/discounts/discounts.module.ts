import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountRepository } from './discount.repository';

@Module({
  controllers: [DiscountsController],
  providers: [DiscountsService, DiscountRepository],
})
export class DiscountsModule {}