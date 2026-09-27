import { IsString, IsOptional, IsArray, IsEmail, IsBoolean } from 'class-validator';

export class UserDto {
    @IsString()
    id: string;

    @IsString()
    userName: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsString()
    tag?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    setTag?: string[];

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsBoolean()
    isMe?: boolean;
}