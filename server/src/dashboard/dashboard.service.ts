import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardItem {
    id: string;
    Dashboarding: string[];
    isBlocked: string[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userName: string) {
    const followers = await this.prisma.follower.findMany({
      where: {
        userId: {
            in: await this.prisma.user
                .findMany({
                    where: { userName },
                    select: { id: true },
                })
                .then((users) => users.map((u) => u.id)),
            },
      },
    });

    return followers;
  }

  async usersAll(userName: string, marketId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userName },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const [workerCheck, marketCheck] = await Promise.all([
        this.prisma.worker.findFirst({
            where: {
                userId: user.id,
                marketId: marketId,
                role: 'manager',
            },
            select: { id: true },
        }),
        this.prisma.market.findFirst({
                where: {
                id: marketId,
                email: user.email,
            },
            select: { id: true },
        }),
    ]);

    const isManager = Boolean(workerCheck);
    const isOwner = Boolean(marketCheck);

    if (!isManager && !isOwner) {
      throw new ForbiddenException(
        'Sizda bu market maʼlumotlarini koʻrish uchun huquq yoʻq',
      );
    }

    const followers = await this.prisma.follower.findMany({
        where: {
            following: {
            array_contains: [{ id: marketId }],
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const userIds = followers.map((f) => f.userId);

    const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return followers.map((follower) => {
        const followingArray = Array.isArray(follower.following)
            ? (follower.following as Array<{ id: string }>)
            : [];

        const matchedFollowing = followingArray.filter(
            (item) => item.id === marketId,
        );

        return {
            id: follower.id,
            user: userMap.get(follower.userId) || null,
            following: matchedFollowing.length > 0 ? matchedFollowing : null,
            createdAt: follower.createdAt,
        };
    });
  }
}