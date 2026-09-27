import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateWorkerDto {
    @IsNotEmpty({ message: "Do'kon ID (marketId) kiritilishi shart" })
    @IsUUID('4', { message: "marketId yaroqli UUID formatida bo'lishi kerak" })
    marketId!: string;

    @IsNotEmpty({ message: "Foydalanuvchi idsi kiritilishi shart" })
    @IsUUID('4', { message: 'userId yaroqli UUID formatida bo\'lishi kerak' })
    userId!: string;

    @IsOptional()
    @IsString({ message: "Rol matn shaklida bo'lishi kerak" })
    role!: string;

    @IsNotEmpty()
    @IsUUID('4', { message: 'vacancyId yaroqli UUID formatida bo\'lishi kerak' })
    vacancyId!: string;
}