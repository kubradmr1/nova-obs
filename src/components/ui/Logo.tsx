import { UNIVERSITY_SHORT } from '@/config/branding';
import { cx } from '@/utils/cx';

interface LogoProps {
  tone?: 'auto' | 'light';
}

export function Logo({ tone = 'auto' }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/nova-mark.svg"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-[14px] shadow-[0_12px_30px_-12px_rgba(124,92,255,0.9)]"
        aria-hidden
      />
      <div className="min-w-0 leading-none">
        <p
          className={cx(
            'font-display text-[17px] font-bold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-slate-900 dark:text-white',
          )}
        >
          {UNIVERSITY_SHORT}
        </p>
        <p
          className={cx(
            'mt-1.5 text-[8.5px] font-semibold uppercase tracking-[0.18em]',
            tone === 'light' ? 'text-white/45' : 'text-slate-500 dark:text-slate-400',
          )}
        >
          Üniversitesi · OBS
        </p>
      </div>
    </div>
  );
}
