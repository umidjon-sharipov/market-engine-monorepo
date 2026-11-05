import { Injectable } from '@nestjs/common';
import { Comment, Prisma } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentRepository extends BaseCrudService<
  Comment,
  Prisma.CommentWhereUniqueInput,
  Prisma.CommentFindManyArgs
> {
  constructor(prisma: PrismaService) {
    super(prisma.comment as unknown as RepositoryDelegate<Comment>);
  }
}
