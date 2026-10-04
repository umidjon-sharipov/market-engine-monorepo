import { WarehouseTaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWarehouseTaskDto {
  @IsUUID()
  marketId!: string;

  @IsUUID()
  assignedWorkerId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsUUID()
  sourceBinId!: string;

  @IsOptional()
  @IsUUID()
  destinationWarehouseId?: string;

  @IsOptional()
  @IsUUID()
  destinationBinId?: string;

  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  optionItemId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class UpdateWarehouseTaskDto {
  @IsOptional()
  @IsUUID()
  assignedWorkerId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  sourceBinId?: string;

  @IsOptional()
  @IsUUID()
  destinationWarehouseId?: string | null;

  @IsOptional()
  @IsUUID()
  destinationBinId?: string | null;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  optionItemId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;
}

export class UpdateWarehouseTaskStatusDto {
  @IsEnum(WarehouseTaskStatus)
  status!: WarehouseTaskStatus;
}
