import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsUUID()
  marketId!: string;
}
