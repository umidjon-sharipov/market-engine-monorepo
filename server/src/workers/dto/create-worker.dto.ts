import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { WORKER_ROLES } from '../worker-permissions';
import { VALID_WORKER_PERMISSIONS } from '../worker-permissions';

export class CreateWorkerDto {
  @IsUUID('4')
  marketId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  identifier?: string;

  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(WORKER_ROLES)
  role!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(VALID_WORKER_PERMISSIONS, { each: true })
  permissions?: string[];
}
