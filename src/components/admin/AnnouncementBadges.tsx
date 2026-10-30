import type { AnnouncementAudience, AnnouncementCategory } from '@/types/admin';
import { useI18n } from '@/hooks/useI18n';
import type { MessageKey } from '@/i18n/messages';
import { cx } from '@/utils/cx';

export const CATEGORY_KEYS: Record<AnnouncementCategory, MessageKey> = {
  Akademik: 'announcement.category.Akademik',
  Sınav: 'announcement.category.Sınav',
  Duyuru: 'announcement.category.Duyuru',
  Etkinlik: 'announcement.category.Etkinlik',
};

export const AUDIENCE_KEYS: Record<AnnouncementAudience, MessageKey> = {
  Tümü: 'announcement.audience.Tümü',
  Öğrenciler: 'announcement.audience.Öğrenciler',
  Akademisyenler: 'announcement.audience.Akademisyenler',
};

const CATEGORY_TONES: Record<AnnouncementCategory, string> = {
  Akademik:
    'border-brand-500/20 bg-brand-500/10 text-brand-600 dark:border-brand-400/20 dark:text-brand-300',
  Sınav:
    'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-400/20 dark:text-rose-300',
  Duyuru:
    'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:border-sky-400/20 dark:text-sky-300',
  Etkinlik:
    'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-400/20 dark:text-amber-300',
};

export function CategoryBadge({ category }: { category: AnnouncementCategory }) {
  const { t } = useI18n();

  return (
    <span
      className={cx(
        'inline-flex rounded-full border px-2 py-0.5 text-[8.5px] font-semibold',
        CATEGORY_TONES[category],
      )}
    >
      {t(CATEGORY_KEYS[category])}
    </span>
  );
}

export function AudienceBadge({ audience }: { audience: AnnouncementAudience }) {
  const { t } = useI18n();

  return (
    <span className="inline-flex rounded-full border border-slate-200/80 bg-slate-50/80 px-2 py-0.5 text-[8.5px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
      {t(AUDIENCE_KEYS[audience])}
    </span>
  );
}
