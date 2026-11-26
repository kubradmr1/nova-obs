import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseEnv } from '@/lib/supabaseEnv';

const supabaseEnv = resolveSupabaseEnv(import.meta.env);

export const isSupabaseConfigured = supabaseEnv.isConfigured;

const demoFlag = (import.meta.env.VITE_ALLOW_DEMO ?? '').trim().toLowerCase();

// Demo girişi yalnızca açıkça istenirse, geliştirme derlemesinde ve
// Supabase yapılandırılmamışken çalışır. Üretim derlemesinde her zaman kapalıdır.
export const isDemoAuthEnabled =
  !import.meta.env.PROD && demoFlag === 'true' && !isSupabaseConfigured;

export const isAuthConfigured = isSupabaseConfigured || isDemoAuthEnabled;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseEnv.url, supabaseEnv.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(
      'Supabase yapılandırılmadı. VITE_SUPABASE_URL ve VITE_SUPABASE_PUBLISHABLE_KEY (eski kurulumlarda VITE_SUPABASE_ANON_KEY) değerlerini ekleyin. Yalnızca public/publishable anahtar kullanılmalıdır.',
    );
  }

  return supabase;
}
