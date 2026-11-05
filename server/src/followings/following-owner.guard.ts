import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowingOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { userId?: string; role?: string };
      params?: { id?: string };
    }>();
    const id = request.params?.id;
    if (!id || !isUUID(id)) {
      throw new BadRequestException('Following ID UUID formatida bo\'lishi kerak.');
    }
    const following = await this.prisma.following.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!following) throw new NotFoundException('Following topilmadi.');
    if (following.userId !== request.user?.userId && request.user?.role !== 'admin') {
      throw new ForbiddenException('Bu following yozuviga ruxsatingiz yo\'q.');
    }
    return true;
  }
}
