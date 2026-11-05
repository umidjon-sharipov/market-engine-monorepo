import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { VALID_WORKER_PERMISSIONS, WORKER_ROLES } from '../worker-permissions';

export class UpdateWorkerDto {
  @IsOptional()
  @IsString()
  @IsIn(WORKER_ROLES)
  role?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(VALID_WORKER_PERMISSIONS, { each: true })
  permissions?: string[];
}
