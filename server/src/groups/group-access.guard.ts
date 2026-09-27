import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: { userName?: string };
      params?: Record<string, string>;
    }>();
    const userName = request.user?.userName;
    const groupUrl = request.params?.group ?? request.params?.chat;
    if (!userName || !groupUrl) {
      throw new ForbiddenException('Guruh va foydalanuvchi aniqlanmadi.');
    }

    const group = await this.prisma.group.findUnique({
      where: { url: groupUrl },
      select: { founder: true, users: true },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi.');
    if (group.founder === userName) return true;

    const members = Array.isArray(group.users) ? group.users : [];
    const member = members.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        (item as { userName?: string }).userName === userName,
    );
    if (!member) throw new ForbiddenException("Siz bu guruh a'zosi emassiz.");
    return true;
  }
}
