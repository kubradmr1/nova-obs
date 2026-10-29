import type { LetterGrade } from '@/types/student';
import { cx } from '@/utils/cx';

const TONES: Record<LetterGrade, string> = {
  AA: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  BA: 'border-teal-500/25 bg-teal-500/10 text-teal-600 dark:text-teal-300',
  BB: 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  CB: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  CC: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  DC: 'border-orange-500/25 bg-orange-500/10 text-orange-600 dark:text-orange-300',
  DD: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  FD: 'border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300',
  FF: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300',
};

const SIZES = {
  sm: 'min-w-[30px] px-1.5 py-0.5 text-[9.5px]',
  md: 'min-w-[36px] px-2 py-1 text-[10.5px]',
  lg: 'min-w-[46px] px-2.5 py-1.5 text-[13px]',
} as const;

interface LetterBadgeProps {
  letter: LetterGrade;
  size?: keyof typeof SIZES;
  className?: string;
}

export function LetterBadge({ letter, size = 'md', className }: LetterBadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center justify-center rounded-lg border font-bold tracking-[0.04em]',
        TONES[letter],
        SIZES[size],
        className,
      )}
    >
      {letter}
    </span>
  );
}
