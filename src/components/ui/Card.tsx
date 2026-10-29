import type { HTMLAttributes } from 'react';
import { cx } from '@/utils/cx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-[26px] border border-slate-200/70 bg-white/80 shadow-[0_26px_60px_-45px_rgba(30,20,80,0.5)] backdrop-blur-xl',
        'dark:border-white/[0.07] dark:bg-[#0d0c1c]/75 dark:shadow-[0_26px_60px_-30px_rgba(0,0,0,0.85)]',
        className,
      )}
      {...props}
    />
  );
}
