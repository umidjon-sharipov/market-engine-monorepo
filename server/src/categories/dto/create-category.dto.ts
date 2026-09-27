import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class SubItemDto {
    @IsString()
    @IsOptional()
    @IsUUID()
    id?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsString()
    @IsOptional()
    image?: string;
}

export class CategoryOptionDto {
    @IsString()
    @IsOptional()
    @IsUUID()
    id?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SubItemDto)
    items!: SubItemDto[];
}

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @IsUUID()
    marketId!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryOptionDto)
    options!: CategoryOptionDto[];
}

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    title?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryOptionDto)
    @IsOptional()
    options?: CategoryOptionDto[];
}