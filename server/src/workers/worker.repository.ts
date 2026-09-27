import { Injectable } from '@nestjs/common';
import { Prisma, Worker } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkerRepository extends BaseCrudService<
  Worker,
  Prisma.WorkerWhereUniqueInput,
  Prisma.WorkerFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.worker as unknown as RepositoryDelegate<Worker>);
  }
}
