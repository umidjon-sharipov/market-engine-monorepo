import { Module } from '@nestjs/common';
import { FollowingsController } from './followings.controller';
import { FollowingsService } from './followings.service';
import { FollowingRepository } from './following.repository';
import { FollowingOwnerGuard } from './following-owner.guard';

@Module({
  controllers: [FollowingsController],
  providers: [FollowingsService, FollowingRepository, FollowingOwnerGuard],
})
export class FollowingsModule {}
