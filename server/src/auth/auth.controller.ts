import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  All,
  Body,
  UseGuards,
  Req,
  Res,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { OAuthExchangeDto } from './dto/oauth-exchange.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { Throttle } from '@nestjs/throttler';
import { getClientIp } from '../common/helpers/client-ip.helper';
import type { Request, Response } from 'express';
import { isOAuthProvider } from './oauth.providers';
import { OAuthService } from './oauth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauth: OAuthService,
  ) {}

  @Get('oauth/providers')
  listProviders() {
    return this.authService.listOAuthProviders();
  }

  @Get('oauth/:provider')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async startOAuth(
    @Param('provider') provider: string,
    @Query('platform') platform = 'client',
    @Query('locale') locale = 'uz',
    @Res() response: Response,
  ) {
    if (!isOAuthProvider(provider)) {
      throw new BadRequestException('Noma’lum OAuth provider.');
    }
    try {
      const url = this.authService.startOAuth(provider, platform, locale);
      return response.redirect(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OAuth ishga tushmadi.';
      return response.redirect(
        this.oauth.errorRedirect(
          platform === 'panel' || platform === 'mobile' ? platform : 'client',
          locale,
          message,
        ),
      );
    }
  }

  @All('oauth/:provider/callback')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async oauthCallback(
    @Param('provider') provider: string,
    @Req() request: Request,
    @Res() response: Response,
    @Query() query: Record<string, string>,
    @Body() body: Record<string, string>,
  ) {
    const platformFallback = 'client';
    if (!isOAuthProvider(provider)) {
      return response.redirect(
        this.oauth.errorRedirect(platformFallback, 'uz', 'Noma’lum OAuth provider.'),
      );
    }
    const code = query.code || body?.code;
    const state = query.state || body?.state;
    const providerError = query.error || body?.error;
    let platform: 'client' | 'panel' | 'mobile' = platformFallback;
    let locale = 'uz';
    try {
      if (!state) {
        throw new BadRequestException('OAuth state kelmadi.');
      }
      const parsed = this.oauth.parseState(state, provider);
      platform = parsed.platform;
      locale = parsed.locale || 'uz';
      if (providerError) {
        return response.redirect(
          this.oauth.errorRedirect(platform, locale, String(providerError)),
        );
      }
      if (!code) {
        return response.redirect(
          this.oauth.errorRedirect(platform, locale, 'OAuth code kelmadi.'),
        );
      }
      const ticket = await this.authService.createOAuthCallbackTicket(
        provider,
        code,
      );
      return response.redirect(this.oauth.successRedirect(platform, locale, ticket));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'OAuth callback xatosi.';
      return response.redirect(this.oauth.errorRedirect(platform, locale, message));
    }
  }

  @Post('oauth/telegram')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  telegram(@Body() dto: TelegramAuthDto, @Req() req: Request) {
    return this.authService.finishTelegram(
      dto,
      getClientIp(req),
      String(req.headers['user-agent'] || 'unknown'),
    );
  }

  @Post('oauth/exchange')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  exchange(@Body() dto: OAuthExchangeDto, @Req() req: Request) {
    return this.authService.exchangeOAuthTicket(
      dto.code,
      getClientIp(req),
      String(req.headers['user-agent'] || 'unknown'),
    );
  }

  @Post('send-otp')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async sendOtp(@Body() dto: SendOtpDto, @Req() req: Request) {
    const ip = getClientIp(req);
    const userAgent = String(req.headers['user-agent'] || 'unknown');
    return this.authService.sendOtp(dto, ip, userAgent);
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const ip = getClientIp(req);
    const userAgent = String(req.headers['user-agent'] || 'unknown');
    return this.authService.verifyOtp(dto, ip, userAgent);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.loginWithPassword(
      dto,
      getClientIp(req),
      String(req.headers['user-agent'] || 'unknown'),
    );
  }

  @Post('password')
  @UseGuards(JwtAuthGuard)
  setPassword(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: SetPasswordDto,
  ) {
    return this.authService.setPassword(req.user.userId, dto.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request & { user: { userId: string } }) {
    return this.authService.getProfile(req.user.userId);
  }

  @Patch('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: Request & { user: { userId: string } }) {
    return this.authService.deleteAccount(req.user.userId);
  }

  @Patch('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async updateImage(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Req() req: Request & { user: { email: string } },
  ) {
    if (!file) throw new BadRequestException('Yuklash uchun rasm topilmadi!');
    const imageUrl = await uploadImageToImgBB(file);
    return await this.authService.updateImage(imageUrl, req.user.email);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshTokens(refreshToken);
  }
}
