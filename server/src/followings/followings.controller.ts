import {
  Body,
  Controller,
  Delete,
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
import type { Request } from 'express';

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller('followings')
export class FollowingsController {
  constructor(private readonly followings: FollowingsService) {}

  @Get()
  findAll(@Query() query: FollowingsQueryDto) { return this.followings.findAll(query); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.followings.findOne(id); }

  @Patch(':marketId')
  @UseGuards(JwtAuthGuard)
  toggleFollow(
    @Param('marketId', ParseUUIDPipe) marketId: string,
    @Req() req: AuthenticatedRequest,
  ) { return this.followings.toggleFollow(req.user.userId, marketId); }

  @Patch('block/:marketId')
  @UseGuards(JwtAuthGuard, MarketAccessGuard)
  toggleBlock(
    @Param('marketId', ParseUUIDPipe) marketId: string,
    @Body() body: ToggleBlockDto,
  ) { return this.followings.toggleBlock(body.targetUserId, marketId); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, FollowingOwnerGuard)
  delete(@Param('id', ParseUUIDPipe) id: string) { return this.followings.delete(id); }
}
