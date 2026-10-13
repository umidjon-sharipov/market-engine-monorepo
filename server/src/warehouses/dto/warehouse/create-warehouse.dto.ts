import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWarehouseDto {
  @IsNotEmpty({ message: "Ombor nomi bo'lishi shart" })
  @IsString({ message: 'Ombor nomini kiriting' })
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string;

  @IsNotEmpty({ message: 'Kenglik (lat) kiritilishi shart' })
  @Type(() => Number)
  @IsNumber({}, { message: "Kenglik raqam bo'lishi kerak" })
  lat!: number;

  @IsNotEmpty({ message: 'Uzunlik (lng) kiritilishi shart' })
  @Type(() => Number)
  @IsNumber({}, { message: "Uzunlik raqam bo'lishi kerak" })
  lng!: number;

  @IsNotEmpty({ message: 'marketId kiritilishi shart' })
  @IsUUID('4', { message: "marketId yaroqli UUID formatida bo'lishi kerak" })
  marketId!: string;
}
