import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  ClipboardList,
  Clock3,
  CloudCog,
  Info,
  LockKeyhole,
  PencilLine,
  RotateCcw,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { UNIVERSITY_NAME } from '@/config/branding';
import { findAcademicianByName } from '@/data/academicians';
import {
  AKTS_MAX,
  AKTS_TARGET,
  ELECTIVE_CURRICULUM,
  REGISTRATION_STORAGE_KEY,
  REQUIRED_CURRICULUM,
  SEED_REGISTRATION,
  summarizeSelection,
} from '@/data/curriculum';
import { STUDENT } from '@/data/student';
import type {
  AdvisorApprovalStatus,
  CourseRegistrationState,
  CurriculumCourse,
} from '@/types/student';
import { cx } from '@/utils/cx';
import { readJson, writeJson } from '@/utils/storage';

const STATUS_META: Record<
  AdvisorApprovalStatus,
  { label: string; icon: LucideIcon; chip: string }
> = {
  draft: {
    label: 'Taslak',
    icon: PencilLine,
    chip: 'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  pending: {
    label: 'Onay bekliyor',
    icon: Clock3,
    chip: 'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  approved: {
    label: 'Onaylandı',
    icon: BadgeCheck,
    chip: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
};

const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

interface NoticeState {
  tone: 'success' | 'info' | 'warning' | 'danger';
  title: string;
  text: string;
}

interface CourseMetaProps {
  course: CurriculumCourse;
}

function CourseMeta({ course }: CourseMetaProps) {
  return (
    <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">
      {course.credits} kredi · {course.ects} AKTS · {course.schedule} · {course.room}
    </p>
  );
}

export function CourseRegistrationPage() {
  const advisor = findAcademicianByName(STUDENT.advisor);
  const [registration, setRegistration] = useState<CourseRegistrationState>(
    () => readJson<CourseRegistrationState>(REGISTRATION_STORAGE_KEY) ?? SEED_REGISTRATION,
  );
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const summary = summarizeSelection(registration.selectedElectives);
  const statusMeta = STATUS_META[registration.status];
  const StatusIcon = statusMeta.icon;
  const belowTarget = summary.ects < AKTS_TARGET;
  const overLimit = summary.ects > AKTS_MAX;
  const canSubmit =
    registration.status === 'draft' && !belowTarget && !overLimit && summary.ects > 0;
  const ectsProgress = Math.min(100, Math.round((summary.ects / AKTS_MAX) * 100));

  const persist = (next: CourseRegistrationState) => {
    setRegistration(next);
    writeJson(REGISTRATION_STORAGE_KEY, next);
  };

  const withDraft = (selectedElectives: string[]) =>
    persist({
      ...registration,
      selectedElectives,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      submittedAt: undefined,
      approvedAt: undefined,
    });

  const toggleElective = (course: CurriculumCourse) => {
    const isSelected = registration.selectedElectives.includes(course.code);

    if (!isSelected && summary.ects + course.ects > AKTS_MAX) {
      setNotice({
        tone: 'warning',
        title: 'AKTS sınırı aşılıyor',
        text: `${course.code} eklenirse ${summary.ects + course.ects} AKTS olur. Dönem için üst sınır ${AKTS_MAX} AKTS.`,
      });
      return;
    }

    const nextSelection = isSelected
      ? registration.selectedElectives.filter((code) => code !== course.code)
      : [...registration.selectedElectives, course.code];

    withDraft(nextSelection);
    setNotice(null);
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      setNotice({
        tone: 'danger',
        title: 'Kayıt gönderilemedi',
        text: `Danışman onayına göndermek için toplam AKTS ${AKTS_TARGET}–${AKTS_MAX} aralığında olmalı.`,
      });
      return;
    }

    const now = new Date().toISOString();
    persist({
      ...registration,
      status: 'pending',
      updatedAt: now,
      submittedAt: now,
      approvedAt: undefined,
    });
    setNotice({
      tone: 'info',
      title: 'Ders kaydı danışmana gönderildi',
      text: `${STUDENT.advisor} seçimini inceliyor. Onay durumu bu ekrandan takip edilebilir.`,
    });
  };

  const handleApprove = () => {
    const now = new Date().toISOString();
    persist({
      ...registration,
      status: 'approved',
      updatedAt: now,
      approvedAt: now,
    });
    setNotice({
      tone: 'success',
      title: 'Ders kaydı onaylandı',
      text: `${STUDENT.advisor} kaydını e-imza ile onayladı. Seçimlerin ${STUDENT.term} dönemi için kesinleşti.`,
    });
  };

  const handleEdit = () => {
    persist({ ...registration, status: 'draft', updatedAt: new Date().toISOString() });
    setNotice({
      tone: 'info',
      title: 'Kayıt düzenlemeye açıldı',
      text: 'Seçimlerini güncelledikten sonra yeniden danışman onayına gönderebilirsin.',
    });
  };

  const handleReset = () => {
    persist(SEED_REGISTRATION);
    setNotice({
      tone: 'info',
      title: 'Kayıt geri yüklendi',
      text: 'Dönem başındaki onaylı ders seçimine dönüldü.',
    });
  };

  const timeline = [
    {
      title: 'Ders seçimi',
      text:
        registration.status === 'draft'
          ? 'Seçimlerini tamamla'
          : `${summary.courses.length} ders seçildi`,
      state: registration.status === 'draft' ? 'current' : 'done',
    },
    {
      title: 'Danışman onayı',
      text:
        registration.status === 'approved'
          ? 'E-imza ile onaylandı'
          : registration.status === 'pending'
            ? 'İnceleme sürüyor'
            : 'Gönderim bekleniyor',
      state:
        registration.status === 'approved'
          ? 'done'
          : registration.status === 'pending'
            ? 'current'
            : 'upcoming',
    },
    {
      title: 'Kayıt kesinleşti',
      text:
        registration.status === 'approved'
          ? `${STUDENT.term} aktif`
          : 'Onay sonrası aktifleşir',
      state: registration.status === 'approved' ? 'done' : 'upcoming',
    },
  ] as const;

  return (
    <div className="animate-rise space-y-4">
      <PageHeader
        eyebrow="Ders ve Dönem İşlemleri"
        title="Ders Kaydı & Müfredat"
        description={`${STUDENT.term} dönemi için zorunlu ve seçmeli derslerini yönet; AKTS sayacını ve danışman onay durumunu anlık takip et.`}
        actions={
          <span
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold',
              statusMeta.chip,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" aria-hidden />
            {statusMeta.label}
          </span>
        }
      />

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.text}
        </Notice>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          {
            label: 'Toplam AKTS',
            value: String(summary.ects),
            hint: `${AKTS_TARGET} hedef · ${AKTS_MAX} üst sınır`,
          },
          {
            label: 'Kredi',
            value: String(summary.credits),
            hint: 'Kredi ağırlıklı GNO',
          },
          {
            label: 'Seçmeli ders',
            value: String(summary.electiveCount),
            hint: `${ELECTIVE_CURRICULUM.length} derslik havuz`,
          },
          {
            label: 'Danışman onayı',
            value: statusMeta.label,
            hint:
              registration.status === 'approved' && registration.approvedAt
                ? dateTimeFormatter.format(new Date(registration.approvedAt))
                : 'Salı 14.00 – 16.00',
          },
        ].map((item) => (
          <Card key={item.label} className="p-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {item.label}
            </p>
            <p className="mt-1.5 font-display text-[19px] font-bold leading-none tracking-tight text-slate-900 dark:text-white">
              {item.value}
            </p>
            <p className="mt-1 text-[9px] text-slate-400 dark:text-slate-500">{item.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.38fr_1fr]">
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3.5 dark:border-white/[0.06] sm:px-5">
              <div>
                <h2 className="flex items-center gap-1.5 font-display text-[14px] font-semibold text-slate-900 dark:text-white">
                  <ClipboardList className="h-4 w-4 text-sky-500 dark:text-sky-300" aria-hidden />
                  Zorunlu dersler
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  Müfredat gereği otomatik eklenir, kaldırılamaz.
                </p>
              </div>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold text-sky-700 dark:text-sky-300">
                {REQUIRED_CURRICULUM.length} ders
              </span>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {REQUIRED_CURRICULUM.map((course) => (
                <li key={course.code} className="flex items-start gap-2.5 px-4 py-2.5 sm:px-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                        {course.name}
                      </p>
                      <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500">
                        {course.code}
                      </span>
                    </div>
                    <CourseMeta course={course} />
                  </div>
                  <LockKeyhole
                    className="mt-1 h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600"
                    aria-label="Zorunlu ders"
                  />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3.5 dark:border-white/[0.06] sm:px-5">
              <div>
                <h2 className="flex items-center gap-1.5 font-display text-[14px] font-semibold text-slate-900 dark:text-white">
                  <CloudCog className="h-4 w-4 text-brand-500 dark:text-brand-300" aria-hidden />
                  Seçmeli ders havuzu
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  Bulut bilişim uzmanlaşma derslerinden dönemine uygun olanları seç.
                </p>
              </div>
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-700 dark:text-brand-300">
                {summary.electiveCount} seçili
              </span>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4">
              {ELECTIVE_CURRICULUM.map((course) => {
                const isSelected = registration.selectedElectives.includes(course.code);
                const wouldExceed = !isSelected && summary.ects + course.ects > AKTS_MAX;

                return (
                  <button
                    key={course.code}
                    type="button"
                    onClick={() => toggleElective(course)}
                    aria-pressed={isSelected}
                    disabled={wouldExceed}
                    className={cx(
                      'relative flex h-full flex-col rounded-2xl border p-3 text-left transition-all duration-200',
                      isSelected
                        ? 'border-brand-400/60 bg-brand-500/[0.07] shadow-[0_16px_36px_-28px_rgba(124,92,255,0.9)] dark:border-brand-400/35 dark:bg-brand-500/[0.1]'
                        : 'border-slate-200/80 bg-white/60 hover:border-brand-300 hover:bg-white/80 dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.05]',
                      wouldExceed && 'cursor-not-allowed opacity-45',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-slate-500/8 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-500 dark:bg-white/[0.07] dark:text-slate-300">
                          {course.code}
                        </span>
                        <span className="rounded-md border border-brand-300/30 bg-brand-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-brand-700 dark:text-brand-300">
                          Seçmeli
                        </span>
                      </div>
                      <span
                        className={cx(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                          isSelected
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-slate-300 text-transparent dark:border-white/20',
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                      </span>
                    </div>

                    <p className="mt-2 text-[11.5px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                      {course.name}
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">
                      {course.instructor}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500">
                      {course.description}
                    </p>

                    <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
                      <CourseMeta course={course} />
                      {course.quota ? (
                        <span className="shrink-0 text-[8.5px] font-semibold text-slate-400 dark:text-slate-500">
                          {course.enrolled}/{course.quota} kontenjan
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                  Dönem sepeti
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  {STUDENT.term} · {STUDENT.classYear}
                </p>
              </div>
              <span
                className={cx(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8.5px] font-bold',
                  statusMeta.chip,
                )}
              >
                {statusMeta.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  AKTS
                </p>
                <p className="mt-1 flex items-baseline gap-1 font-display text-[22px] font-bold leading-none text-slate-900 dark:text-white">
                  {summary.ects}
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                    / {AKTS_MAX}
                  </span>
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-2.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Kredi
                </p>
                <p className="mt-1 font-display text-[22px] font-bold leading-none text-slate-900 dark:text-white">
                  {summary.credits}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7c5cff,#a855f7)] transition-all duration-300"
                  style={{ width: `${ectsProgress}%` }}
                />
                <span
                  className="absolute inset-y-0 w-px bg-slate-400/60 dark:bg-white/35"
                  style={{ left: `${(AKTS_TARGET / AKTS_MAX) * 100}%` }}
                  aria-hidden
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[8.5px] font-medium text-slate-400 dark:text-slate-500">
                <span>0</span>
                <span>{AKTS_TARGET} AKTS hedefi</span>
                <span>{AKTS_MAX}</span>
              </div>
            </div>

            <p className="mt-2 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500">
              <Info className="mt-px h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden />
              {overLimit
                ? `Toplam ${summary.ects} AKTS ile üst sınırı aştın. Bir seçmeli ders çıkarmalısın.`
                : belowTarget
                  ? `Hedefin ${AKTS_TARGET - summary.ects} AKTS altındasın. Seçmeli ders ekleyebilirsin.`
                  : `${summary.courses.length} dersle dönem hedefini karşılıyorsun.`}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200/70 pt-3 dark:border-white/[0.07]">
              {registration.status === 'draft' ? (
                <>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="px-3.5 py-2.5 text-[11.5px]"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Danışman onayına gönder
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleReset}
                    className="px-3.5 py-2.5 text-[11.5px]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    Geri al
                  </Button>
                </>
              ) : registration.status === 'pending' ? (
                <>
                  <Button
                    type="button"
                    onClick={handleApprove}
                    className="px-3.5 py-2.5 text-[11.5px]"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    Demo: onayı simüle et
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleEdit}
                    className="px-3.5 py-2.5 text-[11.5px]"
                  >
                    Düzenle
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleEdit}
                    className="px-3.5 py-2.5 text-[11.5px]"
                  >
                    <PencilLine className="h-3.5 w-3.5" aria-hidden />
                    Kaydı düzenle
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                    className="px-3 py-2.5 text-[11px]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    Sıfırla
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              Onay süreci
            </h2>
            <ol className="mt-3 space-y-0">
              {timeline.map((step, index) => (
                <li key={step.title} className="relative flex gap-2.5 pb-3 last:pb-0">
                  {index < timeline.length - 1 ? (
                    <span
                      aria-hidden
                      className={cx(
                        'absolute left-[9px] top-5 h-[calc(100%-12px)] w-px',
                        step.state === 'done' ? 'bg-emerald-400/50' : 'bg-slate-200 dark:bg-white/10',
                      )}
                    />
                  ) : null}
                  <span
                    className={cx(
                      'relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border text-[8px] font-bold',
                      step.state === 'done'
                        ? 'border-emerald-500/30 bg-emerald-500 text-white'
                        : step.state === 'current'
                          ? 'border-brand-500/30 bg-brand-500 text-white'
                          : 'border-slate-200 bg-white text-slate-400 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-500',
                    )}
                  >
                    {step.state === 'done' ? (
                      <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div>
                    <p className="text-[10.5px] font-semibold text-slate-700 dark:text-slate-200">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-1.5">
              <Avatar name={STUDENT.advisor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
                  Danışman Akademisyen
                </p>
                <p className="text-[11px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                  {STUDENT.advisor}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500">
              {advisor?.department ?? STUDENT.department} · Ofis {advisor?.office ?? 'V-204'} ·{' '}
              {advisor?.officeHours ?? 'Salı 14.00 – 16.00'}
            </p>
            <Link
              to="/panel/mesajlar"
              className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
            >
              Danışmana mesaj gönder
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            </Link>
          </Card>

          <p className="px-1 text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
            {UNIVERSITY_NAME} ders kayıt kuralları gereği dönemlik yük en az {AKTS_TARGET}, en fazla{' '}
            {AKTS_MAX} AKTS olabilir. Onaylanan kayıt dönem sonuna kadar geçerlidir.
          </p>
        </div>
      </div>
    </div>
  );
}
