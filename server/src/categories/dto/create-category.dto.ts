import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsUUID, MaxLength, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryOptionItemDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsBoolean()
    @IsOptional()
    hidden?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryOptionItemDto)
    @IsOptional()
    children?: CategoryOptionItemDto[];
}

export class CategoryOptionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsBoolean()
    @IsOptional()
    hidden?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryOptionItemDto)
    items!: CategoryOptionItemDto[];
}

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @IsBoolean()
    @IsOptional()
    hidden?: boolean;

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

    @IsBoolean()
    @IsOptional()
    hidden?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryOptionDto)
    @IsOptional()
    options?: CategoryOptionDto[];
}