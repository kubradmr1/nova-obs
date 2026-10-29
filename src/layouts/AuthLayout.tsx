import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[-12%] h-[420px] w-[420px] rounded-full bg-brand-400/20 blur-[120px] dark:bg-brand-600/20" />
        <div className="absolute right-[-12%] top-[18%] h-[380px] w-[380px] rounded-full bg-cyan-400/15 blur-[120px] dark:bg-cyan-500/10" />
        <div className="bg-grid-soft absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
