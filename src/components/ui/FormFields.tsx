import { AlertCircle, ChevronDown } from 'lucide-react';
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { useI18n } from '@/hooks/useI18n';
import { cx } from '@/utils/cx';

const CONTROL_CLASSES =
  'w-full rounded-2xl border border-slate-200/90 bg-white/80 text-[12.5px] font-medium text-slate-900 shadow-sm transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400/70';

const ERROR_CLASSES =
  'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10 dark:border-rose-400/40';

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ label, htmlFor, error, hint, children, className }: FieldShellProps) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;

  return (
    <div className={cx('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-[10.5px] font-medium text-rose-500 dark:text-rose-400"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[10px] text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

export function InputField({
  label,
  error,
  hint,
  fieldClassName,
  className,
  ...inputProps
}: InputFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <FieldShell
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cx(CONTROL_CLASSES, 'h-11 px-3.5', error && ERROR_CLASSES, className)}
        {...inputProps}
      />
    </FieldShell>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
  label: string;
  options: readonly (string | SelectOption)[];
  placeholder?: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

export function SelectField({
  label,
  options,
  placeholder,
  error,
  hint,
  fieldClassName,
  className,
  value,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder ?? t('common.select');
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <FieldShell
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <div className="relative">
        <select
          id={id}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cx(
            CONTROL_CLASSES,
            'h-11 appearance-none pl-3.5 pr-9',
            error && ERROR_CLASSES,
            !value && 'text-slate-400 dark:text-slate-500',
            className,
          )}
          {...selectProps}
        >
          <option value="" disabled>
            {resolvedPlaceholder}
          </option>
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const label = typeof option === 'string' ? option : option.label;

            return (
              <option key={value} value={value} className="text-slate-900 dark:text-white">
                {label}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          aria-hidden
        />
      </div>
    </FieldShell>
  );
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

export function TextAreaField({
  label,
  error,
  hint,
  fieldClassName,
  className,
  rows = 4,
  ...textareaProps
}: TextAreaFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <FieldShell
      label={label}
      htmlFor={id}
      error={error}
      hint={hint}
      className={fieldClassName}
    >
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cx(
          CONTROL_CLASSES,
          'resize-none px-3.5 py-3 leading-relaxed',
          error && ERROR_CLASSES,
          className,
        )}
        {...textareaProps}
      />
    </FieldShell>
  );
}
