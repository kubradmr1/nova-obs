import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cx } from '@/utils/cx';

type StatTone = 'brand' | 'emerald' | 'amber' | 'sky' | 'rose';

const TONES: Record<StatTone, { tile: string; glow: string }> = {
  brand: {
    tile: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
    glow: 'bg-brand-400/25',
  },
  emerald: {
    tile: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    glow: 'bg-emerald-400/20',
  },
  amber: {
    tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    glow: 'bg-amber-400/20',
  },
  sky: {
    tile: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
    glow: 'bg-sky-400/20',
  },
  rose: {
    tile: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
    glow: 'bg-rose-400/20',
  },
};

interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
  hint?: string;
  icon: LucideIcon;
  tone?: StatTone;
}

export function StatCard({
  label,
  value,
  suffix,
  hint,
  icon: Icon,
  tone = 'brand',
}: StatCardProps) {
  const palette = TONES[tone];

  return (
    <Card className="group relative overflow-hidden p-4 transition-transform duration-300 hover:-translate-y-0.5">
      <div
        aria-hidden
        className={cx(
          'pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full opacity-70 blur-2xl',
          palette.glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <span
          className={cx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
            palette.tile,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="relative mt-2 flex items-baseline gap-1.5 font-display text-[25px] font-bold leading-none tracking-tight text-slate-900 dark:text-white">
        {value}
        {suffix ? (
          <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">
            {suffix}
          </span>
        ) : null}
      </p>
      {hint ? (
        <p className="relative mt-1.5 truncate text-[10px] text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      ) : null}
    </Card>
  );
}
