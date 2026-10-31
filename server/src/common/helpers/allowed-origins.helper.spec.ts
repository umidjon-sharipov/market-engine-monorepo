import { getAllowedOrigins } from './allowed-origins.helper';

describe('getAllowedOrigins', () => {
  it('uses the default origins when no value is configured', () => {
    expect(getAllowedOrigins('')).toEqual([
      'http://localhost:3000',
      'http://localhost:3001',
      'https://market-engine-monorepo.vercel.app',
      'https://panel-market-engine-monorepo.vercel.app',
    ]);
  });

  it('parses a JSON array and normalizes trailing slashes', () => {
    expect(
      getAllowedOrigins(
        '["https://store.example.com/","https://admin.example.com"]',
      ),
    ).toEqual(['https://store.example.com', 'https://admin.example.com']);
  });

  it('parses a comma-separated list with single-quoted entries', () => {
    expect(
      getAllowedOrigins(
        `["http://localhost:3000", 'https://store.example.com', "https://admin.example.com"]`,
      ),
    ).toEqual([
      'http://localhost:3000',
      'https://store.example.com',
      'https://admin.example.com',
    ]);
  });

  it('rejects invalid origins instead of silently allowing them', () => {
    expect(() => getAllowedOrigins('https://store.example.com/path')).toThrow(
      'Invalid origin in ALLOW_ORIGINS',
    );
  });
});
