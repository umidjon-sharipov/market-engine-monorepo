import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { OAuthService } from './oauth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import type { OAuthProfile, OAuthProvider } from './oauth.providers';

const FAILED_OTP_IP_LIMIT = 8;
const IP_BLOCK_MS = 15 * 60 * 1000;
const OTP_WINDOW_MS = 10 * 60 * 1000;
const MAX_OTP_REQUESTS_PER_WINDOW = 3;
const profileSelect = {
  id: true,
  userName: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  latitude: true,
  longitude: true,
  gender: true,
  image: true,
  bio: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly oauth: OAuthService,
  ) {}

  private async checkIpBlock(ip: string) {
    const blockedIp = await this.prisma.ipBlockList.findFirst({
      where: {
        ipAddress: ip,
        blockedUntil: { gt: new Date() },
      },
    });

    if (blockedIp) {
      throw new ForbiddenException(
        'Sizning IP manzilingiz xavfsizlik qoidalarini buzgani uchun vaqtincha bloklangan.',
      );
    }
  }

  private async trackFailedIp(ip: string) {
    const existingBlock = await this.prisma.ipBlockList.findUnique({
      where: { ipAddress: ip },
    });

    if (!existingBlock) {
      await this.prisma.ipBlockList.create({
        data: {
          ipAddress: ip,
          attemptCount: 1,
          blockedUntil: new Date(0),
        },
      });
      return;
    }

    const nextCount = existingBlock.attemptCount + 1;
    await this.prisma.ipBlockList.update({
      where: { ipAddress: ip },
      data: {
        attemptCount: nextCount,
        blockedUntil:
          nextCount >= FAILED_OTP_IP_LIMIT
            ? new Date(Date.now() + IP_BLOCK_MS)
            : existingBlock.blockedUntil,
      },
    });
  }

  private async clearFailedIp(ip: string) {
    await this.prisma.ipBlockList.deleteMany({
      where: { ipAddress: ip, blockedUntil: { lte: new Date() } },
    });
  }

  async sendOtp(dto: SendOtpDto, ip: string, userAgent: string) {
    await this.checkIpBlock(ip);

    const email = dto.email.trim().toLowerCase();
    const firstName = dto.firstName?.trim() || null;
    const pendingPasswordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : null;
    const recentOtps = await this.prisma.userOtp.count({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - OTP_WINDOW_MS) },
      },
    });
    if (recentOtps >= MAX_OTP_REQUESTS_PER_WINDOW) {
      throw new ForbiddenException(
        'Tasdiqlash kodini juda tez-tez so‘radingiz. Biroz kuting.',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, isBlocked: true },
    });
    if (existingUser?.isBlocked) {
      throw new ForbiddenException(
        'Bu akkaunt xavfsizlik maqsadida bloklangan.',
      );
    }

    const otpCode = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_WINDOW_MS);
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    await this.prisma.$transaction([
      this.prisma.userOtp.updateMany({
        where: { email, isUsed: false },
        data: { isUsed: true },
      }),
      this.prisma.userOtp.create({
        data: {
          email,
          otpHash: hashedOtp,
          expiresAt,
          firstName,
          pendingPasswordHash,
          ipAddress: ip,
          userAgent,
          ...(existingUser ? { user: { connect: { id: existingUser.id } } } : {}),
        },
      }),
      this.prisma.auditLog.create({
        data: {
          ipAddress: ip,
          action: 'OTP_REQUESTED',
          details: { email },
          ...(existingUser ? { user: { connect: { id: existingUser.id } } } : {}),
        },
      }),
    ]);

    await this.mail.sendOtpEmail(email, otpCode);

    return { message: 'Tasdiqlash kodi emailingizga yuborildi!' };
  }

  async verifyOtp(dto: VerifyOtpDto, ip: string, userAgent: string) {
    await this.checkIpBlock(ip);

    const email = dto.email.trim().toLowerCase();
    const allowDevBypass =
      this.config.get<string>('NODE_ENV') !== 'production' &&
      this.config.get<string>('ALLOW_DEV_OTP_BYPASS') === 'true';

    const otpRecord = await this.prisma.userOtp.findFirst({
      where: {
        email,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      await this.trackFailedIp(ip);
      throw new UnauthorizedException('Aktiv tasdiqlash kodi topilmadi!');
    }

    const isMatch =
      (await bcrypt.compare(dto.code, otpRecord.otpHash)) ||
      (allowDevBypass && dto.code === '778899');

    if (!isMatch) {
      const updatedOtp = await this.prisma.userOtp.update({
        where: { id: otpRecord.id },
        data: { attemptCount: { increment: 1 } },
      });

      if (updatedOtp.attemptCount >= 5) {
        await this.prisma.userOtp.update({
          where: { id: otpRecord.id },
          data: { isUsed: true },
        });
        await this.trackFailedIp(ip);
        throw new ForbiddenException(
          'Ko‘p marta xato kod kiritilgani uchun ushbu kod bekor qilindi. Yangi kod so‘rang.',
        );
      }

      throw new UnauthorizedException('Tasdiqlash kodi xato!');
    }

    await this.prisma.userOtp.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const firstName = otpRecord.firstName?.trim() || email.split('@')[0];
    return this.completeEmailLogin({
      email,
      firstName,
      passwordHash: otpRecord.pendingPasswordHash,
      ip,
      userAgent,
    });
  }

  async loginWithPassword(dto: LoginDto, ip: string, userAgent: string) {
    await this.checkIpBlock(ip);
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        userName: true,
        passwordHash: true,
        isBlocked: true,
        firstName: true,
      },
    });
    if (!user?.passwordHash) {
      await this.trackFailedIp(ip);
      throw new UnauthorizedException(
        'Bu akkauntda doimiy parol yo‘q. Email OTP orqali kiring.',
      );
    }
    if (user.isBlocked) {
      throw new ForbiddenException('Bu akkaunt xavfsizlik maqsadida bloklangan.');
    }
    const matched = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matched) {
      await this.trackFailedIp(ip);
      throw new UnauthorizedException('Email yoki parol xato.');
    }
    return this.issueSession(user.id, ip, userAgent);
  }

  async setPassword(userId: string, password: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    return { message: 'Parol saqlandi.' };
  }

  listOAuthProviders() {
    return { providers: this.oauth.listProviders() };
  }

  startOAuth(provider: OAuthProvider, platform: string, locale?: string) {
    const normalizedPlatform =
      platform === 'panel' || platform === 'mobile' ? platform : 'client';
    return this.oauth.buildAuthorizeUrl(provider, normalizedPlatform, locale);
  }

  async resolveOAuthUser(provider: OAuthProvider, code: string) {
    const profile = await this.oauth.fetchProfile(provider, code);
    return this.upsertOAuthUser(provider, profile);
  }

  async finishOAuth(
    provider: OAuthProvider,
    code: string,
    ip: string,
    userAgent: string,
  ) {
    const user = await this.resolveOAuthUser(provider, code);
    return this.issueSession(user.id, ip, userAgent);
  }

  async finishTelegram(dto: TelegramAuthDto, ip: string, userAgent: string) {
    const profile = this.oauth.verifyTelegram(dto);
    const user = await this.upsertOAuthUser('telegram', profile);
    return this.issueSession(user.id, ip, userAgent);
  }

  async createOAuthTicket(userId: string) {
    const ticket = await this.prisma.authTicket.create({
      data: {
        userId,
        codeHash: 'oauth-ticket',
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      },
    });
    return ticket.id;
  }

  async exchangeOAuthTicket(code: string, ip: string, userAgent: string) {
    const ticket = await this.prisma.authTicket.findUnique({
      where: { id: code },
    });
    if (!ticket || ticket.usedAt || ticket.expiresAt <= new Date()) {
      throw new UnauthorizedException('OAuth kodi yaroqsiz yoki muddati tugagan.');
    }
    await this.prisma.authTicket.update({
      where: { id: ticket.id },
      data: { usedAt: new Date() },
    });
    return this.issueSession(ticket.userId, ip, userAgent);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...profileSelect, passwordHash: true },
    });

    if (!user) throw new UnauthorizedException('Foydalanuvchi topilmadi');
    return this.toPublicUser(user);
  }

  async updateProfile(userId: string, body: UpdateProfileDto) {
    if ((body.latitude === undefined) !== (body.longitude === undefined)) {
      throw new BadRequestException(
        'Latitude va longitude koordinatalari birga yuborilishi kerak.',
      );
    }
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: this.toUpdateProfileInput(body),
      select: profileSelect,
    });

    return {
      message: 'Profil muvaffaqiyatli yangilandi!',
      user: updatedUser,
    };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({
      where: { id: userId },
    });
    return { message: 'Hisob muvaffaqiyatli o‘chirildi' };
  }

  async updateImage(image: string, email: string) {
    return this.prisma.user.update({
      where: { email },
      data: { image },
      select: profileSelect,
    });
  }

  async refreshTokens(oldRefreshToken: string) {
    if (!oldRefreshToken?.trim()) {
      throw new UnauthorizedException('Refresh token yuborilmadi.');
    }
    try {
      const payload = this.jwtService.verify(oldRefreshToken);
      const userId = payload.sub;
      const sessionId = payload.sid;

      if (!sessionId) {
        throw new UnauthorizedException('Refresh token yaroqsiz.');
      }

      const session = await this.prisma.userSession.findFirst({
        where: {
          id: sessionId,
          userId,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new UnauthorizedException('Sessiya yaroqsiz yoki muddati tugagan.');
      }

      const isMatch = await bcrypt.compare(
        oldRefreshToken,
        session.refreshTokenHash,
      );
      if (!isMatch) {
        throw new UnauthorizedException('Refresh token mos kelmadi.');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, userName: true, isBlocked: true },
      });

      if (!user || user.isBlocked) {
        throw new UnauthorizedException('Foydalanuvchi topilmadi.');
      }

      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      });

      const nextSessionId = randomUUID();
      const nextPayload = {
        sub: user.id,
        email: user.email,
        userName: user.userName,
        sid: nextSessionId,
      };

      const accessToken = this.jwtService.sign(nextPayload, {
        expiresIn: '15m',
      });
      const refreshToken = this.jwtService.sign(nextPayload, {
        expiresIn: '7d',
      });

      await this.prisma.userSession.create({
        data: {
          id: nextSessionId,
          refreshTokenHash: await bcrypt.hash(refreshToken, 10),
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          user: { connect: { id: user.id } },
        },
      });

      return { accessToken, refreshToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Refresh token yaroqsiz yoki eskirgan.');
    }
  }

  private async completeEmailLogin(input: {
    email: string;
    firstName: string;
    passwordHash: string | null;
    ip: string;
    userAgent: string;
  }) {
    let user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (user?.isBlocked) {
      throw new ForbiddenException('Bu akkaunt xavfsizlik maqsadida bloklangan.');
    }
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          userName: `user_${randomUUID().replace(/-/g, '').slice(0, 10)}`,
          image: 'https://i.ibb.co/nNZrjBSD/user.png',
          ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: user.firstName?.trim() ? user.firstName : input.firstName,
          ...(input.passwordHash && !user.passwordHash
            ? { passwordHash: input.passwordHash }
            : {}),
        },
      });
    }
    return this.issueSession(user.id, input.ip, input.userAgent);
  }

  private async upsertOAuthUser(provider: OAuthProvider, profile: OAuthProfile) {
    if (!profile.id) {
      throw new BadRequestException('OAuth providerdan foydalanuvchi ID kelmadi.');
    }
    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: profile.id,
        },
      },
    });
    if (existingIdentity) {
      return this.prisma.user.findUniqueOrThrow({
        where: { id: existingIdentity.userId },
      });
    }
    const email =
      profile.email?.trim().toLowerCase() ||
      `${provider}_${profile.id.replace(/[^a-zA-Z0-9]/g, '')}@oauth.local`;
    const firstName = (profile.firstName || provider).trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    const user =
      existingUser ??
      (await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName: profile.lastName,
          image: profile.image || 'https://i.ibb.co/nNZrjBSD/user.png',
          userName: `user_${randomUUID().replace(/-/g, '').slice(0, 10)}`,
        },
      }));
    if (user.isBlocked) {
      throw new ForbiddenException('Bu akkaunt xavfsizlik maqsadida bloklangan.');
    }
    await this.prisma.authIdentity.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId: profile.id,
      },
    });
    if (!user.firstName?.trim()) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { firstName, lastName: profile.lastName, image: profile.image || user.image },
      });
    }
    return user;
  }

  private async issueSession(userId: string, ip: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...profileSelect, passwordHash: true, isBlocked: true },
    });
    if (!user || user.isBlocked) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi.');
    }
    const sessionId = randomUUID();
    const payload = {
      sub: user.id,
      email: user.email,
      userName: user.userName,
      sid: sessionId,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
        ipAddress: ip,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { connect: { id: user.id } },
      },
    });
    await this.prisma.auditLog.create({
      data: {
        ipAddress: ip,
        action: 'USER_LOGIN_SUCCESS',
        details: { userAgent },
        user: { connect: { id: user.id } },
      },
    });
    await this.clearFailedIp(ip);
    return {
      message: 'Xush kelibsiz!',
      accessToken,
      refreshToken,
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: {
    passwordHash?: string | null;
    id: string;
    userName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
    gender: string | null;
    image: string | null;
    bio: string | null;
    createdAt: Date;
  }) {
    const { passwordHash, ...safeUser } = user;
    return { ...safeUser, hasPassword: Boolean(passwordHash) };
  }

  private toUpdateProfileInput(body: UpdateProfileDto): Prisma.UserUpdateInput {
    return {
      ...(body.userName && { userName: body.userName }),
      ...(body.firstName !== undefined && { firstName: body.firstName }),
      ...(body.lastName !== undefined && { lastName: body.lastName }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.latitude !== undefined && { latitude: body.latitude }),
      ...(body.longitude !== undefined && { longitude: body.longitude }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.image && { image: body.image }),
    };
  }
}
