import {
  BadgeCheck,
  CalendarDays,
  CloudCog,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { UNIVERSITY_NAME } from '@/config/branding';
import { cx } from '@/utils/cx';
import { BrandVisual } from './BrandVisual';

const HIGHLIGHTS = [
  { icon: BadgeCheck, label: 'Anlık not takibi' },
  { icon: CalendarDays, label: 'Ders programı ve devam' },
  { icon: MessageSquareText, label: 'Danışman iletişimi' },
  { icon: CloudCog, label: 'Bulut laboratuvarı' },
];

const AVATARS = [
  { initials: 'EY', gradient: 'from-violet-400 to-indigo-500' },
  { initials: 'MA', gradient: 'from-cyan-400 to-blue-500' },
  { initials: 'ZK', gradient: 'from-fuchsia-400 to-rose-500' },
];

export function AuthBrandPanel() {
  return (
    <section
      aria-label="OBS tanıtımı"
      className="relative hidden overflow-hidden bg-[#0a0820] px-10 py-8 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col xl:px-14 xl:py-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_120%_at_10%_0%,#2d1b72_0%,#17103f_42%,#0a0820_78%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full bg-brand-600/30 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-[360px] w-[360px] rounded-full bg-cyan-500/15 blur-[110px]"
      />
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-soft-light"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent"
      />

      <header className="relative z-10 flex animate-rise items-center justify-between gap-4">
        <Logo tone="light" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-white/60 backdrop-blur">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          2026–2027 Güz
        </span>
      </header>

      <div
        className="relative z-10 mt-7 max-w-[520px] animate-rise"
        style={{ animationDelay: '80ms' }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-medium text-white/70 backdrop-blur">
          <Sparkles className="h-3 w-3 text-brand-300" aria-hidden />
          Yeni nesil kampüs deneyimi
        </span>
        <h2 className="mt-4 font-display text-[1.9rem] font-semibold leading-[1.14] tracking-tight xl:text-[2.35rem]">
          Akademik hayatın
          <br />
          <span className="bg-[linear-gradient(100deg,#c4b5fd,#8b7bff_45%,#67e8f9)] bg-clip-text text-transparent">
            tek bir akıllı panelde.
          </span>
        </h2>
        <p className="mt-3 max-w-[420px] text-[13px] leading-relaxed text-white/55">
          {UNIVERSITY_NAME}’nde notlar, bulut laboratuvarı, devam durumu ve danışman
          iletişimi — hepsi sade, hızlı ve güvenli bir arayüzde.
        </p>
      </div>

      <div
        className="relative z-10 flex flex-1 animate-rise items-center py-2"
        style={{ animationDelay: '160ms' }}
      >
        <BrandVisual />
      </div>

      <div className="relative z-10 animate-rise" style={{ animationDelay: '240ms' }}>
        <ul className="flex flex-wrap gap-x-5 gap-y-2.5">
          {HIGHLIGHTS.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <li key={highlight.label} className="flex items-center gap-1.5 text-[10px] text-white/55">
                <Icon className="h-3.5 w-3.5 text-brand-300" aria-hidden />
                {highlight.label}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-4 [@media(max-height:820px)]:hidden">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {AVATARS.map((avatar) => (
                <span
                  key={avatar.initials}
                  className={cx(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0d0a26] bg-gradient-to-br text-[8px] font-bold text-white',
                    avatar.gradient,
                  )}
                >
                  {avatar.initials}
                </span>
              ))}
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-[#0d0a26] bg-white/10 px-1.5 text-[8px] font-semibold text-white/70">
                +12B
              </span>
            </div>
            <p className="text-[10px] leading-snug text-white/45">
              <span className="font-semibold text-white/80">12.400+ öğrenci</span>
              <br />
              OBS’i aktif kullanıyor
            </p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[9px] font-medium text-white/55 xl:flex">
            <CloudCog className="h-3 w-3" aria-hidden />
            Bulut Bilişim Operatörlüğü
          </div>
        </div>
      </div>
    </section>
  );
}
