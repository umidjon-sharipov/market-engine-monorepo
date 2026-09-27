import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MarketRepository } from './market.repository';
import { CreateMarketDto, UpdateMarketDto } from './dto/create-market.dto';

@Injectable()
export class MarketsService {
  constructor(private readonly markets: MarketRepository) {}

  findAll() { return this.markets.findAll({ orderBy: { createdAt: 'desc' } }); }

  findOne(id: string) { return this.markets.findOne({ id }); }

  findByUser(email: string) { return this.markets.findByEmail(email); }

  create(body: CreateMarketDto, email: string) {
    return this.markets.create({ ...body, email } as Prisma.MarketCreateInput);
  }

  update(id: string, body: UpdateMarketDto) {
    return this.markets.update({ id }, body as Prisma.MarketUpdateInput);
  }

  async delete(id: string) {
    const deleted = await this.markets.delete({ id });
    return { message: 'Do\'kon muvaffaqiyatli o\'chirildi', deletedMarket: deleted };
  }
}
