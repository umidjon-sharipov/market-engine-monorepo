import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { CategoriesService } from './categories.service';
import { CategoryParsePipe } from './pipes/category-parse.pipe';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService, private readonly prisma: PrismaService) {}

  @Get()
  findAll() { return this.categories.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.categories.findOne(id); }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Req() req: any,
    @Body(new CategoryParsePipe()) body: CreateCategoryDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const GuardClass = MarketAccessGuard('category', req.user.email, ['owner', 'admin'], body.marketId || '', 'create');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

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
    const category = await this.prisma.category.findUnique({
        where: { id },
        select: { marketId: true },
    });

    if (!category) {
        throw new NotFoundException('Category topilmadi');
    }

    const GuardClass = MarketAccessGuard('category', req.user.email, ['owner', 'admin'], category.marketId || '', 'create');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

    return this.categories.update(id, body, files ?? []);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) { 
    const category = await this.prisma.category.findUnique({
        where: { id },
        select: { marketId: true },
    });

    if (!category) {
        throw new NotFoundException('Category topilmadi');
    }

    const GuardClass = MarketAccessGuard('category', req.user.email, ['owner', 'admin'], category.marketId || '', 'delete');
    const instance = new GuardClass(this.prisma);
    await instance.canActivate({ switchToHttp: () => ({ getRequest: () => req }) } as any);

    return this.categories.delete(id); 
  }
}
  