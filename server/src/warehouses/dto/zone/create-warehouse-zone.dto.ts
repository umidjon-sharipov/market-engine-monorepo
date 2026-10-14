import { WarehouseZoneType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateWarehouseZoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsEnum(WarehouseZoneType)
  @IsNotEmpty()
  type!: WarehouseZoneType;
}

export class UpdateWarehouseZoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsEnum(WarehouseZoneType)
  @IsNotEmpty()
  type?: WarehouseZoneType;
}
