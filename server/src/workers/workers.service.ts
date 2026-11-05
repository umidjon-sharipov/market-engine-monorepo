import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { ROLE_PERMISSIONS, WORKER_ROLES } from './worker-permissions';

export { ROLE_PERMISSIONS, WORKER_ROLES } from './worker-permissions';

const userSelection = {
  id: true,
  email: true,
  userName: true,
  firstName: true,
  lastName: true,
  image: true,
} as const;

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    marketId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      role?: string;
      permissions?: string[];
    },
  ) {
    const { page, limit, search, role, permissions } = options;
    const where: Prisma.WorkerWhereInput = {
      marketId,
      ...(role ? { role: { equals: role, mode: 'insensitive' } } : {}),
      ...(permissions?.length
        ? { permissions: { hasSome: [...new Set(permissions)] } }
        : {}),
      ...(search
        ? {
            user: {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { userName: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.worker.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          marketId: true,
          userId: true,
          role: true,
          permissions: true,
          createdAt: true,
          user: { select: userSelection },
        },
      }),
      this.prisma.worker.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findByUser(email: string) {
    return this.prisma.worker.findMany({
      where: { user: { email } },
      include: { market: true, vacancy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(body: CreateWorkerDto) {
    const identifier = body.identifier?.trim();
    if (!body.userId && !identifier) {
      throw new BadRequestException(
        'Foydalanuvchining email yoki username qiymatini kiriting.',
      );
    }

    const user = body.userId
      ? await this.prisma.user.findUnique({
          where: { id: body.userId },
          select: { id: true },
        })
      : await this.prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: 'insensitive' } },
              { userName: { equals: identifier, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });

    if (!user) {
      throw new NotFoundException(
        'Email yoki username bilan foydalanuvchi topilmadi.',
      );
    }

    const existing = await this.prisma.worker.findFirst({
      where: { marketId: body.marketId, userId: user.id },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'Bu foydalanuvchi market ishchilari ro‘yxatida bor.',
      );
    }

    const permissions = this.validatePermissions(
      body.role,
      body.permissions ?? ROLE_PERMISSIONS[body.role],
    );

    try {
      return await this.prisma.worker.create({
        data: {
          marketId: body.marketId,
          userId: user.id,
          role: body.role,
          permissions,
        },
        select: {
          id: true,
          marketId: true,
          userId: true,
          role: true,
          permissions: true,
          createdAt: true,
          user: { select: userSelection },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Bu foydalanuvchi market ishchilari ro‘yxatida bor.',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    marketId: string,
    body: { role?: string; permissions?: string[] },
  ) {
    const worker = await this.prisma.worker.findFirst({
      where: { id, marketId },
      select: { id: true, role: true, permissions: true },
    });
    if (!worker) throw new NotFoundException('Ishchi topilmadi.');
    if (body.role === undefined && body.permissions === undefined) {
      throw new BadRequestException(
        'Yangilash uchun rol yoki ruxsatlarni kiriting.',
      );
    }

    const role = body.role ?? worker.role;
    const permissions = this.validatePermissions(
      role,
      body.permissions ?? worker.permissions,
    );

    try {
      return await this.prisma.worker.update({
        where: { id },
        data: { role, permissions },
        select: {
          id: true,
          marketId: true,
          userId: true,
          role: true,
          permissions: true,
          createdAt: true,
          user: { select: userSelection },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Bu roldagi ishchi marketda allaqachon mavjud.',
        );
      }
      throw error;
    }
  }

  async remove(id: string, marketId: string) {
    const worker = await this.prisma.worker.findFirst({
      where: { id, marketId },
      select: { id: true },
    });
    if (!worker) throw new NotFoundException('Ishchi topilmadi.');

    await this.prisma.worker.delete({ where: { id } });
    return { id, deleted: true };
  }

  private validatePermissions(role: string, permissions: string[]) {
    const allowedForRole = ROLE_PERMISSIONS[role];
    if (!WORKER_ROLES.includes(role) || !allowedForRole) {
      throw new BadRequestException('Tanlangan rol yaroqsiz.');
    }
    if (
      !Array.isArray(permissions) ||
      permissions.some((permission) => !allowedForRole.includes(permission))
    ) {
      throw new BadRequestException(
        'Bir yoki bir nechta ruxsat tanlangan rol uchun yaroqsiz.',
      );
    }
    return [...new Set(permissions)];
  }
}
