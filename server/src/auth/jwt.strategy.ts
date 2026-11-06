import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type JwtPayload = {
  sub?: string;
  email?: string;
  userName?: string;
  role?: string;
  sid?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.sid) {
      throw new UnauthorizedException('Token yaroqsiz.');
    }

    const [user, session] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, userName: true, isBlocked: true },
      }),
      this.prisma.userSession.findFirst({
        where: {
          id: payload.sid,
          userId: payload.sub,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      }),
    ]);

    if (!user || user.isBlocked || !session) {
      throw new UnauthorizedException('Sessiya yaroqsiz.');
    }

    return {
      userId: user.id,
      userName: user.userName,
      email: user.email,
      role: payload.role,
      sid: payload.sid,
    };
  }
}
