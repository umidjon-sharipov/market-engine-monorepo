export const OAUTH_PROVIDERS = [
  'google',
  'github',
  'facebook',
  'linkedin',
  'microsoft',
  'notion',
  'apple',
  'atlassian',
  'telegram',
] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export type OAuthProfile = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}
