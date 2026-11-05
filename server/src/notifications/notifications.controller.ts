import {
  Controller,
  Get,
  UnauthorizedException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = Request & {
  user?: { userId?: string };
};

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findMine(
    @Req() request: AuthenticatedRequest,
    @Query('limit', new ParseIntPipe({ optional: true })) rawLimit = 20,
  ) {
    return this.notifications.findMine(
      this.getUserId(request),
      Math.max(1, Math.min(rawLimit, 50)),
    );
  }

  @Patch('read-all')
  markAllRead(@Req() request: AuthenticatedRequest) {
    return this.notifications.markAllRead(this.getUserId(request));
  }

  @Patch(':id/read')
  markRead(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markRead(this.getUserId(request), id);
  }

  private getUserId(request: AuthenticatedRequest) {
    if (!request.user?.userId) {
      throw new UnauthorizedException('Autentifikatsiya talab qilinadi.');
    }
    return request.user.userId;
  }
}
