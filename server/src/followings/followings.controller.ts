import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAccessGuard } from '../auth/guards/market-access.guard';
import { FollowingOwnerGuard } from './following-owner.guard';
import { FollowingsService } from './followings.service';
import { FollowingsQueryDto, ToggleBlockDto } from './dto/create-following.dto';
import { SearchMarketsDto } from './dto/search-markets.dto';
import type { Request } from 'express';

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller('followings')
export class FollowingsController {
  constructor(private readonly followings: FollowingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query() query: FollowingsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.followings.findAll(req.user.userId, query.marketId);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: AuthenticatedRequest) {
    return this.followings.findMine(req.user.userId);
  }

  @Get('markets/search')
  @UseGuards(JwtAuthGuard)
  searchMarkets(
    @Query() query: SearchMarketsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.followings.searchMarketsForUser(req.user.userId, query.q);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, FollowingOwnerGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.followings.findOne(id);
  }

  @Patch(':marketId')
  @UseGuards(JwtAuthGuard)
  toggleFollow(
    @Param('marketId', ParseUUIDPipe) marketId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.followings.toggleFollow(req.user.userId, marketId);
  }

  @Patch('block/:marketId')
  @UseGuards(
    JwtAuthGuard,
    MarketAccessGuard(
      'followings',
      undefined,
      ['owner', 'admin', 'manager'],
      undefined,
      'block',
    ),
  )
  toggleBlock(
    @Param('marketId', ParseUUIDPipe) marketId: string,
    @Body() body: ToggleBlockDto,
  ) {
    return this.followings.toggleBlock(body.targetUserId, marketId);
  }
}
