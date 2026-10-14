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

    @IsNotEmpty()
    @IsString()
    lat!: string;

    @IsNotEmpty()
    @IsString()
    lng!: string;

    @IsNotEmpty({ message: 'marketId kiritilishi shart' })
    @IsUUID('4', { message: "marketId yaroqli UUID formatida bo'lishi kerak" })
    marketId!: string;
}
