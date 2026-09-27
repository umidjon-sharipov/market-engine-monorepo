import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReactionDto {
    @IsNotEmpty({ message: "Reaksiya (reaction) kiritilishi shart" })
    @IsString({ message: "Reaksiya matn shaklida bo'lishi kerak" })
    reaction!: string;

    @IsNotEmpty({ message: "Mahsulot (product) kiritilishi shart" })
    @IsString({ message: "Mahsulot matn shaklida bo'lishi kerak" })
    product!: string;

    @IsNotEmpty({ message: "Profil (profile) kiritilishi shart" })
    @IsString({ message: "Profil matn shaklida bo'lishi kerak" })
    profile!: string;
}