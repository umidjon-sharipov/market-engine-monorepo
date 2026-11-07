export type OAuthPlatform = 'client' | 'panel' | 'mobile';

type OAuthRedirectConfig = {
  environment: string;
  clientRedirectUrl: string;
  panelRedirectUrl: string;
  mobileRedirectUrl: string;
};

export function getOAuthRedirectBase(
  platform: OAuthPlatform,
  locale: string,
  config: OAuthRedirectConfig,
) {
  const isProduction = config.environment === 'production';
  if (platform === 'panel') {
    return (
      config.panelRedirectUrl ||
      `${isProduction ? 'https://panel-market-engine-monorepo.vercel.app' : 'http://localhost:3001'}/${locale}/auth`
    );
  }
  if (platform === 'mobile') {
    return config.mobileRedirectUrl || 'online-market://auth';
  }
  return (
    config.clientRedirectUrl ||
    `${isProduction ? 'https://market-engine-monorepo.vercel.app' : 'http://localhost:3000'}/auth`
  );
}
