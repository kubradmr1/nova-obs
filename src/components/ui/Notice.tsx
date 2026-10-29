import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

type NoticeTone = 'success' | 'info' | 'warning' | 'danger';

const TONES: Record<
  NoticeTone,
  { icon: typeof Info; wrapper: string; iconClass: string; titleClass: string }
> = {
  success: {
    icon: CheckCircle2,
    wrapper:
      'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200',
    iconClass: 'text-emerald-500 dark:text-emerald-300',
    titleClass: 'text-emerald-800 dark:text-emerald-100',
  },
  info: {
    icon: Info,
    wrapper:
      'border-slate-200/80 bg-slate-50/80 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300',
    iconClass: 'text-brand-500 dark:text-brand-300',
    titleClass: 'text-slate-800 dark:text-white',
  },
  warning: {
    icon: AlertTriangle,
    wrapper:
      'border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200',
    iconClass: 'text-amber-500 dark:text-amber-300',
    titleClass: 'text-amber-800 dark:text-amber-100',
  },
  danger: {
    icon: AlertCircle,
    wrapper:
      'border-rose-200/80 bg-rose-50/80 text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300',
    iconClass: 'text-rose-500 dark:text-rose-300',
    titleClass: 'text-rose-700 dark:text-rose-200',
  },
};

interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  const palette = TONES[tone];
  const Icon = palette.icon;

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-[11.5px] leading-relaxed',
        palette.wrapper,
        className,
      )}
    >
      <Icon className={cx('mt-px h-4 w-4 shrink-0', palette.iconClass)} aria-hidden />
      <div className="min-w-0">
        {title ? <p className={cx('text-[12px] font-semibold', palette.titleClass)}>{title}</p> : null}
        <div className={title ? 'mt-0.5' : undefined}>{children}</div>
      </div>
    </div>
  );
}
