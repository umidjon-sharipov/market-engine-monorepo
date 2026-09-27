import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
    @IsNotEmpty({ message: "Ism (name) kiritilishi shart" })
    @IsString({ message: "Ism matn shaklida bo'lishi kerak" })
    name!: string;

    @IsNotEmpty({ message: "Mahsulot (product) kiritilishi shart" })
    @IsString({ message: "Mahsulot matn shaklida bo'lishi kerak" })
    product!: string;

    @IsNotEmpty({ message: "Telefon raqam kiritilishi shart" })
    @IsString({ message: "Telefon raqam matn shaklida bo'lishi kerak" })
    phone!: string;

    @IsNotEmpty({ message: "Manzil (address) kiritilishi shart" })
    @IsString({ message: "Manzil matn shaklida bo'lishi kerak" })
    address!: string;

    @IsNotEmpty({ message: "Buyurtma elementlari (items) kiritilishi shart" })
    items!: any;

    @IsOptional()
    @IsString({ message: "Status matn shaklida bo'lishi kerak" })
    status?: string;
}