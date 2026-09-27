import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @MaxLength(400)
  comment!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rate!: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  reply?: string;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(400)
  comment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  reply?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  existingImages?: string[];
}
