import { useContext } from 'react';
import { I18nContext } from '@/context/i18n-context';

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n, I18nProvider içinde kullanılmalıdır.');
  }

  return context;
}
