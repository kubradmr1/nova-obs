import { LockKeyhole, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { getRole } from '@/config/roles';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import type { MessageKey } from '@/i18n/messages';
import type { Role } from '@/types/auth';
import { LoginForm } from './LoginForm';
import { OtpLoginForm } from './OtpLoginForm';
import { RoleTabs } from './RoleTabs';

const DESCRIPTION_KEYS: Record<Role, MessageKey> = {
  student: 'role.student.description',
  academic: 'role.academic.description',
  admin: 'role.admin.description',
};

export function LoginCard() {
  const { isSupabaseMode, isDemoMode } = useAuth();
  const { t } = useI18n();
  const [role, setRole] = useState<Role>('student');
  const isAuthAvailable = isSupabaseMode || isDemoMode;
  const definition = getRole(role);
  const RoleIcon = definition.icon;

  return (
    <div className="relative w-full max-w-[460px] animate-rise-slow">
      <div
        aria-hidden
        className="absolute -inset-3 rounded-[36px] bg-[linear-gradient(135deg,rgba(124,92,255,0.16),transparent_45%,rgba(56,189,248,0.12))] blur-2xl"
      />

      <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_40px_90px_-40px_rgba(30,20,80,0.45)] backdrop-blur-2xl sm:p-6 dark:border-white/[0.08] dark:bg-[#0d0c1c]/85 dark:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent"
        />

        <div className="space-y-4">
          <header className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(124,92,255,0.8)]" />
              {t('login.eyebrow')}
            </div>
            <h1 className="font-display text-[25px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[27px] dark:text-white">
              {t('login.title')}
            </h1>
            <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              {isSupabaseMode
                ? t('login.subtitle.otp')
                : isDemoMode
                  ? t('login.subtitle.demo')
                  : t('login.subtitle.disabled')}
            </p>
          </header>

          {isAuthAvailable ? (
            <div className="space-y-2.5">
              <RoleTabs activeRole={role} onChange={setRole} />
              <p
                key={role}
                className="flex animate-rise items-start gap-2 px-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"
              >
                <RoleIcon
                  className="mt-[3px] h-3.5 w-3.5 shrink-0 text-brand-500 dark:text-brand-300"
                  aria-hidden
                />
                {t(DESCRIPTION_KEYS[role])}
              </p>
            </div>
          ) : null}

          {isSupabaseMode ? (
            <OtpLoginForm key={role} role={role} />
          ) : isDemoMode ? (
            <LoginForm key={role} role={role} />
          ) : (
            <div
              role="alert"
              className="space-y-1.5 rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-3.5 text-[12px] leading-relaxed text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"
            >
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
                {t('login.disabled.title')}
              </p>
              <p>{t('login.disabled.body')}</p>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
            {isSupabaseMode ? (
              <>
                <ShieldCheck className="h-3 w-3" aria-hidden />
                {t('login.footer.otp')}
              </>
            ) : isDemoMode ? (
              <>
                <LockKeyhole className="h-3 w-3" aria-hidden />
                {t('login.footer.demo')}
              </>
            ) : (
              <>
                <ShieldAlert className="h-3 w-3" aria-hidden />
                {t('login.footer.disabled')}
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
