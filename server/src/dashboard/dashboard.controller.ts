import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Req() req: any) {
        const currentUserName = req.user.userName
        return await this.dashboardService.findAll(currentUserName);
    }

    @Get('users/:market')
    @UseGuards(JwtAuthGuard)
    async usersAll(@Req() req: any, @Param('market') market: string) {
        const currentUserName = req.user.userName
        return await this.dashboardService.usersAll(currentUserName, market)
    }
}