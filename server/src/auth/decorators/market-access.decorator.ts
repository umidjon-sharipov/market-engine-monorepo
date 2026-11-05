import { SetMetadata } from '@nestjs/common';

export const MARKET_ROLES_KEY = 'market_roles';

export const RequireRoles = (...roles: string[]) => SetMetadata(MARKET_ROLES_KEY, roles);