import { Transform, TransformFnParams, Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductOptionItemDto {
  @IsString()
  @MaxLength(255)
  key!: string;

  @Type(() => Number)
  @IsNumber()
  value!: number;
}

export class ProductOptionDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @Transform(({ value }: TransformFnParams) => {
    const input: unknown = value;
    if (Array.isArray(input)) {
      const array: unknown[] = input;
      return array;
    }
    if (typeof input !== 'string') return input;
    try {
      const parsed: unknown = JSON.parse(input);
      return parsed;
    } catch {
      return input;
    }
  })
  @IsArray()
  @IsString({ each: true })
  searchKeys: string[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionItemDto)
  items!: ProductOptionItemDto[];
}

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsObject()
  description?: Record<string, unknown>;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsUUID()
  marketId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsUUID()
  discountId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  categoryItemId?: string;

  @IsOptional()
  @IsArray()
  gradient?: unknown[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  options!: ProductOptionDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
