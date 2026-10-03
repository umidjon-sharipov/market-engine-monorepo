import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateStorageBinDto {
  @IsUUID()
  zoneId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}

export class UpdateStorageBinDto {
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}
