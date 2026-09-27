import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateFollowingDto {
  @IsOptional()
  @IsUUID()
  marketId?: string;

  @IsOptional()
  @IsBoolean()
  isFollowing?: boolean;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
