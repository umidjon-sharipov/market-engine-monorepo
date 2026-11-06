import type { Request } from 'express';

export function getClientIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const fromHeader = forwardedValue?.split(',')[0]?.trim();
  const ip = fromHeader || request.ip || request.socket?.remoteAddress;
  return ip?.replace(/^::ffff:/, '') || 'unknown';
}
