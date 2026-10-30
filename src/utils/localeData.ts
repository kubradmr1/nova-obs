import type { Locale } from '@/context/i18n-context';

const TERM_WORDS: Record<string, string> = {
  Güz: 'Fall',
  Bahar: 'Spring',
  Yaz: 'Summer',
};

/** Demo verisindeki Türkçe dönem adlarını seçili dile çevirir. */
export function localizeTerm(value: string, locale: Locale): string {
  if (locale === 'tr') {
    return value;
  }

  const match = value.match(/^(.*?)\s+(Güz|Bahar|Yaz)$/);

  if (!match) {
    return value;
  }

  return `${TERM_WORDS[match[2]]} ${match[1]}`;
}

/** "2. Sınıf" biçimindeki sınıf bilgisini seçili dile çevirir. */
export function localizeClassYear(value: string, locale: Locale): string {
  if (locale === 'tr') {
    return value;
  }

  const match = value.match(/\d+/);

  return match ? `Year ${match[0]}` : value;
}
