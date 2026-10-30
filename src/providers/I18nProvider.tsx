import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  I18nContext,
  LOCALE_STORAGE_KEY,
  type I18nContextValue,
  type Locale,
} from '@/context/i18n-context';
import { dictionaries, tr, type MessageKey } from '@/i18n/messages';

function readStoredLocale(): Locale {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'tr';
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

const INTL_LOCALES: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'tr' ? 'en' : 'tr');
  }, [locale, setLocale]);

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: MessageKey, params?: Record<string, string | number>) => {
      const localized = dictionaries[locale][key] ?? tr[key] ?? key;
      return interpolate(localized, params);
    };

    const intlLocale = INTL_LOCALES[locale];

    return {
      locale,
      setLocale,
      toggleLocale,
      t,
      formatDate: (input, options) =>
        new Intl.DateTimeFormat(intlLocale, options).format(new Date(input)),
      formatTime: (input) =>
        new Intl.DateTimeFormat(intlLocale, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(input)),
    };
  }, [locale, setLocale, toggleLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
