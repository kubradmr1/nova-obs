import { AlertCircle, type LucideIcon } from 'lucide-react';
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@/utils/cx';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  icon: LucideIcon;
  error?: string;
  trailing?: ReactNode;
}

export function TextField({
  label,
  icon: Icon,
  error,
  trailing,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      <div
        className={cx(
          'group relative flex items-center rounded-2xl border border-slate-200/90 bg-white/80 transition-all duration-200',
          'focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10',
          'dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-brand-400/70 dark:focus-within:ring-brand-500/15',
          error &&
            'border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-500/10 dark:border-rose-400/40',
        )}
      >
        <Icon
          className={cx(
            'pointer-events-none absolute left-4 h-[18px] w-[18px] transition-colors',
            error
              ? 'text-rose-400'
              : 'text-slate-400 group-focus-within:text-brand-500 dark:text-slate-500 dark:group-focus-within:text-brand-300',
          )}
          aria-hidden
        />
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cx(
            'h-12 w-full rounded-2xl bg-transparent pl-11 pr-12 text-sm font-medium text-slate-900 placeholder:font-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500',
            className,
          )}
          {...inputProps}
        />
        {trailing ? <div className="absolute right-1.5 flex items-center">{trailing}</div> : null}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 pt-0.5 text-[11px] font-medium text-rose-500 dark:text-rose-400"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
