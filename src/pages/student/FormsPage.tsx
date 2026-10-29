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
import { useStoredList } from '@/hooks/useStoredList';
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

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

interface FormErrors {
  typeId?: string;
  note?: string;
}

export function StudentFormsPage() {
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
        message:
          'Tarayıcı yeni pencereyi engelledi. Adres çubuğundaki açılır pencere iznini verip yeniden dene.',
      });
      return;
    }

    setDownloadFeedback({
      tone: 'success',
      message:
        kind === 'certificate'
          ? 'E-imzalı öğrenci belgesi yeni sekmede hazırlandı. Açılan yazdırma penceresinden “PDF olarak kaydet” seçeneğini kullanabilirsin.'
          : 'Transkript belgesi yeni sekmede hazırlandı. Yazdırma penceresinde hedef olarak “PDF olarak kaydet” seçeneğini seç.',
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!selectedType) {
      nextErrors.typeId = 'Talep edeceğin belgeyi seç.';
    }

    if (note.trim().length < 10) {
      nextErrors.note = 'Talebinin nedenini en az 10 karakterle açıkla.';
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
      `${selectedType.label} talebin alındı. Tahmini hazırlanma süresi: ${selectedType.processingTime}. Durumu bu ekrandan takip edebilirsin.`,
    );
    setTypeId('');
    setNote('');
    setErrors({});
  };

  return (
    <div className="animate-rise space-y-4">
      <PageHeader
        eyebrow="Form İşlemleri"
        title="Formlar & Belgeler"
        description="Öğrenci belgesi, transkript, staj ve bulut laboratuvarı taleplerini buradan oluştur; hazırlanma durumunu takip et."
      />

      {downloadFeedback ? (
        <Notice
          tone={downloadFeedback.tone}
          title={downloadFeedback.tone === 'success' ? 'Belge hazır' : 'Açılır pencere engellendi'}
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
                  Öğrenci Belgesi
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                  E-imzalı
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                Öğrencilik durumunu doğrulayan, danışman e-imzalı ve doğrulama kodlu belgeyi anında
                oluştur.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="mt-auto w-full justify-center px-4 py-2.5 text-[12px]"
            onClick={() => handleQuickDownload('certificate')}
          >
            <Download className="h-4 w-4" aria-hidden />
            Belgeyi İndir
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
                  Transkript
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-500/10 px-1.5 py-0.5 text-[8px] font-bold text-sky-700 dark:text-sky-300">
                  <BadgeCheck className="h-2.5 w-2.5" aria-hidden />
                  PDF çıktı
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                Dönem dökümü, harf notları, GANO ve AKTS özetini içeren resmî görünümlü transkripti
                indir.
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
            PDF İndir
          </Button>
        </Card>
      </div>

      {notice ? (
        <Notice tone="success" title="Talep oluşturuldu">
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
                Yeni belge talebi
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                Talepler e-imzalı PDF olarak öğrenci e-postana gönderilir.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3.5">
            <SelectField
              label="Belge türü"
              placeholder="Belge seç"
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
                  {selectedType.description} Tahmini hazırlanma süresi:{' '}
                  <span className="font-semibold">{selectedType.processingTime}</span>.
                </p>
              </div>
            ) : null}

            <TextAreaField
              label="Açıklama"
              rows={5}
              maxLength={300}
              placeholder="Belgeyi hangi amaçla talep ettiğini kısaca yaz…"
              value={note}
              error={errors.note}
              hint={`${note.length}/300 karakter`}
              onChange={(event) => {
                setNote(event.target.value);
                setErrors((current) => ({ ...current, note: undefined }));
                setNotice(null);
              }}
            />

            <div className="flex flex-wrap gap-2 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
              <Button type="submit" className="px-4 py-2.5 text-[12px]">
                <Send className="h-4 w-4" aria-hidden />
                Talebi Gönder
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
                Formu temizle
              </Button>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-4 pb-3">
            <div>
              <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                Taleplerim
              </h2>
              <p className="mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                En yeni talep listenin başında görünür
              </p>
            </div>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-300">
              {items.length} talep
            </span>
          </div>

          <ul className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center">
                <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">
                  Henüz talep oluşturmadın
                </p>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  Soldaki formdan ilk belge talebini oluşturabilirsin.
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
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                        {request.note}
                      </p>
                      <p className="mt-1 text-[8.5px] font-medium text-slate-400 dark:text-slate-600">
                        {dateFormatter.format(new Date(request.createdAt))}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <p className="border-t border-slate-200/60 px-4 py-2.5 text-[9px] leading-relaxed text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
            Talepler bu tarayıcıda saklanır; demo ortamında öğrenci işleri akışı simüle edilir.
          </p>
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[14px] font-semibold text-slate-900 dark:text-white">
              Sunulan belgeler
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              Bulut Bilişim Operatörlüğü öğrencilerine özel form kataloğu
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
