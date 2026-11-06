import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtpEmail(email: string, otpCode: string) {
    const panelMailUrl = this.config.get<string>('PANEL_MAIL_URL')?.trim();
    const apiKey = this.config.get<string>('INTERNET_API_KEY')?.trim();
    if (!panelMailUrl || !apiKey) {
      throw new ServiceUnavailableException(
        'OTP yuborish sozlamalari (PANEL_MAIL_URL, INTERNET_API_KEY) to‘liq emas.',
      );
    }

    let response: Response;
    try {
      response = await fetch(panelMailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ email, otp: otpCode }),
      });
    } catch (error) {
      this.logger.error(error);
      throw new ServiceUnavailableException(
        'Panel orqali email yuborib bo‘lmadi. Keyinroq urinib ko‘ring.',
      );
    }

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const message =
        payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        typeof payload.error === 'string'
          ? payload.error
          : 'OTP emailini yuborib bo‘lmadi.';
      this.logger.error(`Panel mail ${response.status}: ${message}`);
      throw new ServiceUnavailableException(message);
    }
  }
}
