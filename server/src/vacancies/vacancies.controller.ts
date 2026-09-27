import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Delete,
    Req,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VacanciesService } from './vacancies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('vacancies')
export class VacanciesController {
    constructor(
        private readonly vacanciesService: VacanciesService,
        private readonly prisma: PrismaService,
    ) {}

    @Get()
    async findAll() {
        return await this.vacanciesService.findAll();
    }

    @Get('market/:marketId')
    async findByMarketId(@Param('marketId') marketId: string) {
        return await this.vacanciesService.findByMarketId(marketId);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    async create(
        @Req() req: any,
        @UploadedFile() file: { buffer: Buffer; originalname: string },
        @Body() body: CreateVacancyDto
    ) {
        const GuardClass = MarketAccessGuard('vacancy', req.user.email, ['admin', 'manager'], body.marketId, 'create');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        return await this.vacanciesService.create(body, file);
    }

    @Post(':id/apply')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image'))
    async applyToVacancy(
        @Param('id') vacancyId: string,
        @Req() req: any,
        @UploadedFile() file?: { buffer: Buffer; originalname: string },
        @Body() body?: { message?: string },
    ) {
        const userEmail = req.user.email;
        const message = body?.message || '';

        return await this.vacanciesService.applyToVacancy(vacancyId, userEmail, file, message);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async remove(@Req() req: any, @Param('id') id: string) {
        const vacancy = await this.prisma.vacancy.findUnique({
            where: { id },
            select: { marketId: true },
        });

        if (!vacancy) {
            throw new NotFoundException('Vakansiya topilmadi');
        }

        const GuardClass = MarketAccessGuard('vacancy', req.user.email, ['owner', 'admin'], vacancy.marketId || '', 'delete');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        return await this.vacanciesService.delete(id);
    }

    @Get('data/:vacancy')
    @UseGuards(JwtAuthGuard)
    async getVacancyData(@Param('vacancy') vacancy: string, @Req() req: any) {
        const userEmail = req.user.email;

        return await this.vacanciesService.getVacancyData(vacancy, userEmail);
    }

    @Post(':id/rate')
    @UseGuards(JwtAuthGuard)
    async rateToVacancy(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: { rateCount: number; targetEmail: string }
    ) {
        const vacancy = await this.prisma.vacancy.findUnique({
            where: { id },
            select: { marketId: true },
        });

        if (!vacancy) {
            throw new NotFoundException('Vakansiya topilmadi');
        }

        const GuardClass = MarketAccessGuard('vacancy', req.user.email, ['owner', 'admin'], vacancy.marketId || '', 'rate');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        return await this.vacanciesService.rateToVacancy(id, body.targetEmail, body.rateCount);
    }
}