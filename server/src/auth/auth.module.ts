import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OAuthService } from './oauth.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error(
            'JWT_SECRET must be set to a strong value of at least 32 characters.',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '15m' as const },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OAuthService],
  exports: [JwtStrategy, JwtModule],
})
export class AuthModule {}