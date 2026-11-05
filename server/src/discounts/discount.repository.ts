import { Injectable } from '@nestjs/common';
import { Discount, Prisma } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscountRepository extends BaseCrudService<
  Discount,
  Prisma.DiscountWhereUniqueInput,
  Prisma.DiscountFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.discount as unknown as RepositoryDelegate<Discount>);
  }
}
