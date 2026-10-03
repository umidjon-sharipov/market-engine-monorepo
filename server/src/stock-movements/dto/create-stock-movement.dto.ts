import { MovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateStockMovementDto {
  @IsUUID()
  productId!: string;

  @IsEnum(MovementType)
  type!: MovementType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsUUID()
  fromWarehouseId?: string;

  @IsOptional()
  @IsUUID()
  fromBinId?: string;

  @IsOptional()
  @IsUUID()
  toWarehouseId?: string;

  @IsOptional()
  @IsUUID()
  toBinId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class UpdateStockMovementStatusDto {
  @IsEnum(['COMPLETED', 'CANCELLED'])
  status!: 'COMPLETED' | 'CANCELLED';
}
