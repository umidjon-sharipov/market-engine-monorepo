import { Injectable } from '@nestjs/common';
import { Prisma, Vacancy } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VacancyRepository extends BaseCrudService<
  Vacancy,
  Prisma.VacancyWhereUniqueInput,
  Prisma.VacancyFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.vacancy as unknown as RepositoryDelegate<Vacancy>);
  }
}
