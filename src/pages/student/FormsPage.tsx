import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  CloudCog,
  Download,
  FileBadge,
  FileSignature,
  FileText,
  ScrollText,
  Send,
  ShieldCheck,
  Stamp,
  type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SelectField, TextAreaField } from '@/components/ui/FormFields';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  FORM_REQUESTS_STORAGE_KEY,
  SEED_FORM_REQUESTS,
  STUDENT_FORM_TYPES,
} from '@/data/student-services';
import { useI18n } from '@/hooks/useI18n';
import { useStoredList } from '@/hooks/useStoredList';
import type { MessageKey } from '@/i18n/messages';
import type { FormRequestStatus, StudentFormRequest } from '@/types/student';
import { cx } from '@/utils/cx';
import { openStudentCertificate, openTranscriptDocument } from '@/utils/documentExport';

const FORM_ICONS: Record<string, LucideIcon> = {
  'ogrenci-belgesi': FileBadge,
  transkript: ScrollText,
  'staj-basvuru': FileSignature,
  'bulut-lab-erisim': CloudCog,
  'ders-muafiyet': Stamp,
};

const STATUS_STYLES: Record<FormRequestStatus, string> = {
  Hazırlanıyor:
    'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:text-amber-300',
  'Onay bekliyor':
    'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:text-sky-300',
  Tamamlandı:
    'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-300',
};

const STATUS_KEYS: Record<FormRequestStatus, MessageKey> = {
  Hazırlanıyor: 'se.forms.status.preparing',
  'Onay bekliyor': 'se.forms.status.pending',
  Tamamlandı: 'se.forms.status.completed',
};

interface FormErrors {
  typeId?: string;
  note?: string;
}

export function StudentFormsPage() {
  const { t, formatDate } = useI18n();
  const { items, add } = useStoredList<StudentFormRequest>(
    FORM_REQUESTS_STORAGE_KEY,
    SEED_FORM_REQUESTS,
  );
  const [typeId, setTypeId] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<{
    tone: 'success' | 'warning';
    message: string;
  } | null>(null);

  const selectedType = STUDENT_FORM_TYPES.find((type) => type.label === typeId);

  const handleQuickDownload = (kind: 'certificate' | 'transcript') => {
    const opened =
      kind === 'certificate' ? openStudentCertificate() : openTranscriptDocument();

    if (!opened) {
      setDownloadFeedback({
        tone: 'warning',
        message: t('se.forms.download.blocked'),
      });
      return;
    }

    setDownloadFeedback({
      tone: 'success',
      message:
        kind === 'certificate'
          ? t('se.forms.download.certificate')
          : t('se.forms.download.transcript'),
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!selectedType) {
      nextErrors.typeId = t('se.forms.errors.type');
    }

    if (note.trim().length < 10) {
      nextErrors.note = t('se.forms.errors.note');
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !selectedType) {
      setNotice(null);
      return;
    }

    add({
      id: `form-${Date.now().toString(36)}`,
      typeId: selectedType.id,
      typeLabel: selectedType.label,
      note: note.trim(),
      createdAt: new Date().toISOString(),
      status: 'Hazırlanıyor',
    });

    setNotice(
      t('se.forms.notice', {
        type: selectedType.label,
        time: selectedType.processingTime,
      }),
    );
    setTypeId('');
    setNote('');
    setErrors({});
  };

  return (
    <div className="animate-rise space-y-4">
      <PageHeader
        eyebrow={t('nav.groups.forms')}
        title={t('nav.student.forms')}
        description={t('se.forms.description')}
      />

      {downloadFeedback ? (
        <Notice
          tone={downloadFeedback.tone}
          title={
            downloadFeedback.tone === 'success'
              ? t('se.forms.download.readyTitle')
              : t('se.forms.download.blockedTitle')
          }
        >
          {downloadFeedback.message}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <FileBadge className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="font-display text-[14px] font-bold text-slate-900 dark:text-white">
                  {t('se.forms.certificateTitle')}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                  {t('se.forms.signed')}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                {t('se.forms.certificateDescription')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="mt-auto w-full justify-center px-4 py-2.5 text-[12px]"
            onClick={() => handleQuickDownload('certificate')}
          >
            <Download className="h-4 w-4" aria-hidden />
            {t('se.forms.downloadCertificate')}
          </Button>
        </Card>

        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
              <ScrollText className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="font-display text-[14px] font-bold text-slate-900 dark:text-white">
                  {t('se.forms.transcriptTitle')}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-500/10 px-1.5 py-0.5 text-[8px] font-bold text-sky-700 dark:text-sky-300">
                  <BadgeCheck className="h-2.5 w-2.5" aria-hidden />
                  {t('se.forms.pdfOutput')}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                {t('se.forms.transcriptDescription')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-auto w-full justify-center px-4 py-2.5 text-[12px]"
            onClick={() => handleQuickDownload('transcript')}
          >
            <Download className="h-4 w-4" aria-hidden />
            {t('se.forms.downloadPdf')}
          </Button>
        </Card>
      </div>

      {notice ? (
        <Notice tone="success" title={t('se.forms.createdTitle')}>
          {notice}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.05fr_1fr]">
        <Card className="p-4 sm:p-5">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <FileText className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                {t('se.forms.newRequest')}
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                {t('se.forms.newRequestHint')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3.5">
            <SelectField
              label={t('se.forms.documentType')}
              placeholder={t('se.forms.documentPlaceholder')}
              options={STUDENT_FORM_TYPES.map((type) => type.label)}
              value={typeId}
              error={errors.typeId}
              onChange={(event) => {
                setTypeId(event.target.value);
                setErrors((current) => ({ ...current, typeId: undefined }));
                setNotice(null);
              }}
            />

            {selectedType ? (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200/70 bg-amber-50/60 px-3 py-2.5 text-[10.5px] leading-relaxed text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/[0.07] dark:text-amber-200">
                <Clock3 className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                <p>
                  {selectedType.description} {t('se.forms.processingLabel')}{' '}
                  <span className="font-semibold">{selectedType.processingTime}</span>.
                </p>
              </div>
            ) : null}

            <TextAreaField
              label={t('se.forms.noteLabel')}
              rows={5}
              maxLength={300}
              placeholder={t('se.forms.notePlaceholder')}
              value={note}
              error={errors.note}
              hint={t('se.forms.charCount', { count: note.length, max: 300 })}
              onChange={(event) => {
                setNote(event.target.value);
                setErrors((current) => ({ ...current, note: undefined }));
                setNotice(null);
              }}
            />

            <div className="flex flex-wrap gap-2 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
              <Button type="submit" className="px-4 py-2.5 text-[12px]">
                <Send className="h-4 w-4" aria-hidden />
                {t('se.forms.submit')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="px-4 py-2.5 text-[12px]"
                onClick={() => {
                  setTypeId('');
                  setNote('');
                  setErrors({});
                  setNotice(null);
                }}
              >
                {t('se.forms.clear')}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-4 pb-3">
            <div>
              <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                {t('se.forms.myRequests')}
              </h2>
              <p className="mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                {t('se.forms.myRequestsHint')}
              </p>
            </div>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-300">
              {t('se.forms.requestCount', { count: items.length })}
            </span>
          </div>

          <ul className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center">
                <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                  {t('se.forms.emptyTitle')}
                </p>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  {t('se.forms.emptyHint')}
                </p>
              </li>
            ) : (
              items.map((request) => {
                const Icon = FORM_ICONS[request.typeId] ?? FileText;

                return (
                  <li key={request.id} className="flex items-start gap-2.5 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                          {request.typeLabel}
                        </p>
                        <span
                          className={cx(
                            'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold',
                            STATUS_STYLES[request.status],
                          )}
                        >
                          {request.status === 'Tamamlandı' ? (
                            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden />
                          ) : null}
                          {t(STATUS_KEYS[request.status])}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                        {request.note}
                      </p>
                      <p className="mt-1 text-[8.5px] font-medium text-slate-400 dark:text-slate-600">
                        {formatDate(request.createdAt, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <p className="border-t border-slate-200/60 px-4 py-2.5 text-[9px] leading-relaxed text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
            {t('se.forms.storageNote')}
          </p>
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[14px] font-semibold text-slate-900 dark:text-white">
              {t('se.forms.catalogTitle')}
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {t('se.forms.catalogHint')}
            </p>
          </div>
          <CloudCog className="h-5 w-5 text-brand-500 dark:text-brand-300" aria-hidden />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {STUDENT_FORM_TYPES.map((type) => {
            const Icon = FORM_ICONS[type.id] ?? FileText;

            return (
              <div
                key={type.id}
                className="rounded-2xl border border-slate-200/70 bg-white/60 p-3 transition-colors hover:border-amber-300/70 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-amber-400/25"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                    {type.label}
                  </p>
                </div>
                <p className="mt-1.5 text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500">
                  {type.description}
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[8.5px] font-semibold text-amber-600 dark:text-amber-300">
                  <Clock3 className="h-2.5 w-2.5" aria-hidden />
                  {type.processingTime}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
