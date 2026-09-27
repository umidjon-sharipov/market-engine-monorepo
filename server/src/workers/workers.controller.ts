import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('workers')
export class WorkersController {
    constructor(private readonly workersService: WorkersService, private readonly prisma: PrismaService) { }

    @Get()
    async findAll() {
        return await this.workersService.findAll();
    }

    @Get('get')
    @UseGuards(JwtAuthGuard)
    async getMyMarkets(@Req() req) {
        return await this.workersService.findByUser(req.user.email);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Req() req: any, @Body() body: CreateWorkerDto) {
        const GuardClass = MarketAccessGuard('worker', req.user.email, ['admin'], body.marketId, 'create');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        return await this.workersService.create(body);
    }
}