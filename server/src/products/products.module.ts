import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductRepository } from './product.repository';
import { ProductParsePipe } from './pipes/product-parse.pipe';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    ProductParsePipe,
  ],
})
export class ProductsModule {}