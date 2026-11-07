import { createHash } from 'crypto';

const SUCCESS_TTL_MS = 2 * 60 * 1000;
const FAILURE_TTL_MS = 15 * 1000;

type CallbackEntry = {
  promise: Promise<string>;
  expiresAt: number;
};

export class OAuthCallbackCache {
  private readonly entries = new Map<string, CallbackEntry>();

  run(provider: string, code: string, exchange: () => Promise<string>) {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }

    const key = createHash('sha256')
      .update(`${provider}:${code}`)
      .digest('hex');
    const cached = this.entries.get(key);
    if (cached) return cached.promise;

    const entry: CallbackEntry = {
      promise: Promise.resolve(''),
      expiresAt: Number.POSITIVE_INFINITY,
    };
    entry.promise = Promise.resolve()
      .then(exchange)
      .then(
        (ticket) => {
          entry.expiresAt = Date.now() + SUCCESS_TTL_MS;
          return ticket;
        },
        (error: unknown) => {
          entry.expiresAt = Date.now() + FAILURE_TTL_MS;
          throw error;
        },
      );
    this.entries.set(key, entry);
    return entry.promise;
  }
}
