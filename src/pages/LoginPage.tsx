import { ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';
import { LoginCard } from '@/components/auth/LoginCard';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getHomePath } from '@/config/roles';
import { UNIVERSITY_NAME } from '@/config/branding';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { AuthLayout } from '@/layouts/AuthLayout';

export function LoginPage() {
  const { session, isSupabaseMode } = useAuth();
  const { t } = useI18n();

  if (session) {
    return <Navigate to={getHomePath(session.role)} replace />;
  }

  return (
    <AuthLayout>
      <div className="mx-auto grid min-h-screen w-full max-w-[1680px] lg:grid-cols-[1.06fr_1fr] xl:grid-cols-[1.1fr_1fr]">
        <AuthBrandPanel />

        <main className="relative flex min-h-screen flex-col px-5 py-4 sm:px-8 lg:px-10 xl:px-16">
          <div className="flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <span className="hidden items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500 backdrop-blur sm:inline-flex dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
                <span className="h-1 w-1 rounded-full bg-brand-500" />
                {isSupabaseMode ? t('login.badge.otp') : t('login.badge.demo')}
              </span>
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-6 sm:py-8">
            <LoginCard />
          </div>

          <footer className="flex flex-col items-center justify-between gap-1.5 pb-1 text-[10px] text-slate-400 sm:flex-row dark:text-slate-500">
            <p>© 2026 {UNIVERSITY_NAME} · OBS</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              {isSupabaseMode ? t('login.kvkk.otp') : t('login.kvkk.demo')}
            </p>
          </footer>
        </main>
      </div>
    </AuthLayout>
  );
}
