import { BellRing, TrendingUp } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

const BARCODE_BARS = [10, 16, 8, 20, 12, 22, 9, 18, 13, 20, 11, 17];

export function BrandVisual() {
  const { t } = useI18n();

  return (
    <div
      aria-hidden
      className="relative h-[280px] w-full max-w-[500px] select-none xl:h-[318px]"
    >
      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.42),transparent_65%)] blur-2xl xl:h-64 xl:w-64" />

      <svg viewBox="0 0 520 320" className="absolute inset-0 h-full w-full" fill="none">
        <circle cx="260" cy="160" r="140" stroke="white" strokeOpacity="0.08" />
        <circle
          cx="260"
          cy="160"
          r="106"
          stroke="white"
          strokeOpacity="0.16"
          strokeDasharray="2 9"
        />
        <ellipse
          cx="260"
          cy="160"
          rx="222"
          ry="122"
          stroke="white"
          strokeOpacity="0.06"
          transform="rotate(-17 260 160)"
        />
        <circle cx="124" cy="88" r="3" fill="#c4b5fd" fillOpacity="0.85" />
        <circle cx="404" cy="116" r="2.5" fill="#67e8f9" fillOpacity="0.8" />
        <circle cx="376" cy="256" r="2" fill="#f0abfc" fillOpacity="0.7" />
      </svg>

      <div className="absolute left-1/2 top-1/2 z-20 w-[262px] -translate-x-1/2 -translate-y-1/2 sm:w-[288px]">
        <div className="animate-float-slow">
          <div className="relative overflow-hidden rounded-[24px] border border-white/[0.16] bg-[linear-gradient(155deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))] p-4 shadow-[0_32px_70px_-25px_rgba(3,2,16,0.9)] backdrop-blur-2xl sm:p-5">
            <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-brand-400/25 blur-2xl" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#c4b5fd,#7c5cff_55%,#4f46e5)] text-[12px] font-bold text-white shadow-lg">
                  EY
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                    Elif Yılmaz
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/50">
                    {t('brand.visual.class', { year: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="my-3.5 h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent" />

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.05] px-3 py-2">
                <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-white/40">
                  {t('brand.visual.gpa')}
                </p>
                <p className="mt-0.5 font-display text-[17px] font-semibold text-white">
                  3.72
                  <span className="ml-0.5 text-[9px] font-normal text-white/35">/4.00</span>
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.05] px-3 py-2">
                <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-white/40">
                  {t('brand.visual.credits')}
                </p>
                <p className="mt-0.5 font-display text-[17px] font-semibold text-white">
                  60
                  <span className="ml-0.5 text-[9px] font-normal text-white/35">/120</span>
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex items-end justify-between gap-3">
              <div className="flex items-end gap-[2.5px]">
                {BARCODE_BARS.map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-[2px] rounded-full bg-white/25"
                    style={{ height }}
                  />
                ))}
              </div>
              <p className="text-[8px] uppercase tracking-[0.2em] text-white/35">2024 · 001234</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-1 z-30 w-[124px] xl:top-2 xl:w-[136px]">
        <div
          className="animate-float-soft [--float-rotate:5deg]"
          style={{ animationDelay: '-3s' }}
        >
          <div className="rounded-2xl border border-white/[0.14] bg-[#120f2c]/85 p-3 shadow-[0_16px_36px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/40">
                {t('brand.visual.average')}
              </span>
              <TrendingUp className="h-3 w-3 text-emerald-300" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="font-display text-lg font-semibold leading-none text-white">3.72</p>
              <span className="text-[9px] font-medium text-emerald-300">+0.24</span>
            </div>
            <svg viewBox="0 0 88 24" className="mt-2 h-5 w-full" fill="none">
              <defs>
                <linearGradient id="obs-sparkline" x1="0" y1="0" x2="88" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" />
                  <stop offset="1" stopColor="#67e8f9" />
                </linearGradient>
              </defs>
              <path
                d="M2 20 16 15 30 17 44 9 58 12 72 5 86 7"
                stroke="url(#obs-sparkline)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-30 w-[148px] xl:w-[165px]">
        <div
          className="animate-float-soft [--float-rotate:-4deg]"
          style={{ animationDelay: '-6s' }}
        >
          <div className="rounded-2xl border border-white/[0.14] bg-[#120f2c]/85 p-3 shadow-[0_16px_36px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/40">
                {t('brand.visual.attendance')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-300">%96</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[96%] rounded-full bg-[linear-gradient(90deg,#34d399,#67e8f9)]" />
            </div>
            <p className="mt-2 text-[9px] text-white/45">
              {t('brand.visual.attendanceHint', { courses: 14, absences: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute left-0 top-8 z-30 xl:top-10">
        <div
          className="animate-float-soft [--float-rotate:2deg]"
          style={{ animationDelay: '-8s' }}
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.14] bg-[#120f2c]/85 px-2.5 py-2 shadow-[0_16px_36px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-fuchsia-500/15 text-fuchsia-300">
              <BellRing className="h-3 w-3" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_6px_rgba(244,114,182,0.9)]" />
            </span>
            <div>
              <p className="text-[7.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {t('brand.visual.announcement')}
              </p>
              <p className="text-[9px] font-medium text-white/75">
                {t('brand.visual.announcementText')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
