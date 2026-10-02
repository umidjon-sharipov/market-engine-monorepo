import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.follower.findMany({
      where: { userId },
    });
  }

  async usersAll(userId: string, marketId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const [worker, market] = await Promise.all([
      this.prisma.worker.findFirst({
        where: {
          userId: user.id,
          marketId: marketId,
          role: { in: ['admin', 'owner', 'manager'] },
        },
        select: { id: true },
      }),
      this.prisma.market.findUnique({
        where: { id: marketId },
        select: { id: true, email: true },
      }),
    ]);

    if (!market) throw new NotFoundException('Market topilmadi.');

    const isOwner = market.email.toLowerCase() === user.email.toLowerCase();
    if (!isOwner && !worker) {
      throw new ForbiddenException(
        'Sizda bu market maʼlumotlarini koʻrish uchun huquq yoʻq',
      );
    }

    const records = await this.prisma.following.findMany({
      where: { marketId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        follow: true,
        block: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            userName: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            image: true,
            bio: true,
            createdAt: true,
          },
        },
      },
    });

    return records
      .filter(
        (record) => Array.isArray(record.follow) && record.follow.length > 0,
      )
      .map((record) => ({
        id: record.id,
        user: record.user,
        follow: record.follow,
        block: record.block,
        createdAt: record.user.createdAt,
        updatedAt: record.updatedAt,
      }));
  }
}
