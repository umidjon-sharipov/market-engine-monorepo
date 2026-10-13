import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateWarehouseZoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;
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
}
