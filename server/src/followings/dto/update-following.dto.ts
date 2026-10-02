import { IsOptional, IsUUID } from 'class-validator';

export class UpdateFollowingDto {
  @IsOptional()
  @IsUUID()
  marketId?: string;

}
