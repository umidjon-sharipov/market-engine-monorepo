import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class TelegramAuthDto {
  @Type(() => Number)
  @IsInt()
  id: number;

  @IsString()
  @MaxLength(100)
  first_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photo_url?: string;

  @Type(() => Number)
  @IsInt()
  auth_date: number;

  @IsString()
  @MaxLength(128)
  hash: string;
}
