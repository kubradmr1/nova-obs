/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_DATA_BACKEND?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AWS_REGION?: string;
  readonly VITE_ATTENDANCE_ROTATION_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
