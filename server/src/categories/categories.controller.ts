import {
    Body,
    BadRequestException,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { CategoriesService } from './categories.service';
import { CategoryParsePipe } from './pipes/category-parse.pipe';
import {
    CreateCategoryDto,
    UpdateCategoryDto,
} from './dto/create-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
    constructor(
        private readonly categories: CategoriesService,
        private readonly prisma: PrismaService,
    ) { }

    @Get()
    async findAll(
        @Query('marketId', ParseUUIDPipe) marketId: string,
    ) {
        return this.categories.findAll(marketId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(
        @Req() req: any,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const GuardClass = MarketAccessGuard('discount', req.user.email, ['owner', 'admin'], id || '', 'get');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        const category = await this.prisma.category.findUnique({
            where: { id },
            select: { marketId: true },
        });
        if (!category) throw new NotFoundException('Category topilmadi');

        return this.categories.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AnyFilesInterceptor())
    async create(
        @Req() req: any,
        @Body(new CategoryParsePipe()) body: CreateCategoryDto,
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        return this.categories.create(body, files ?? []);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(AnyFilesInterceptor())
    async update(
        @Req() req: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body(new CategoryParsePipe()) body: UpdateCategoryDto,
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const GuardClass = MarketAccessGuard('discount', req.user.email, ['owner', 'admin'], id || '', 'get');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        const category = await this.prisma.category.findUnique({
            where: { id },
            select: { marketId: true },
        });

        if (!category) {
            throw new NotFoundException('Category topilmadi');
        }

        return this.categories.update(id, body, files ?? []);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async delete(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: any,
    ) {
        const GuardClass = MarketAccessGuard('discount', req.user.email, ['owner', 'admin'], id || '', 'get');
        const instance = new GuardClass(this.prisma);
        await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

        const category = await this.prisma.category.findUnique({
            where: { id },
            select: { marketId: true },
        });

        if (!category) {
            throw new NotFoundException('Category topilmadi');
        }

        return this.categories.delete(id);
    }
}
