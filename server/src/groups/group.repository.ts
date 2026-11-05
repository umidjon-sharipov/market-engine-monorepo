import { Injectable } from '@nestjs/common';
import { Group } from '@prisma/client';
import { BaseCrudService } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupRepository extends BaseCrudService<
  Group,
  { id?: string; url?: string }
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.group);
  }

  findByUrl(url: string): Promise<Group | null> {
    return this.prisma.group.findUnique({ where: { url } });
  }
}
