import { Injectable } from '@nestjs/common';
import { FollowingRepository } from './following.repository';
import { FollowingsQueryDto } from './dto/create-following.dto';

@Injectable()
export class FollowingsService {
  constructor(private readonly followings: FollowingRepository) {}

  findAll(query: FollowingsQueryDto) {
    return this.followings.findAllWithRelations({
      ...(query.userId && { userId: query.userId }),
      ...(query.marketId && { marketId: query.marketId }),
    });
  }

  findMine(userId: string) {
    return this.followings.findMine(userId);
  }

  searchMarketsForUser(userId: string, query: string) {
    return this.followings.searchMarketsForUser(userId, query);
  }

  findOne(id: string) { return this.followings.findOne({ id }); }

  create(userId: string, marketId: string) { return this.toggleFollow(userId, marketId); }

  update(id: string, userId: string) { return this.followings.update({ id }, { userId }); }

  delete(id: string) { return this.followings.delete({ id }); }

  toggleFollow(userId: string, marketId: string) {
    return this.followings.toggleFollow(userId, marketId);
  }

  toggleBlock(targetUserId: string, marketId: string) {
    return this.followings.toggleBlock(targetUserId, marketId);
  }
}
