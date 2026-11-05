import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

const parseMultipartBoolean = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

const parseMultipartArray = ({ value }: { value: unknown }) => {
  let parsed = value;
  if (typeof parsed !== 'string') return parsed;
  try {
    parsed = JSON.parse(parsed);
  } catch {
    return value;
  }
  if (!Array.isArray(parsed)) return parsed;
  return parsed.map((option) => plainToInstance(CategoryOptionDto, option));
};

export class CategoryOptionItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  image?: string;

  @Transform(parseMultipartBoolean)
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

  @IsString()
  @IsOptional()
  image?: string;

  @Transform(parseMultipartBoolean)
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

  @IsString()
  @IsOptional()
  image?: string;

  @Transform(parseMultipartBoolean)
  @IsBoolean()
  @IsOptional()
  hidden?: boolean;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  marketId!: string;

  @Transform(parseMultipartArray)
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

  @IsString()
  @IsOptional()
  image?: string;

  @Transform(parseMultipartBoolean)
  @IsBoolean()
  @IsOptional()
  hidden?: boolean;

  @Transform(parseMultipartArray)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOptionDto)
  @IsOptional()
  options?: CategoryOptionDto[];
}
