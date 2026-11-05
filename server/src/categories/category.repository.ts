import { Injectable } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryRepository extends BaseCrudService<
  Category,
  Prisma.CategoryWhereUniqueInput,
  Prisma.CategoryFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.category as unknown as RepositoryDelegate<Category>);
  }
}
