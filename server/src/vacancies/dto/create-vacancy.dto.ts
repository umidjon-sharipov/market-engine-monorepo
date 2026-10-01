import { IsNotEmpty, IsString, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVacancyDto {
    @IsNotEmpty({ message: "Do'kon ID (marketId) kiritilishi shart" })
    @IsUUID('4', { message: "marketId yaroqli UUID formatida bo'lishi kerak" })
    marketId!: string;

    @IsNotEmpty({ message: "Vakansiya sarlavhasi bo'sh bo'lmasligi kerak" })
    @IsString({ message: "Sarlavha matn shaklida bo'lishi kerak" })
    title!: string;

    @IsNotEmpty({ message: "Talab qilingan rol (requiredRole) kiritilishi shart" })
    @IsString()
    requiredRole!: string;

    @IsNotEmpty({ message: "Ishlash stavkalarini yozish shart" })
    @IsString()
    jobType!: string;

    @IsNotEmpty({ message: "Ishchilar soni kiritilishi shart" })
    @Type(() => Number)
    @IsNumber({}, { message: "Ishchilar soni raqam bo'lishi kerak" })
    @Min(1, { message: "Kamida 1 ta ishchi kerak bo'lishi shart" })
    requiredWorkers!: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: "Maosh son ko'rinishida bo'lishi kerak" })
    @Min(0, { message: "Maosh 0 dan kichik bo'lishi mumkin emas" })
    salary?: number;

    @IsOptional()
    @IsString()
    image?: string;

    @IsNotEmpty({ message: "Ko'nikmalar (skills) kiritilishi shart" })
    @IsString()
    skills!: string;

    @IsNotEmpty({ message: "Tajriba belgilanishi shart" })
    @IsString()
    experience!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    benefits?: string;

    @IsNotEmpty({ message: "HR ning ismi bo'lishi shart" })
    @IsString()
    hrName!: string;

    @IsNotEmpty({ message: "HR ning telefon raqami bo'lishi shart" })
    @IsString()
    hrPhone!: string;

    @IsOptional()
    @IsString()
    hrLink?: string;
}