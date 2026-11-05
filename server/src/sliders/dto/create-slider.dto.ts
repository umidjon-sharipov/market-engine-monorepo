import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSliderDto {
    @IsOptional()
    @IsString()
    image?: string;

    @IsNotEmpty({ message: "Havola (link) kiritilishi shart" })
    @IsString({ message: "Havola matn shaklida bo'lishi kerak" })
    link!: string;

    @IsNotEmpty({ message: "MarketId kiritilishi shart" })
    @IsUUID('4', { message: 'marketId yaroqli UUID formatida bo\'lishi kerak' })
    marketId!: string;
}