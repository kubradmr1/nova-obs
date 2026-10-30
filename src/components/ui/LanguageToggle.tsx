import { Languages } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export function LanguageToggle() {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={`${t('common.switchLanguage')} (${locale === 'tr' ? 'EN' : 'TR'})`}
      title={t('common.switchLanguage')}
      className="group flex h-10 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/70 px-2.5 text-[10px] font-bold tracking-wide text-slate-600 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white"
    >
      <Languages className="h-4 w-4" aria-hidden />
      <span>{locale === 'tr' ? 'TR' : 'EN'}</span>
    </button>
  );
}
