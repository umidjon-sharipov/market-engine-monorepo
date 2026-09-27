import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateMessageDto {
    @IsString()
    @IsOptional()
    reply?: string;

    @IsString()
    @IsNotEmpty()
    user!: string;

    @IsString()
    @IsOptional()
    message?: string;

    @IsArray()
    @IsOptional()
    images?: any[];

    @IsArray()
    @IsOptional()
    videos?: any[];

    @IsString()
    @IsNotEmpty()
    group!: string;

    @IsString()
    @IsOptional()
    topic?: string;

    @IsArray()
    @IsOptional()
    groups?: any[];

    @IsArray()
    @IsOptional()
    options?: any[];

    @IsString()
    @IsOptional()
    type?: string;

    @IsBoolean()
    @IsOptional()
    pin?: boolean;

    @IsArray()
    @IsOptional()
    views?: any[];

    @IsArray()
    @IsOptional()
    reactions?: Record<string, any>;
}