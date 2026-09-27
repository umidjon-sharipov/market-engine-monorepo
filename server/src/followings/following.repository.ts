import { Injectable } from '@nestjs/common';
import { Following, Prisma } from '@prisma/client';
import { BaseCrudService, RepositoryDelegate } from '../common/services/base-crud.service';
import { PrismaService } from '../prisma/prisma.service';

const followingInclude = {
  user: { select: { id: true, userName: true, image: true } },
  market: { select: { id: true, title: true, logo: true } },
} satisfies Prisma.FollowingInclude;

@Injectable()
export class FollowingRepository extends BaseCrudService<
  Following,
  Prisma.FollowingWhereUniqueInput,
  Prisma.FollowingFindManyArgs
> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma.following as unknown as RepositoryDelegate<Following>);
  }

  findAllWithRelations(where?: Prisma.FollowingWhereInput) {
    return this.prisma.following.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: followingInclude,
    });
  }

  async toggleFollow(userId: string, marketId: string) {
    const current = await this.prisma.following.findUnique({
      where: { userId_marketId: { userId, marketId } },
    });
    return this.prisma.following.upsert({
      where: { userId_marketId: { userId, marketId } },
      create: { user: { connect: { id: userId } }, market: { connect: { id: marketId } } },
      update: { isFollowing: !(current?.isFollowing ?? false) },
      include: followingInclude,
    });
  }

  async toggleBlock(userId: string, marketId: string) {
    const current = await this.prisma.following.findUnique({
      where: { userId_marketId: { userId, marketId } },
    });
    return this.prisma.following.upsert({
      where: { userId_marketId: { userId, marketId } },
      create: {
        user: { connect: { id: userId } },
        market: { connect: { id: marketId } },
        isFollowing: false,
        isBlocked: true,
      },
      update: { isBlocked: !(current?.isBlocked ?? false) },
      include: followingInclude,
    });
  }
}
