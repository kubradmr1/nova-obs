import { CalendarDays, Megaphone, Pin } from 'lucide-react';
import { useMemo } from 'react';
import { AudienceBadge, CategoryBadge } from '@/components/admin/AnnouncementBadges';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ANNOUNCEMENTS_STORAGE_KEY, SEED_ANNOUNCEMENTS } from '@/data/admin';
import { UNIVERSITY_NAME } from '@/config/branding';
import { useI18n } from '@/hooks/useI18n';
import { readCollection } from '@/utils/storage';

export function StudentAnnouncementsPage() {
  const { t, formatDate } = useI18n();
  const announcements = useMemo(
    () =>
      readCollection(ANNOUNCEMENTS_STORAGE_KEY, SEED_ANNOUNCEMENTS)
        .filter((announcement) => announcement.audience !== 'Akademisyenler')
        .sort(
          (a, b) =>
            Number(b.pinned) - Number(a.pinned) ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [],
  );

  const pinnedCount = announcements.filter((announcement) => announcement.pinned).length;

  return (
    <div className="animate-rise space-y-4">
      <PageHeader
        eyebrow={t('nav.groups.general')}
        title={t('nav.student.announcements')}
        description={t('se.announcements.description', { university: UNIVERSITY_NAME })}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-semibold text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
            <Megaphone className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
            {t('se.announcements.count', { count: announcements.length })}
            {pinnedCount > 0
              ? ` · ${t('se.announcements.pinnedCount', { count: pinnedCount })}`
              : ''}
          </span>
        }
      />

      {announcements.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
            {t('se.announcements.emptyTitle')}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {t('se.announcements.emptyText')}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={
                announcement.pinned
                  ? 'border-amber-300/70 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(255,255,255,0.75))] p-4 dark:border-amber-400/20 dark:bg-amber-500/[0.06] sm:p-5'
                  : 'p-4 dark:bg-[#0d0c1c]/75 sm:p-5'
              }
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <CategoryBadge category={announcement.category} />
                <AudienceBadge audience={announcement.audience} />
                {announcement.pinned ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/15 px-2 py-0.5 text-[8.5px] font-bold text-amber-700 dark:text-amber-300">
                    <Pin className="h-2.5 w-2.5" aria-hidden />
                    {t('se.announcements.pinned')}
                  </span>
                ) : null}
                <span className="ml-auto text-[9px] font-medium text-slate-400 dark:text-slate-500">
                  {formatDate(announcement.createdAt, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h2 className="mt-2.5 font-display text-[15px] font-semibold leading-snug text-slate-900 dark:text-white">
                {announcement.title}
              </h2>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                {announcement.body}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-2.5 text-[9.5px] text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-3 w-3" aria-hidden />
                  {announcement.author}
                </span>
                <span>·</span>
                <span>{t('se.announcements.source')}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
