import type { MessageKey } from '@/i18n/messages';

export class LocalizedError extends Error {
  readonly key: MessageKey;
  readonly params?: Record<string, string | number>;

  constructor(key: MessageKey, params?: Record<string, string | number>) {
    super(key);
    this.name = 'LocalizedError';
    this.key = key;
    this.params = params;
  }
}

const PATTERNS: Array<[RegExp, MessageKey]> = [
  [
    /token has expired or is invalid|invalid or has expired/i,
    'auth.error.tokenExpired',
  ],
  [/email rate limit exceeded/i, 'auth.error.rateLimit'],
  [/signups not allowed|signup is disabled/i, 'auth.error.signupDisabled'],
  [
    /email provider is not enabled|email logins are disabled/i,
    'auth.error.emailDisabled',
  ],
  [/invalid email|unable to validate email/i, 'auth.error.invalidEmail'],
  [/user not found/i, 'auth.error.userNotFound'],
  [/failed to fetch|networkerror|network error/i, 'auth.error.network'],
];

export function authErrorMessage(message: string | null | undefined): MessageKey {
  if (!message) {
    return 'auth.error.generic';
  }

  const match = PATTERNS.find(([pattern]) => pattern.test(message));

  return match ? match[1] : 'auth.error.generic';
}

export function resolveErrorMessage(
  error: unknown,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
  fallbackKey: MessageKey,
): string {
  if (error instanceof LocalizedError) {
    return t(error.key, error.params);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t(fallbackKey);
}
