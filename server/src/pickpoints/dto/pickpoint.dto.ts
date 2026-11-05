import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePickPointDto {
  @IsUUID('4')
  marketId!: string;

  @IsUUID('4')
  warehouseId!: string;

  @IsOptional()
  @IsUUID('4')
  assignedSellerId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  longitude!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1)
  serviceRadiusMeters!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePickPointDto extends PartialType(
  OmitType(CreatePickPointDto, ['marketId'] as const),
) {}

export class PickPointRecommendationLineDto {
  @IsUUID('4')
  productId!: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SelectedPickPointOptionDto)
  selectedOptions?: SelectedPickPointOptionDto[];
}

export class SelectedPickPointOptionDto {
  @IsUUID('4')
  parentProductId!: string;

  @IsUUID('4')
  optionProductId!: string;
}

export class PickPointRecommendationsDto {
  @IsUUID('4')
  marketId!: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PickPointRecommendationLineDto)
  items!: PickPointRecommendationLineDto[];
}
