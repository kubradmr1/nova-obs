import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/70 text-slate-600 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] transition-transform duration-500 group-hover:rotate-45" />
      ) : (
        <Moon className="h-[18px] w-[18px] transition-transform duration-500 group-hover:-rotate-12" />
      )}
    </button>
  );
}
