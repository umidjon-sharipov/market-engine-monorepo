import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { AuthModule } from '../auth/auth.module';
import { MarketRepository } from './market.repository';

@Module({
  imports: [AuthModule],
  controllers: [MarketsController],
  providers: [MarketsService, MarketRepository],
})
export class MarketsModule {}