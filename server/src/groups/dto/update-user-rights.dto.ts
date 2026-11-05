import { IsBoolean, IsNotEmpty, IsObject, IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CrudPermissionsDto {
    @IsBoolean() @IsNotEmpty() message: boolean;
    @IsBoolean() @IsNotEmpty() image: boolean;
    @IsBoolean() @IsNotEmpty() video: boolean;
    @IsBoolean() @IsNotEmpty() audio: boolean;
    @IsBoolean() @IsNotEmpty() poll: boolean;
}

class CrudMainDto {
    @IsObject() @IsNotEmpty() create: CrudPermissionsDto;
    @IsObject() @IsNotEmpty() delete: CrudPermissionsDto;
}

export class UpdateUserRightsDto {
    @IsString() @IsNotEmpty() role: string;
    @IsString() @IsNotEmpty() tag: string;
    @IsArray() @IsNotEmpty() setTag: string[];
    
    @IsBoolean() @IsNotEmpty() topic: boolean;
    @IsBoolean() @IsNotEmpty() poll: boolean;
    @IsBoolean() @IsNotEmpty() addMembers: boolean;
    @IsBoolean() @IsNotEmpty() deleteMembers: boolean;
    @IsBoolean() @IsNotEmpty() updateGroup: boolean;

    @IsObject() @IsNotEmpty() crud: CrudMainDto;
    @IsObject() @IsNotEmpty() pin: CrudPermissionsDto;

    @IsOptional()
    @IsObject()
    topicPermissions?: Record<string, any>;
}