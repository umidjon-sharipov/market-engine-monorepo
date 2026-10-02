import { ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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

  findAllForUser(userId: string, marketId?: string) {
    return this.prisma.following.findMany({
      where: { userId, ...(marketId && { marketId }) },
      orderBy: { updatedAt: 'desc' },
      include: followingInclude,
    });
  }

  findMine(userId: string) {
    return this.prisma.following.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: followingInclude,
    }).then(records => records.filter(record =>
      Array.isArray(record.follow) && record.follow.length % 2 === 1
    ));
  }

  async searchMarketsForUser(userId: string, query: string) {
    const markets = await this.prisma.market.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
      },
      orderBy: { title: 'asc' },
      take: 20,
      select: {
        id: true,
        title: true,
        logo: true,
        followers: {
          where: { userId },
          select: { id: true, follow: true, block: true },
          take: 1,
        },
      },
    });

    return markets.map(({ followers, ...market }) => ({
      ...market,
      following: followers[0] ?? null,
    }));
  }

  async toggleFollow(userId: string, marketId: string) {
    const updated = await this.prisma.$queryRaw<Following[]>(Prisma.sql`
      INSERT INTO "Followings" ("id", "userId", "marketId", "follow", "block", "createdAt", "updatedAt")
      VALUES (
        ${randomUUID()}::uuid,
        ${userId}::uuid,
        ${marketId}::uuid,
        jsonb_build_array(to_jsonb(clock_timestamp())),
        '[]'::jsonb,
        clock_timestamp(),
        clock_timestamp()
      )
      ON CONFLICT ("userId", "marketId") DO UPDATE
      SET
        "follow" = CASE
          WHEN jsonb_typeof("Followings"."follow") = 'array'
            THEN "Followings"."follow" || jsonb_build_array(to_jsonb(clock_timestamp()))
          ELSE jsonb_build_array(to_jsonb(clock_timestamp()))
        END,
        "updatedAt" = clock_timestamp()
      WHERE
        CASE
          WHEN jsonb_typeof("Followings"."follow") = 'array'
            THEN jsonb_array_length("Followings"."follow")
          ELSE 0
        END % 2 = 1
        OR CASE
          WHEN jsonb_typeof("Followings"."block") = 'array'
            THEN jsonb_array_length("Followings"."block")
          ELSE 0
        END % 2 = 0
      RETURNING *
    `);

    if (!updated.length) {
      throw new ForbiddenException('Bu market sizni bloklaganligi sababli kuzata olmaysiz.');
    }
    return updated[0];
  }

  async toggleBlock(userId: string, marketId: string) {
    const updated = await this.prisma.$queryRaw<Following[]>(Prisma.sql`
      INSERT INTO "Followings" ("id", "userId", "marketId", "follow", "block", "createdAt", "updatedAt")
      VALUES (
        ${randomUUID()}::uuid,
        ${userId}::uuid,
        ${marketId}::uuid,
        '[]'::jsonb,
        jsonb_build_array(to_jsonb(clock_timestamp())),
        clock_timestamp(),
        clock_timestamp()
      )
      ON CONFLICT ("userId", "marketId") DO UPDATE
      SET
        "block" = CASE
          WHEN jsonb_typeof("Followings"."block") = 'array'
            THEN "Followings"."block" || jsonb_build_array(to_jsonb(clock_timestamp()))
          ELSE jsonb_build_array(to_jsonb(clock_timestamp()))
        END,
        "updatedAt" = clock_timestamp()
      RETURNING *
    `);
    return updated[0];
  }
}
