export interface SupabaseEnvSource {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

export interface ResolvedSupabaseEnv {
  readonly url: string;
  readonly key: string;
  readonly isConfigured: boolean;
}

const PLACEHOLDER_PATTERN = /your-project-ref|your-anon|your-publishable/i;

export function isPlaceholderEnvValue(value: string): boolean {
  return PLACEHOLDER_PATTERN.test(value);
}

// İstemci paketine giren değerin gizli anahtar olmadığını doğrular.
export function isSecretKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) {
    return true;
  }

  if (!key.startsWith('eyJ')) {
    return false;
  }

  try {
    const payload = key.split('.')[1] ?? '';
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(atob(padded)) as { role?: string };

    return decoded.role === 'service_role';
  } catch {
    return false;
  }
}

function usableKey(value: string | undefined): string {
  const key = (value ?? '').trim();

  return key.length > 0 && !isPlaceholderEnvValue(key) && !isSecretKey(key) ? key : '';
}

// Yeni publishable anahtar birincil; legacy anon anahtar yalnızca geriye dönük uyumluluk içindir.
export function resolveSupabaseEnv(env: SupabaseEnvSource): ResolvedSupabaseEnv {
  const url = (env.VITE_SUPABASE_URL ?? '').trim();
  const key =
    usableKey(env.VITE_SUPABASE_PUBLISHABLE_KEY) || usableKey(env.VITE_SUPABASE_ANON_KEY);

  return {
    url,
    key,
    isConfigured: /^https?:\/\//i.test(url) && key.length > 0 && !isPlaceholderEnvValue(url),
  };
}
