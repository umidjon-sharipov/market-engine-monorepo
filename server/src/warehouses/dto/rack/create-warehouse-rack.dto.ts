import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWarehouseRackDto {
  @IsUUID()
  aisleId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rackNumber?: string;
}

export class UpdateWarehouseRackDto {
  @IsOptional()
  @IsUUID()
  aisleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rackNumber?: string;
}