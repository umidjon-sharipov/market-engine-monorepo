import { getOAuthRedirectBase } from './oauth.redirect';

describe('getOAuthRedirectBase', () => {
  const defaults = {
    clientRedirectUrl: '',
    panelRedirectUrl: '',
    mobileRedirectUrl: '',
  };

  it('uses platform-specific production URLs and preserves panel locale', () => {
    const config = { ...defaults, environment: 'production' };

    expect(getOAuthRedirectBase('client', 'en', config)).toBe(
      'https://market-engine-monorepo.vercel.app/auth',
    );
    expect(getOAuthRedirectBase('panel', 'ru', config)).toBe(
      'https://panel-market-engine-monorepo.vercel.app/ru/auth',
    );
  });

  it('keeps localhost redirects in development', () => {
    const config = { ...defaults, environment: 'development' };

    expect(getOAuthRedirectBase('client', 'uz', config)).toBe(
      'http://localhost:3000/auth',
    );
    expect(getOAuthRedirectBase('panel', 'uz', config)).toBe(
      'http://localhost:3001/uz/auth',
    );
  });

  it('prefers explicitly configured frontend redirects', () => {
    const config = {
      environment: 'production',
      clientRedirectUrl: 'https://client.example.com/auth',
      panelRedirectUrl: 'https://panel.example.com/uz/auth',
      mobileRedirectUrl: '',
    };

    expect(getOAuthRedirectBase('client', 'uz', config)).toBe(
      'https://client.example.com/auth',
    );
    expect(getOAuthRedirectBase('panel', 'uz', config)).toBe(
      'https://panel.example.com/uz/auth',
    );
  });
});
