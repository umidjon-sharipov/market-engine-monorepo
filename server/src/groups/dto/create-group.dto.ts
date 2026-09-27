import { IsString, IsNotEmpty, IsArray, IsOptional, MaxLength } from 'class-validator';

export class CreateGroupDto {
    @IsString()
    @IsNotEmpty()
    securityLevel!: string;

    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    url!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    type!: string;

    @IsArray()
    @IsOptional()
    topics?: any[];

    @IsString()
    @IsNotEmpty()
    founder!: string;

    @IsArray()
    @IsNotEmpty()
    users!: any[];
}