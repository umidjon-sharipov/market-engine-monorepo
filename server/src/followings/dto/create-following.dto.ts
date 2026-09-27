import { IsOptional, IsUUID } from 'class-validator';

export class FollowingsQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  marketId?: string;
}

export class ToggleBlockDto {
  @IsUUID()
  targetUserId!: string;
}
