import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import {
  BaseCrudService,
  RepositoryDelegate,
} from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductRepository extends BaseCrudService<
  Product,
  Prisma.ProductWhereUniqueInput,
  Prisma.ProductFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(
      prisma.product as unknown as RepositoryDelegate<Product>,
    );
  }
}
