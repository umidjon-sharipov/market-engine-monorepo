import {
  CanActivate,
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowingMarketAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { userId?: string; email?: string };
      params?: { marketId?: string };
      body?: { targetUserId?: string };
    }>();
    const userId = request.user?.userId;
    const marketId = request.params?.marketId;
    const targetUserId = request.body?.targetUserId;

    if (!userId || !marketId || !targetUserId) {
      throw new ForbiddenException('Market va target user maʼlumotlari talab qilinadi.');
    }
    if (!isUUID(marketId) || !isUUID(targetUserId)) {
      throw new BadRequestException('Market va target user ID UUID formatida boʻlishi kerak.');
    }

    const [market, targetUser, worker] = await Promise.all([
      this.prisma.market.findUnique({
        where: { id: marketId },
        select: { id: true, email: true },
      }),
      this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      }),
      this.prisma.worker.findFirst({
        where: {
          marketId,
          userId,
          role: { in: ['admin', 'owner', 'manager'] },
        },
        select: { role: true, permissions: true },
      }),
    ]);

    if (!market) throw new NotFoundException('Market topilmadi.');
    if (!targetUser) throw new NotFoundException('Foydalanuvchi topilmadi.');

    const isOwner = market.email.toLowerCase() === request.user?.email?.toLowerCase();
    const allowedPermissions = new Set([
      'users:block',
      'users:manage',
      'followings:block',
      'followings:manage',
    ]);
    const hasPermission = worker?.permissions.some(permission =>
      allowedPermissions.has(permission.toLowerCase())
    ) ?? false;
    const elevatedRole = worker?.role === 'admin' || worker?.role === 'owner';

    if (!isOwner && !elevatedRole && !hasPermission) {
      throw new ForbiddenException('Bu market foydalanuvchilarini bloklash huquqingiz yoʻq.');
    }

    return true;
  }
}
