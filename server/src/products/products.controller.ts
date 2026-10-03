import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketOwnerGuard } from '../auth/guards/market-owner.guard';
import { ProductParsePipe } from './pipes/product-parse.pipe';
import type { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('marketId') marketId?: string,
  ) {
    return this.productsService.findAll(search, marketId);
  }

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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, MarketOwnerGuard)
  @UseInterceptors(AnyFilesInterceptor({ limits: { fileSize: 5 * 1024 * 1024 } }))
  updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ProductParsePipe(true)) body: UpdateProductDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.productsService.updateProduct(id, body, files ?? []);
  }
}