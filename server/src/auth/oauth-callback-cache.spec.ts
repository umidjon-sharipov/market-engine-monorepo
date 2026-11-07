import { OAuthCallbackCache } from './oauth-callback-cache';

describe('OAuthCallbackCache', () => {
  it('runs a callback code exchange once for concurrent and repeated callbacks', async () => {
    const cache = new OAuthCallbackCache();
    const exchange = jest.fn().mockResolvedValue('ticket-id');

    await expect(
      Promise.all([
        cache.run('facebook', 'single-use-code', exchange),
        cache.run('facebook', 'single-use-code', exchange),
      ]),
    ).resolves.toEqual(['ticket-id', 'ticket-id']);
    await expect(
      cache.run('facebook', 'single-use-code', exchange),
    ).resolves.toBe('ticket-id');

    expect(exchange).toHaveBeenCalledTimes(1);
  });

  it('keeps codes from different providers separate', async () => {
    const cache = new OAuthCallbackCache();
    const exchange = jest.fn().mockResolvedValue('ticket-id');

    await cache.run('facebook', 'same-code', exchange);
    await cache.run('github', 'same-code', exchange);

    expect(exchange).toHaveBeenCalledTimes(2);
  });
});
