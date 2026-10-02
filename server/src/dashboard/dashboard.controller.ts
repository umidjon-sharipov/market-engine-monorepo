import { Controller, Get, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Req() req: any) {
        return await this.dashboardService.findAll(req.user.userId);
    }

    @Get('users/:market')
    @UseGuards(JwtAuthGuard)
    async usersAll(@Req() req: any, @Param('market', ParseUUIDPipe) market: string) {
        return await this.dashboardService.usersAll(req.user.userId, market)
    }
}