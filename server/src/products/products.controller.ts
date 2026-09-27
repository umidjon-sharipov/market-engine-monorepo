import { Body, Controller, Post, Get, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketOwnerGuard } from '../auth/guards/market-owner.guard';
import { ProductParsePipe } from './pipes/product-parse.pipe';
import type { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  findAll() { return this.productsService.findAll(); }

  @Post()
  @UseGuards(JwtAuthGuard, MarketOwnerGuard)
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  createProduct(
    @Body(new ProductParsePipe()) body: CreateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.productsService.createProduct(body, files ?? []);
  }
}