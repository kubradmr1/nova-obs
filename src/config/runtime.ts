export type DataBackend = 'local' | 'supabase' | 'aws';

const BACKENDS: readonly DataBackend[] = ['local', 'supabase', 'aws'];

function parseBackend(value: string | undefined, fallback: DataBackend): DataBackend {
  const normalized = (value ?? '').trim().toLowerCase();

  return BACKENDS.find((backend) => backend === normalized) ?? fallback;
}

function clampNumber(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export interface RuntimeConfig {
  backend: DataBackend;
  apiBaseUrl: string;
  awsRegion: string;
  attendance: {
    rotationSeconds: number;
    defaultDurationMinutes: number;
    minDurationMinutes: number;
    maxDurationMinutes: number;
    codeLength: number;
  };
}

const env = import.meta.env;
const hasSupabaseEnv =
  Boolean((env.VITE_SUPABASE_URL ?? '').trim()) &&
  Boolean((env.VITE_SUPABASE_ANON_KEY ?? '').trim());

export const runtimeConfig: RuntimeConfig = {
  backend: parseBackend(env.VITE_DATA_BACKEND, hasSupabaseEnv ? 'supabase' : 'local'),
  apiBaseUrl: (env.VITE_API_BASE_URL ?? '').trim(),
  awsRegion: (env.VITE_AWS_REGION ?? '').trim(),
  attendance: {
    rotationSeconds: clampNumber(env.VITE_ATTENDANCE_ROTATION_SECONDS, 20, 10, 120),
    defaultDurationMinutes: 15,
    minDurationMinutes: 5,
    maxDurationMinutes: 120,
    codeLength: 6,
  },
};

export const isAwsBackend = runtimeConfig.backend === 'aws';
