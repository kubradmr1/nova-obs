import { GraduationCap, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { UNIVERSITY_NAME } from '@/config/branding';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { t } = useI18n();

  if (status === 'ready') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#eef1f9] px-6 text-center dark:bg-[#07060f]">
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-5 rounded-full bg-brand-500/20 blur-2xl"
        />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#7c5cff,#5f6bff)] text-white shadow-[0_22px_50px_-20px_rgba(124,92,255,0.9)]">
          <GraduationCap className="h-7 w-7" aria-hidden />
        </span>
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-[18px] font-semibold text-slate-800 dark:text-white">
          {t('brand.portal')}
        </p>
        <p className="text-[11.5px] text-slate-400 dark:text-slate-500">{UNIVERSITY_NAME}</p>
      </div>
      <p className="flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {t('common.sessionVerifying')}
      </p>
    </div>
  );
}
