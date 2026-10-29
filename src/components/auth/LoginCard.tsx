import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { getRole } from '@/config/roles';
import type { Role } from '@/types/auth';
import { LoginForm } from './LoginForm';
import { RoleTabs } from './RoleTabs';

export function LoginCard() {
  const [role, setRole] = useState<Role>('student');
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
              Güvenli giriş
            </div>
            <h1 className="font-display text-[25px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-[27px] dark:text-white">
              Tekrar hoş geldin
            </h1>
            <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Akademik yolculuğuna kaldığın yerden devam et.
            </p>
          </header>

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
              {definition.description}
            </p>
          </div>

          <LoginForm key={role} role={role} />
        </div>

        <div className="mt-4 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
          <p className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
            <LockKeyhole className="h-3 w-3" aria-hidden />
            256-bit TLS şifreleme ile korunuyor
          </p>
        </div>
      </section>
    </div>
  );
}
