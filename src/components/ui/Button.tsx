import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/utils/cx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingLabel?: string;
}

const BASE_CLASSES =
  'group relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'overflow-hidden bg-[linear-gradient(110deg,#7c5cff_0%,#5f6bff_48%,#a855f7_100%)] text-white shadow-[0_18px_40px_-18px_rgba(124,92,255,0.85)] hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-20px_rgba(124,92,255,0.95)] active:translate-y-0',
  secondary:
    'border border-slate-200/90 bg-white/70 text-slate-700 shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-white/25 dark:hover:text-white',
  ghost:
    'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
};

export function Button({
  variant = 'primary',
  isLoading = false,
  loadingLabel = 'Lütfen bekle',
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={cx(BASE_CLASSES, VARIANT_CLASSES[variant], className)}
      {...props}
    >
      {variant === 'primary' ? (
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] transition-transform duration-700 ease-out group-hover:translate-x-full"
        />
      ) : null}
      <span className="relative inline-flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {loadingLabel}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
