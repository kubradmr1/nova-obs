import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

const hasPlaceholderValue =
  /your-project-ref|your-anon/i.test(supabaseUrl) ||
  /your-project-ref|your-anon/i.test(supabaseAnonKey);

export const isSupabaseConfigured =
  /^https?:\/\//i.test(supabaseUrl) &&
  supabaseAnonKey.length > 0 &&
  !hasPlaceholderValue;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
      'Supabase yapılandırılmadı. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini ekleyin.',
    );
  }

  return supabase;
}
