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

interface AuthenticatedRequest extends Request {
  user?: { email?: string };
}

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categories: CategoriesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('marketId', ParseUUIDPipe) marketId: string,
  ) {
    await this.checkMarketAccess(req, marketId, 'get');
    return this.categories.findAll(marketId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { marketId: true },
    });
    if (!category) throw new NotFoundException('Category topilmadi');

    await this.checkMarketAccess(req, category.marketId, 'get');
    return this.categories.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Req() req: AuthenticatedRequest,
    @Body(new CategoryParsePipe()) body: CreateCategoryDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    await this.checkMarketAccess(req, body.marketId, 'create');
    return this.categories.create(body, files ?? []);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new CategoryParsePipe()) body: UpdateCategoryDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { marketId: true },
    });

    if (!category) {
      throw new NotFoundException('Category topilmadi');
    }

    await this.checkMarketAccess(req, category.marketId, 'create');
    return this.categories.update(id, body, files ?? []);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { marketId: true },
    });

    if (!category) {
      throw new NotFoundException('Category topilmadi');
    }

    await this.checkMarketAccess(req, category.marketId, 'delete');
    return this.categories.delete(id);
  }

  private async checkMarketAccess(
    req: AuthenticatedRequest,
    marketId: string,
    action: string,
  ) {
    const email = req.user?.email;
    if (!email || !marketId) {
      throw new BadRequestException(
        'Market va autentifikatsiya ma’lumotlari talab qilinadi.',
      );
    }
    const GuardClass = MarketAccessGuard(
      'category',
      email,
      ['owner', 'admin'],
      marketId,
      action,
    );
    const allowed = await new GuardClass(this.prisma).canActivate(
      new ExecutionContextHost([req]),
    );
    if (!allowed)
      throw new ForbiddenException('Bu market uchun ruxsat mavjud emas.');
  }
}
