import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, createHash, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import {
  isOAuthProvider,
  OAUTH_PROVIDERS,
  type OAuthProfile,
  type OAuthProvider,
} from './oauth.providers';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { getOAuthRedirectBase, type OAuthPlatform } from './oauth.redirect';

function isOAuthPlatform(value: string): value is OAuthPlatform {
  return value === 'client' || value === 'panel' || value === 'mobile';
}

type ProviderConfig = {
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scopes: string[];
  extraAuthParams?: Record<string, string>;
  tokenAuth?: 'body' | 'basic';
  tokenMethod?: 'GET' | 'POST';
};

const PROVIDER_ENDPOINTS: Record<
  Exclude<OAuthProvider, 'telegram'>,
  ProviderConfig
> = {
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scopes: ['openid', 'email', 'profile'],
  },
  github: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
  },
  facebook: {
    authorizationUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    userInfoUrl:
      'https://graph.facebook.com/me?fields=id,name,email,picture.type(large)',
    scopes: ['email', 'public_profile'],
    tokenMethod: 'GET',
  },
  linkedin: {
    authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    scopes: ['openid', 'profile', 'email'],
  },
  microsoft: {
    authorizationUrl:
      'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    scopes: ['openid', 'email', 'profile', 'offline_access'],
  },
  notion: {
    authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [],
    extraAuthParams: { owner: 'user' },
    tokenAuth: 'basic',
  },
  apple: {
    authorizationUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scopes: ['name', 'email'],
    extraAuthParams: { response_mode: 'form_post' },
  },
  atlassian: {
    authorizationUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    userInfoUrl: 'https://api.atlassian.com/me',
    scopes: ['read:me', 'offline_access'],
    extraAuthParams: { audience: 'api.atlassian.com', prompt: 'consent' },
  },
};

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  listProviders() {
    return OAUTH_PROVIDERS.map((id) => ({
      id,
      configured: this.isConfigured(id),
    }));
  }

  isConfigured(provider: OAuthProvider) {
    if (provider === 'telegram') {
      return Boolean(this.env('TELEGRAM_BOT_TOKEN'));
    }
    if (provider === 'apple') {
      return Boolean(
        this.env('APPLE_OAUTH_CLIENT_ID') &&
        this.env('APPLE_OAUTH_TEAM_ID') &&
        this.env('APPLE_OAUTH_KEY_ID') &&
        this.env('APPLE_OAUTH_PRIVATE_KEY'),
      );
    }
    return Boolean(this.clientId(provider) && this.clientSecret(provider));
  }

  buildAuthorizeUrl(
    provider: OAuthProvider,
    platform: OAuthPlatform,
    locale?: string,
  ) {
    if (provider === 'telegram') {
      throw new BadRequestException(
        'Telegram login alohida widget orqali ishlaydi.',
      );
    }
    if (!this.isConfigured(provider)) {
      throw new ServiceUnavailableException(
        `${provider} OAuth sozlanmagan. Client ID/secret .env ga qo‘shilishi kerak.`,
      );
    }
    const endpoints = PROVIDER_ENDPOINTS[provider];
    const state = this.jwtService.sign(
      {
        provider,
        platform,
        locale: locale || 'uz',
        nonce: randomBytes(8).toString('hex'),
      },
      { expiresIn: '10m' },
    );
    const params = new URLSearchParams({
      client_id: this.clientId(provider),
      redirect_uri: this.callbackUrl(provider),
      response_type: 'code',
      state,
      ...(endpoints.scopes.length ? { scope: endpoints.scopes.join(' ') } : {}),
      ...endpoints.extraAuthParams,
    });
    const authorizationUrl = this.withTenant(
      endpoints.authorizationUrl || '',
      provider,
    );
    return `${authorizationUrl}?${params.toString()}`;
  }

  parseState(state: string, expectedProvider?: OAuthProvider) {
    try {
      const payload = this.jwtService.verify<{
        provider: string;
        platform: string;
        locale?: string;
      }>(state);
      if (
        !isOAuthProvider(payload.provider) ||
        (expectedProvider && payload.provider !== expectedProvider) ||
        !isOAuthPlatform(payload.platform) ||
        (payload.locale !== undefined && typeof payload.locale !== 'string')
      ) {
        throw new Error('bad provider');
      }
      return {
        ...payload,
        provider: payload.provider,
        platform: payload.platform,
      };
    } catch {
      throw new BadRequestException(
        'OAuth state yaroqsiz yoki muddati tugagan.',
      );
    }
  }

  async fetchProfile(
    provider: OAuthProvider,
    code: string,
  ): Promise<OAuthProfile> {
    if (provider === 'telegram') {
      throw new BadRequestException(
        'Telegram OAuth code oqimidan foydalanmaydi.',
      );
    }
    const endpoints = PROVIDER_ENDPOINTS[provider];
    const token = await this.exchangeToken(provider, code);
    if (provider === 'notion') {
      return this.notionProfile(token);
    }
    if (provider === 'apple') {
      return this.appleProfile(token);
    }
    const accessToken = String(token.access_token || '');
    if (!accessToken || !endpoints.userInfoUrl) {
      throw new BadRequestException(
        'OAuth tokenidan foydalanuvchi ma’lumoti olinmadi.',
      );
    }
    const userResponse = await fetch(
      this.withTenant(endpoints.userInfoUrl, provider),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'User-Agent': 'market-engine-auth',
        },
      },
    );
    const profile = (await userResponse.json()) as Record<string, unknown>;
    if (!userResponse.ok) {
      throw new BadRequestException('OAuth profilini yuklab bo‘lmadi.');
    }
    if (provider === 'github') {
      return this.githubProfile(profile, accessToken);
    }
    return this.normalizeProfile(provider, profile);
  }

  verifyTelegram(dto: TelegramAuthDto): OAuthProfile {
    const botToken = this.env('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new ServiceUnavailableException('Telegram Auth sozlanmagan.');
    }
    if (Math.abs(Date.now() / 1000 - dto.auth_date) > 86400) {
      throw new BadRequestException('Telegram login muddati tugagan.');
    }
    const rest: Record<string, string | number> = {
      id: dto.id,
      first_name: dto.first_name,
      auth_date: dto.auth_date,
      ...(dto.last_name ? { last_name: dto.last_name } : {}),
      ...(dto.username ? { username: dto.username } : {}),
      ...(dto.photo_url ? { photo_url: dto.photo_url } : {}),
    };
    const dataCheckString = Object.entries(rest)
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n');
    const secretKey = createHash('sha256').update(botToken).digest();
    const hmac = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    if (hmac !== dto.hash) {
      throw new BadRequestException('Telegram imzosi yaroqsiz.');
    }
    return {
      id: String(dto.id),
      firstName: dto.first_name,
      lastName: dto.last_name,
      email: `telegram_${dto.id}@oauth.local`,
      image: dto.photo_url,
    };
  }

  successRedirect(platform: OAuthPlatform, locale: string, code: string) {
    const base = this.redirectBase(platform, locale);
    const url = new URL(base);
    url.searchParams.set('step', 'oauth-callback');
    url.searchParams.set('code', code);
    return url.toString();
  }

  errorRedirect(platform: OAuthPlatform, locale: string, message: string) {
    const base = this.redirectBase(platform, locale);
    const url = new URL(base);
    url.searchParams.set('step', 'methods');
    url.searchParams.set('error', message);
    return url.toString();
  }

  private redirectBase(platform: OAuthPlatform, locale: string) {
    return getOAuthRedirectBase(platform, locale, {
      environment: this.env('NODE_ENV'),
      clientRedirectUrl: this.env('OAUTH_CLIENT_REDIRECT_URL'),
      panelRedirectUrl: this.env('OAUTH_PANEL_REDIRECT_URL'),
      mobileRedirectUrl: this.env('OAUTH_MOBILE_REDIRECT_URL'),
    });
  }

  private async exchangeToken(
    provider: Exclude<OAuthProvider, 'telegram'>,
    code: string,
  ) {
    const endpoints = PROVIDER_ENDPOINTS[provider];
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.callbackUrl(provider),
      client_id: this.clientId(provider),
      client_secret:
        provider === 'apple'
          ? this.appleClientSecret()
          : this.clientSecret(provider),
    });
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (endpoints.tokenAuth === 'basic') {
      headers.Authorization = `Basic ${Buffer.from(
        `${this.clientId(provider)}:${this.clientSecret(provider)}`,
      ).toString('base64')}`;
      body.delete('client_secret');
      body.delete('client_id');
    }
    const tokenMethod = endpoints.tokenMethod || 'POST';
    if (tokenMethod === 'GET') {
      body.delete('grant_type');
    }
    const tokenUrl = this.withTenant(endpoints.tokenUrl || '', provider);
    const requestUrl =
      tokenMethod === 'GET' ? `${tokenUrl}?${body.toString()}` : tokenUrl;
    let response: Response;
    try {
      response = await fetch(requestUrl, {
        method: tokenMethod,
        headers:
          tokenMethod === 'GET' ? { Accept: 'application/json' } : headers,
        ...(tokenMethod === 'POST' ? { body } : {}),
      });
    } catch (error) {
      this.logger.error(
        `OAuth ${provider} token request failed before receiving a response (${
          error instanceof Error ? error.name : 'Unknown network error'
        })`,
      );
      throw new ServiceUnavailableException(
        `${provider} OAuth token serveriga ulanib bo‘lmadi.`,
      );
    }

    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch (error) {
      this.logger.error(
        `OAuth ${provider} token response could not be read (HTTP ${response.status}): ${
          error instanceof Error ? error.message : 'Unknown response error'
        }`,
      );
      throw new ServiceUnavailableException(
        `${provider} OAuth javobini o‘qib bo‘lmadi.`,
      );
    }

    let token: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(responseBody);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid token response shape');
      }
      token = parsed as Record<string, unknown>;
    } catch (error) {
      this.logger.error(
        `OAuth ${provider} token endpoint returned invalid JSON (HTTP ${response.status})`,
      );
      throw new BadRequestException(
        `${provider} OAuth token serveridan noto‘g‘ri javob keldi.`,
      );
    }

    if (!response.ok) {
      const providerErrorObject =
        token.error && typeof token.error === 'object'
          ? (token.error as Record<string, unknown>)
          : undefined;
      const providerError = [
        typeof token.error === 'string' ? token.error : undefined,
        providerErrorObject?.message,
        providerErrorObject?.type,
        token.error_description,
        token.message,
      ]
        .filter((value): value is string => typeof value === 'string')
        .join(': ')
        .slice(0, 500);
      const safeProviderError = [code, this.clientSecret(provider)]
        .filter(Boolean)
        .reduce(
          (message, secret) => message.replaceAll(secret, '[redacted]'),
          providerError,
        );
      this.logger.error(
        `OAuth ${provider} token exchange failed (HTTP ${response.status})${
          safeProviderError ? `: ${safeProviderError}` : ''
        }`,
      );
      throw new BadRequestException(
        `${provider} OAuth tokenini olish muvaffaqiyatsiz tugadi.`,
      );
    }

    if (typeof token.access_token !== 'string' || !token.access_token) {
      this.logger.error(
        `OAuth ${provider} token endpoint returned no access token (HTTP ${response.status})`,
      );
      throw new BadRequestException(
        `${provider} OAuth javobida access token yo‘q.`,
      );
    }

    return token;
  }

  private async githubProfile(
    profile: Record<string, unknown>,
    accessToken: string,
  ) {
    let email =
      typeof profile.email === 'string' && profile.email
        ? profile.email
        : undefined;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'User-Agent': 'market-engine-auth',
        },
      });
      const emails = (await emailsResponse.json()) as Array<{
        email?: string;
        primary?: boolean;
        verified?: boolean;
      }>;
      email =
        emails.find((item) => item.primary && item.verified)?.email ||
        emails.find((item) => item.verified)?.email ||
        emails[0]?.email;
    }
    const name = typeof profile.name === 'string' ? profile.name : '';
    const [firstName, ...last] = name.split(' ');
    return {
      id: String(profile.id),
      email,
      firstName: firstName || String(profile.login || 'GitHub'),
      lastName: last.join(' ') || undefined,
      image:
        typeof profile.avatar_url === 'string' ? profile.avatar_url : undefined,
    };
  }

  private notionProfile(token: Record<string, unknown>): OAuthProfile {
    const owner = token.owner as
      | {
          user?: {
            id?: string;
            name?: string;
            avatar_url?: string;
            person?: { email?: string };
          };
        }
      | undefined;
    const user = owner?.user;
    const [firstName, ...last] = String(user?.name || 'Notion').split(' ');
    return {
      id: String(user?.id || token.bot_id || ''),
      email: user?.person?.email,
      firstName,
      lastName: last.join(' ') || undefined,
      image: user?.avatar_url,
    };
  }

  private appleProfile(token: Record<string, unknown>): OAuthProfile {
    const idToken = String(token.id_token || '');
    const payload = JSON.parse(
      Buffer.from(idToken.split('.')[1] || '', 'base64url').toString('utf8'),
    ) as { sub?: string; email?: string };
    return {
      id: String(payload.sub || ''),
      email: payload.email,
      firstName: 'Apple',
    };
  }

  private normalizeProfile(
    provider: OAuthProvider,
    profile: Record<string, unknown>,
  ): OAuthProfile {
    const name =
      typeof profile.name === 'string'
        ? profile.name
        : [profile.given_name, profile.family_name].filter(Boolean).join(' ');
    const [firstName, ...last] = name.split(' ').filter(Boolean);
    const picture = profile.picture;
    const image =
      typeof picture === 'string'
        ? picture
        : picture && typeof picture === 'object' && 'data' in picture
          ? String((picture as { data?: { url?: string } }).data?.url || '')
          : typeof profile.avatarUrl === 'string'
            ? profile.avatarUrl
            : undefined;
    return {
      id: String(profile.sub || profile.id || ''),
      email: typeof profile.email === 'string' ? profile.email : undefined,
      firstName: firstName || provider,
      lastName:
        last.join(' ') ||
        (typeof profile.family_name === 'string'
          ? profile.family_name
          : undefined),
      image,
    };
  }

  private appleClientSecret() {
    const privateKey = this.env('APPLE_OAUTH_PRIVATE_KEY')?.replace(
      /\\n/g,
      '\n',
    );
    if (!privateKey) {
      throw new ServiceUnavailableException(
        'Apple OAuth private key sozlanmagan.',
      );
    }
    return jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      issuer: this.env('APPLE_OAUTH_TEAM_ID'),
      subject: this.env('APPLE_OAUTH_CLIENT_ID'),
      audience: 'https://appleid.apple.com',
      expiresIn: '1h',
      keyid: this.env('APPLE_OAUTH_KEY_ID'),
    });
  }

  private clientId(provider: Exclude<OAuthProvider, 'telegram'>) {
    return this.env(`${provider.toUpperCase()}_OAUTH_CLIENT_ID`);
  }

  private clientSecret(provider: Exclude<OAuthProvider, 'telegram'>) {
    return this.env(`${provider.toUpperCase()}_OAUTH_CLIENT_SECRET`);
  }

  private callbackUrl(provider: OAuthProvider) {
    const base = (
      this.env('API_PUBLIC_URL') || 'http://localhost:4000'
    ).replace(/\/+$/, '');
    return `${base}/auth/oauth/${provider}/callback`;
  }

  private withTenant(url: string, provider: OAuthProvider) {
    if (provider !== 'microsoft') return url;
    return url.replace(
      '{tenant}',
      this.env('MICROSOFT_OAUTH_TENANT') || 'common',
    );
  }

  private env(name: string) {
    return this.config.get<string>(name)?.trim() || '';
  }
}
