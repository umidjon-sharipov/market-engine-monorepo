import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWarehouseShelfDto {
  @IsUUID()
  rackId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shelfNumber?: string;
}

export class UpdateWarehouseShelfDto {
  @IsOptional()
  @IsUUID()
  rackId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shelfNumber?: string;
}