import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoryRepository } from './category.repository';
import { CategoryParsePipe } from './pipes/category-parse.pipe';

@Module({
    controllers: [CategoriesController],
    providers: [CategoriesService, CategoryRepository, CategoryParsePipe],
})
export class CategoriesModule {}