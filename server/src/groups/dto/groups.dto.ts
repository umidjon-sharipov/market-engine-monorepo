import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum GroupAction {
  leave = 'leave',
  delete = 'delete',
}

export class CreateGroupRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  securityLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  description?: string;

  @IsOptional()
  @IsObject()
  logo?: Record<string, unknown>;
}

export class CreateChatRequestDto {
  @IsString()
  @IsNotEmpty()
  user!: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  description?: string;
}

export class UpdateGroupRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  description?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}

export class TopicRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  url?: string;
}

export class UpdateTopicRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  url?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}

export class GroupDefaultsDto {
  @IsOptional()
  @IsBoolean()
  poll?: boolean;

  @IsOptional()
  @IsObject()
  crud?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  pin?: Record<string, unknown>;
}

export class AddMembersDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  members!: string[];
}
