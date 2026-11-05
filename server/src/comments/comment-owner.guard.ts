import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { userId?: string; role?: string };
      params?: { id?: string };
    }>();
    const commentId = request.params?.id;
    const userId = request.user?.userId;
    if (!commentId || !isUUID(commentId) || !userId || !isUUID(userId)) {
      throw new ForbiddenException('Comment yoki user ID noto\'g\'ri.');
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });
    if (!comment) throw new NotFoundException('Comment topilmadi.');

    if (comment.userId !== userId && request.user?.role !== 'admin') {
      throw new ForbiddenException('Bu comment ustida ruxsatingiz yo\'q.');
    }
    return true;
  }
}
