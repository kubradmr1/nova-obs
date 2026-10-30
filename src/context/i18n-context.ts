import { createContext } from 'react';
import type { MessageKey } from '@/i18n/messages';

export type Locale = 'tr' | 'en';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  formatDate: (
    value: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  formatTime: (value: Date | string | number) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export const LOCALE_STORAGE_KEY = 'obs.locale';
