import { Injectable } from '@nestjs/common';
import { Market, Prisma } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketRepository extends BaseCrudService<
  Market,
  Prisma.MarketWhereUniqueInput,
  Prisma.MarketFindManyArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.market as unknown as RepositoryDelegate<Market>);
  }

  findByEmail(email: string) {
    return this.prisma.market.findMany({ where: { email }, orderBy: { createdAt: 'desc' } });
  }
}
