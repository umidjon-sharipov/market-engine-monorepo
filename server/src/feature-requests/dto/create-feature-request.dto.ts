import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFeatureRequestDto {
    @IsNotEmpty({ message: "Ism (name) kiritilishi shart" })
    @IsString({ message: "Ism matn shaklida bo'lishi kerak" })
    name!: string;

    @IsNotEmpty({ message: "Telefon raqam kiritilishi shart" })
    @IsString({ message: "Telefon raqam matn shaklida bo'lishi kerak" })
    phone!: string;

    @IsNotEmpty({ message: "Mahsulot (product) kiritilishi shart" })
    @IsString({ message: "Mahsulot matn shaklida bo'lishi kerak" })
    product!: string;

    @IsNotEmpty({ message: "Sarlavha (title) kiritilishi shart" })
    @IsString({ message: "Sarlavha matn shaklida bo'lishi kerak" })
    title!: string;
}