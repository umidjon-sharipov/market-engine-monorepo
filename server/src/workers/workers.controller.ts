import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ExecutionContext,
    ForbiddenException,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkersService } from './workers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { PrismaService } from '../prisma/prisma.service';
import { VALID_WORKER_PERMISSIONS, WORKER_ROLES } from './worker-permissions';

type AuthenticatedRequest = Request & {
    user: { email: string };
};

@Controller('workers')
export class WorkersController {
    constructor(
        private readonly workersService: WorkersService,
        private readonly prisma: PrismaService,
    ) { }

    @Get('get')
    @UseGuards(JwtAuthGuard)
    getMyMarkets(@Req() req: AuthenticatedRequest) {
        return this.workersService.findByUser(req.user.email);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(
        @Req() req: AuthenticatedRequest,
        @Query('marketId') marketId: string,
        @Query('page') rawPage = '1',
        @Query('limit') rawLimit = '20',
        @Query('search') search = '',
        @Query('role') role?: string,
        @Query('permissions') rawPermissions?: string,
    ) {
        await this.authorize(req, marketId, 'get');
        const page = this.parsePositiveInteger(rawPage, 'page');
        const limit = Math.min(this.parsePositiveInteger(rawLimit, 'limit'), 100);

        if (role && !WORKER_ROLES.some((value) => value === role)) {
            throw new BadRequestException('Role filter yaroqsiz.');
        }
        const permissions = rawPermissions
            ?.split(',')
            .map((permission) => permission.trim())
            .filter(Boolean);
        if (
            permissions?.some(
                (permission) => !VALID_WORKER_PERMISSIONS.includes(permission),
            )
        ) {
            throw new BadRequestException('Permissions filter yaroqsiz.');
        }

        return this.workersService.findAll(marketId, {
            page,
            limit,
            search: search.trim().slice(0, 100) || undefined,
            role,
            permissions,
        });
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(
        @Req() req: AuthenticatedRequest,
        @Body() body: CreateWorkerDto,
    ) {
        await this.authorize(req, body.marketId, 'create');
        return this.workersService.create(body);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('marketId') marketId: string,
        @Body() body: UpdateWorkerDto,
    ) {
        await this.authorize(req, marketId, 'update');
        return this.workersService.update(id, marketId, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseUUIDPipe) id: string,
        @Query('marketId') marketId: string,
    ) {
        await this.authorize(req, marketId, 'delete');
        return this.workersService.remove(id, marketId);
    }

    private async authorize(
        req: AuthenticatedRequest,
        marketId: string,
        action: 'get' | 'create' | 'update' | 'delete',
    ) {
        const GuardClass = MarketAccessGuard(
            'worker',
            req.user?.email,
            [...WORKER_ROLES, 'owner'],
            marketId,
            action,
        );
        const context = {
            switchToHttp: () => ({ getRequest: () => req }),
        } as unknown as ExecutionContext;
        const allowed = await new GuardClass(this.prisma).canActivate(context);

        if (!allowed) {
            throw new ForbiddenException(
                `Sizda bu marketdagi ishchilarni ${action} uchun ruxsat yo‘q.`,
            );
        }
    }

    private parsePositiveInteger(value: string, name: string) {
        const parsed = Number(value);
        if (!Number.isSafeInteger(parsed) || parsed < 1) {
            throw new BadRequestException(`${name} musbat butun son bo‘lishi kerak.`);
        }
        return parsed;
    }
}
