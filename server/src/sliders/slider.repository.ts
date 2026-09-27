import { Injectable } from '@nestjs/common';
import { Prisma, Slider } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SliderRepository extends BaseCrudService<
  Slider,
  Prisma.SliderWhereUniqueInput,
  Prisma.SliderFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.slider as unknown as RepositoryDelegate<Slider>);
  }
}
