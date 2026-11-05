import { Injectable } from '@nestjs/common';
import { Prisma, Warehouse } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WarehouseRepository extends BaseCrudService<
  Warehouse,
  Prisma.WarehouseWhereUniqueInput,
  Prisma.WarehouseFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.warehouse as unknown as RepositoryDelegate<Warehouse>);
  }
}
