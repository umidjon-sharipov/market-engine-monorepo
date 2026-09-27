import {
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHomePage(@Res() res: Response): void {
    res.sendFile(join(process.cwd(), 'public', 'index.html'));
  }

  @Post('role')
  @UseGuards(JwtAuthGuard)
  async getRole(@Req() req, @Body('marketId') marketId: string) {
    const email = req.user.email;

    return await this.appService.getRole(email, marketId);
  }
}
