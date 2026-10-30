import { Check, Megaphone, Pin, RotateCcw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  AUDIENCE_KEYS,
  AudienceBadge,
  CATEGORY_KEYS,
  CategoryBadge,
} from '@/components/admin/AnnouncementBadges';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField, SelectField, TextAreaField } from '@/components/ui/FormFields';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENTS_STORAGE_KEY,
  SEED_ANNOUNCEMENTS,
} from '@/data/admin';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useStoredList } from '@/hooks/useStoredList';
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementCategory,
} from '@/types/admin';
import { cx } from '@/utils/cx';

interface AnnouncementFormState {
  title: string;
  category: string;
  audience: string;
  body: string;
  pinned: boolean;
}

type AnnouncementFormErrors = Partial<Record<keyof AnnouncementFormState, string>>;

function createEmptyForm(): AnnouncementFormState {
  return {
    title: '',
    category: 'Duyuru',
    audience: 'Tümü',
    body: '',
    pinned: false,
  };
}

export function AnnouncementsPage() {
  const { session } = useAuth();
  const { t, formatDate } = useI18n();
  const { items, add } = useStoredList<Announcement>(
    ANNOUNCEMENTS_STORAGE_KEY,
    SEED_ANNOUNCEMENTS,
  );
  const [values, setValues] = useState<AnnouncementFormState>(createEmptyForm);
  const [errors, setErrors] = useState<AnnouncementFormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  const update = <K extends keyof AnnouncementFormState>(
    field: K,
    value: AnnouncementFormState[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  };

  const validate = (): AnnouncementFormErrors => {
    const next: AnnouncementFormErrors = {};

    if (values.title.trim().length < 5) {
      next.title = t('ad.validation.titleMin');
    }

    if (!values.category) {
      next.category = t('ad.validation.categoryRequired');
    }

    if (!values.audience) {
      next.audience = t('ad.validation.audienceRequired');
    }

    if (values.body.trim().length < 20) {
      next.body = t('ad.validation.bodyMin');
    }

    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice(null);
      return;
    }

    add({
      id: `announcement-${Date.now().toString(36)}`,
      title: values.title.trim(),
      body: values.body.trim(),
      category: values.category as AnnouncementCategory,
      audience: values.audience as AnnouncementAudience,
      pinned: values.pinned,
      createdAt: new Date().toISOString(),
      author: session?.name ?? t('ad.systemAdmin'),
    });

    setNotice(t('ad.announcements.published', { title: values.title.trim() }));
    setValues(createEmptyForm());
    setErrors({});
  };

  const handleReset = () => {
    setValues(createEmptyForm());
    setErrors({});
    setNotice(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t('panel.portal.admin')}
        title={t('nav.admin.announcements')}
        description={t('ad.announcements.description')}
      />

      {notice ? (
        <Notice tone="success" title={t('ad.announcements.noticeTitle')}>
          {notice}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1.25fr]">
        <Card className="p-4">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <Megaphone className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                {t('ad.announcements.formTitle')}
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                {t('ad.announcements.formHint')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
            <InputField
              label={t('ad.field.announcementTitle')}
              placeholder={t('ad.ph.announcementTitle')}
              maxLength={120}
              value={values.title}
              error={errors.title}
              onChange={(event) => update('title', event.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                label={t('ad.field.category')}
                options={ANNOUNCEMENT_CATEGORIES.map((category) => ({
                  value: category,
                  label: t(CATEGORY_KEYS[category]),
                }))}
                value={values.category}
                error={errors.category}
                onChange={(event) => update('category', event.target.value)}
              />
              <SelectField
                label={t('ad.field.audience')}
                options={ANNOUNCEMENT_AUDIENCES.map((audience) => ({
                  value: audience,
                  label: t(AUDIENCE_KEYS[audience]),
                }))}
                value={values.audience}
                error={errors.audience}
                onChange={(event) => update('audience', event.target.value)}
              />
            </div>

            <TextAreaField
              label={t('ad.field.body')}
              rows={7}
              maxLength={1000}
              placeholder={t('ad.ph.announcementBody')}
              value={values.body}
              error={errors.body}
              hint={t('ad.announcements.charCount', { count: values.body.length })}
              onChange={(event) => update('body', event.target.value)}
            />

            <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-white/60 p-3 transition-colors hover:border-brand-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-400/30">
              <input
                type="checkbox"
                checked={values.pinned}
                onChange={(event) => update('pinned', event.target.checked)}
                className="peer sr-only"
              />
              <span
                className={cx(
                  'mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/15',
                  values.pinned
                    ? 'border-transparent bg-[linear-gradient(135deg,#7c5cff,#5f6bff)] text-white'
                    : 'border-slate-300 bg-white dark:border-white/15 dark:bg-white/5',
                )}
              >
                {values.pinned ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
              </span>
              <span>
                <span className="block text-[10.5px] font-semibold text-slate-700 dark:text-slate-200">
                  {t('ad.announcements.pin')}
                </span>
                <span className="mt-0.5 block text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
                  {t('ad.announcements.pinHint')}
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-2 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
              <Button type="submit" className="px-4 py-2.5 text-[12px]">
                <Megaphone className="h-4 w-4" aria-hidden />
                {t('ad.announcements.submit')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                className="px-4 py-2.5 text-[12px]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                {t('ad.form.clear')}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-4">
            <div>
              <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                {t('ad.announcements.listTitle')}
              </h2>
              <p className="mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                {t('ad.announcements.listHint')}
              </p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300">
              {t('ad.announcements.count', { count: items.length })}
            </span>
          </div>

          <ul className="max-h-[620px] divide-y divide-slate-200/60 overflow-y-auto border-t border-slate-200/70 dark:divide-white/[0.06] dark:border-white/[0.07]">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-[10px] text-slate-400 dark:text-slate-500">
                {t('ad.announcements.empty')}
              </li>
            ) : (
              items.map((announcement) => (
                <li key={announcement.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryBadge category={announcement.category} />
                    <AudienceBadge audience={announcement.audience} />
                    {announcement.pinned ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[8.5px] font-semibold text-amber-600 dark:text-amber-300">
                        <Pin className="h-2.5 w-2.5" aria-hidden />
                        {t('ad.announcements.pinnedBadge')}
                      </span>
                    ) : null}
                    <span className="ml-auto text-[8px] text-slate-400 dark:text-slate-500">
                      {formatDate(announcement.createdAt, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                    {announcement.title}
                  </p>
                  <p className="mt-1 line-clamp-3 text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500">
                    {announcement.body}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[8.5px] text-slate-400 dark:text-slate-500">
                    <span>{announcement.author}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-300">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden />
                      {t('ad.status.published')}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
