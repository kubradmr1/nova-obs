import { ArrowLeft, LogIn, ShieldOff } from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROLE_HOME, ROLE_LABEL_KEY } from '@/config/rbac';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import type { Role } from '@/types/auth';

const ROLES: Role[] = ['student', 'academic', 'admin'];

function isRole(value: string | null): value is Role {
  return value !== null && ROLES.includes(value as Role);
}

export function AccessDeniedPage() {
  const { session, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  const required = params.get('need');
  const attempted = params.get('from');
  const requiredRole = isRole(required) ? required : null;

  const switchAccount = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-brand-400/20 blur-[120px] dark:bg-brand-600/15" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-rose-400/15 blur-[120px] dark:bg-rose-500/10" />
        <div className="bg-grid-soft absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <section className="w-full max-w-[560px] animate-rise overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_40px_90px_-45px_rgba(30,20,80,0.5)] backdrop-blur-2xl sm:p-8 dark:border-white/[0.08] dark:bg-[#0d0c1c]/85 dark:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
            <ShieldOff className="h-6 w-6" aria-hidden />
          </span>

          <p className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-500 dark:text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {t('access.eyebrow')}
          </p>
          <h1 className="mt-2 font-display text-[27px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
            {t('access.title')}
          </h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            {t('access.description')}
          </p>

          <dl className="mt-5 grid gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3.5 text-[11px] dark:border-white/[0.07] dark:bg-white/[0.03] sm:grid-cols-2">
            <div>
              <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                {t('access.currentRole')}
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                {t(ROLE_LABEL_KEY[session.role])}
              </dd>
            </div>
            <div>
              <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                {t('access.required')}
              </dt>
              <dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                {requiredRole ? t(ROLE_LABEL_KEY[requiredRole]) : '—'}
              </dd>
            </div>
            {attempted ? (
              <div className="sm:col-span-2">
                <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  {t('access.attempted')}
                </dt>
                <dd className="mt-0.5 truncate rounded-lg bg-white/70 px-2 py-1 font-mono text-[10.5px] text-slate-600 dark:bg-white/[0.05] dark:text-slate-300">
                  {attempted}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              to={ROLE_HOME[session.role]}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(110deg,#7c5cff,#5f6bff_55%,#a855f7)] px-4 py-3 text-[12px] font-semibold text-white shadow-[0_16px_34px_-18px_rgba(124,92,255,0.9)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t('access.home')}
            </Link>
            <button
              type="button"
              onClick={() => void switchAccount()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-[12px] font-semibold text-slate-600 shadow-sm backdrop-blur transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-brand-400/40 dark:hover:text-brand-300"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {t('access.switchAccount')}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
