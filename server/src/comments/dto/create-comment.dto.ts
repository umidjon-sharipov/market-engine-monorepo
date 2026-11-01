import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  MinLength,
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
  @MinLength(1)
  @MaxLength(400)
  comment!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rate!: number;

}

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(400)
  comment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rate?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  existingImages?: string[];
}

export class UpdateCommentReplyDto {
  @IsString()
  @MaxLength(1000)
  reply!: string;
}
