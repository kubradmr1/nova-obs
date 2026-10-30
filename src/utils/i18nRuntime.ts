import { LOCALE_STORAGE_KEY } from '@/context/i18n-context';
import { dictionaries, tr, type MessageKey } from '@/i18n/messages';

// React ağacı dışındaki yardımcılar (provider/servis) için saklı dil tercihini okur.
export function translateStored(key: MessageKey): string {
  const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY) === 'en' ? 'en' : 'tr';

  return dictionaries[locale][key] ?? tr[key] ?? key;
}
