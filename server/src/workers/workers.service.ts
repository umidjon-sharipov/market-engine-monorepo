import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkerRepository } from './worker.repository';
import { CreateWorkerDto } from './dto/create-worker.dto';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  warehouse: [
    'product:get',
    'product:update',
    'stock:get',
    'stock:update',
    'order:get',
  ],
  seller: [
    'product:get',
    'order:create',
    'order:get',
    'order:update',
  ],
  manager: [
    'product:get',
    'product:create',
    'product:update',
    'order:get',
    'vacancy:get',
  ],
  admin: [
    'product:get',
    'product:create',
    'product:update',
    'product:delete',
    'slider:get',
    'slider:create',
    'slider:delete',
    'vacancy:get',
    'vacancy:create',
    'vacancy:delete',
    'worker:get',
    'worker:create',
  ],
};

@Injectable()
export class WorkersService {
  constructor(
    private readonly workers: WorkerRepository,
    private readonly prisma: PrismaService
  ) {}

  findAll() {
    return this.workers.findAll({
      orderBy: { createdAt: 'desc' },
      include: { user: true, market: true, vacancy: true },
    });
  }

  findOne(id: string) {
    return this.workers.findOne({ id });
  }

  findByUser(email: string) {
    return this.prisma.worker.findMany({
      where: { user: { email } },
      include: { market: true, vacancy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(body: CreateWorkerDto) {
    let assignedRole = 'worker';
    let vacancySalary: number | null | undefined = undefined;

    if (body.vacancyId) {
      const vacancy = await this.prisma.vacancy.findUnique({
        where: { id: body.vacancyId },
        select: { requiredRole: true, salary: true },
      });

      if (!vacancy) {
        throw new NotFoundException('Vakansiya topilmadi!');
      }

      assignedRole = vacancy.requiredRole || assignedRole;
      vacancySalary = vacancy.salary ? Number(vacancy.salary) : undefined;
    }

    const normalizedRole = assignedRole.toLowerCase();
    const defaultPermissions = ROLE_PERMISSIONS[normalizedRole] || ['product:read'];

    const createInput: Prisma.WorkerCreateInput = {
      user: { connect: { id: body.userId } },
      market: { connect: { id: body.marketId } },
      role: assignedRole,
      permissions: defaultPermissions,
      salary: vacancySalary ?? undefined,
      ...(body.vacancyId && {
        vacancy: { connect: { id: body.vacancyId } },
      }),
    };

    return this.workers.create(createInput as any);
  }
}