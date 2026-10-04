import {
    BadRequestException,
    Controller,
    ForbiddenException,
    Get,
    Param,
    ParseUUIDPipe,
    ParseIntPipe,
    NotFoundException,
    Patch,
    Post,
    Query,
    Req,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductParsePipe } from './pipes/product-parse.pipe';
import {
    CreateProductDto,
    UpdateProductDto,
} from './dto/create-product.dto';
import { MarketAccessGuard } from 'src/auth/guards/market-access.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly prisma: PrismaService,
    ) { }

    @Get()
    findAll(
        @Query('search') search?: string,
        @Query('marketId') marketId?: string,
    ) {
        return this.productsService.findAll(search, marketId);
    }

    @Get('search')
    @UseGuards(JwtAuthGuard)
    async search(
        @Req() req: any,
        @Query('marketId', ParseUUIDPipe) marketId: string,
        @Query('search') search = '',
        @Query('page', new ParseIntPipe({ optional: true })) page = 1,
        @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    ) {
        const GuardClass = MarketAccessGuard(
            'product',
            req.user?.email,
            ['owner', 'admin', 'warehouse'],
            marketId,
            'get',
        );
        const allowed = await new GuardClass(this.prisma).canActivate({
            switchToHttp: () => ({ getRequest: () => req }),
        } as any);
        if (!allowed) {
            throw new ForbiddenException('Mahsulotlarni ko‘rish uchun ruxsat yo‘q.');
        }
        return this.productsService.search(marketId, search, page, limit);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        AnyFilesInterceptor({
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
        }),
    )
    async createProduct(
        @Req() req: any,
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const parsePipe = new ProductParsePipe();
        const body = parsePipe.transform(req.body) as CreateProductDto;

        const GuardClass = MarketAccessGuard(
            'product',
            req.user?.email,
            ['owner', 'admin', 'warehouse'],
            body.marketId,
            'create',
        );
        const instance = new GuardClass(this.prisma);
        const canAccess = await instance.canActivate({
            switchToHttp: () => ({ getRequest: () => req }),
        } as any);

        if (!canAccess) {
            throw new ForbiddenException(
                "Sizda bu marketda mahsulot yaratish uchun ruxsat yo'q.",
            );
        }

        return this.productsService.createProduct(body, files ?? []);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        AnyFilesInterceptor({ limits: { fileSize: 5 * 1024 * 1024 } }),
    )
    async updateProduct(
        @Req() req: any,
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const parsePipe = new ProductParsePipe(true);
        const body = parsePipe.transform(req.body) as UpdateProductDto;
        const currentProduct = await this.prisma.product.findUnique({
            where: { id },
            select: { marketId: true },
        });
        if (!currentProduct) {
            throw new NotFoundException('Mahsulot topilmadi.');
        }
        if (body.marketId && body.marketId !== currentProduct.marketId) {
            throw new BadRequestException(
                'Mahsulotni boshqa marketga ko‘chirish mumkin emas.',
            );
        }

        const GuardClass = MarketAccessGuard(
            'product',
            req.user?.email,
            ['owner', 'admin', 'warehouse'],
            currentProduct.marketId,
            'update',
        );
        const instance = new GuardClass(this.prisma);
        const canAccess = await instance.canActivate({
            switchToHttp: () => ({ getRequest: () => req }),
        } as any);

        if (!canAccess) {
            throw new ForbiddenException(
                "Sizda bu marketda mahsulotni tahrirlash uchun ruxsat yo'q.",
            );
        }

        return this.productsService.updateProduct(id, body, files ?? []);
    }
}