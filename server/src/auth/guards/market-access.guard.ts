import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Type,
  mixin,
} from '@nestjs/common';
import type { Request } from 'express';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

type AuthenticatedRequest = Request & {
  user?: { email?: string };
  params?: { marketId?: string };
  body?: { marketId?: string };
};

export function MarketAccessGuard(
  serviceType?: string,
  userEmail?: string,
  roles: string[] = ['owner', 'admin'],
  marketId?: string,
  method?: string,
): Type<CanActivate> {
  @Injectable()
  class MarketAccessGuardClass implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const requestEmail = request.user?.email;
      const effectiveEmail = userEmail ?? requestEmail;
      const effectiveMarketId =
        marketId ?? request.params?.marketId ?? request.body?.marketId;

      if (!effectiveMarketId || !effectiveEmail) {
        return false;
      }
      if (!isUUID(effectiveMarketId)) {
        throw new BadRequestException(
          "Market ID UUID formatida bo'lishi kerak.",
        );
      }

      if (roles.some((role) => role.toLowerCase() === 'owner')) {
        const isOwner = await this.prisma.market.findFirst({
          where: {
            id: effectiveMarketId,
            email: effectiveEmail,
          },
          select: { id: true },
        });

        if (isOwner) return true;
      }

      const user = await this.prisma.user.findUnique({
        where: { email: effectiveEmail },
        select: { id: true },
      });

      if (!user) return false;

      const workers = await this.prisma.worker.findMany({
        where: {
          marketId: effectiveMarketId,
          userId: user.id,
        },
        select: { role: true, permissions: true },
      });

      if (!workers.length) return false;

      for (const worker of workers) {
        if (
          !roles.some(
            (role) => role.toLowerCase() === worker.role.toLowerCase(),
          )
        ) {
          continue;
        }

        const hasServiceAccess = worker.permissions.some((permission) => {
          const [permissionService, permissionMethod] = permission.split(':');
          return (
            permissionService === serviceType &&
            (!method || permissionMethod === method)
          );
        });

        if (hasServiceAccess) return true;
      }

      return false;
    }
  }

  return mixin(MarketAccessGuardClass);
}
