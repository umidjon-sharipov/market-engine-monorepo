import { Injectable } from '@nestjs/common';
import { FollowingRepository } from './following.repository';
@Injectable()
export class FollowingsService {
  constructor(private readonly followings: FollowingRepository) {}

  findAll(userId: string, marketId?: string) {
    return this.followings.findAllForUser(userId, marketId);
  }

  findMine(userId: string) {
    return this.followings.findMine(userId);
  }

  searchMarketsForUser(userId: string, query: string) {
    return this.followings.searchMarketsForUser(userId, query);
  }

  findOne(id: string) { return this.followings.findOne({ id }); }

  toggleFollow(userId: string, marketId: string) {
    return this.followings.toggleFollow(userId, marketId);
  }

  toggleBlock(targetUserId: string, marketId: string) {
    return this.followings.toggleBlock(targetUserId, marketId);
  }
}
