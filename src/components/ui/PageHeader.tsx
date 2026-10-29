import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-[24px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
