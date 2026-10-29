import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  PenLine,
  RotateCcw,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { LetterBadge } from '@/components/ui/LetterBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EXAM_SCHEDULE } from '@/data/exams';
import { COURSES, STUDENT } from '@/data/student';
import type { ExamScheduleEntry, ExamType } from '@/types/student';
import { cx } from '@/utils/cx';
import { computeAverage, formatGrade, resolveLetter } from '@/utils/grading';

type Filter = 'Tümü' | ExamType;

const FILTERS: Filter[] = ['Tümü', 'Vize', 'Final', 'Bütünleme'];

const TYPE_STYLES: Record<ExamType, string> = {
  Vize: 'border-brand-400/25 bg-brand-500/10 text-brand-700 dark:border-brand-400/20 dark:text-brand-300',
  Final: 'border-sky-400/25 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:text-sky-300',
  Bütünleme:
    'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:text-amber-300',
};

const TYPE_ICONS: Record<ExamType, LucideIcon> = {
  Vize: PenLine,
  Final: GraduationCap,
  Bütünleme: RotateCcw,
};

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  weekday: 'long',
});

const shortDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
});

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  finished: boolean;
}

function getRemaining(startsAt: string, now: number): Remaining {
  const diff = new Date(startsAt).getTime() - now;
  const finished = diff <= 0;
  const totalMinutes = Math.max(0, Math.floor(diff / 60000));

  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    finished,
  };
}

function useNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

interface ExamCardProps {
  exam: ExamScheduleEntry;
  now: number;
}

function ExamCard({ exam, now }: ExamCardProps) {
  const remaining = getRemaining(exam.startsAt, now);
  const TypeIcon = TYPE_ICONS[exam.type];

  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] border border-slate-200/70 bg-white/80 shadow-[0_22px_50px_-44px_rgba(30,20,80,0.55)] backdrop-blur-xl transition-colors hover:border-brand-300/70 dark:border-white/[0.07] dark:bg-[#0d0c1c]/75 dark:hover:border-white/15">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-slate-500/8 px-1.5 py-0.5 text-[8.5px] font-bold text-slate-500 dark:bg-white/[0.07] dark:text-slate-300">
            {exam.courseCode}
          </span>
          <span
            className={cx(
              'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold',
              TYPE_STYLES[exam.type],
            )}
          >
            <TypeIcon className="h-2.5 w-2.5" aria-hidden />
            {exam.type}
          </span>
        </div>
        <span
          className={cx(
            'rounded-full px-1.5 py-0.5 text-[8px] font-bold',
            remaining.finished
              ? 'bg-slate-500/10 text-slate-400 dark:text-slate-500'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
          )}
        >
          {remaining.finished ? 'Tamamlandı' : 'Yaklaşıyor'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[12.5px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
          {exam.courseName}
        </h3>

        <div className="mt-2 space-y-1 text-[9.5px] text-slate-400 dark:text-slate-500">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
            {dateFormatter.format(new Date(exam.startsAt))}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3 w-3 shrink-0" aria-hidden />
              {timeFormatter.format(new Date(exam.startsAt))} · {exam.durationMinutes} dk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {exam.room} · Sıra {exam.seat}
            </span>
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-2.5 py-2 dark:border-white/[0.06] dark:bg-white/[0.03]">
          {remaining.finished ? (
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
              Sınav tarihi geçti
            </span>
          ) : (
            <>
              <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                <Timer className="h-3 w-3 text-brand-500 dark:text-brand-300" aria-hidden />
                Kalan
              </span>
              <span className="text-[10px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                {remaining.days > 0 ? `${remaining.days} gün ` : ''}
                {remaining.hours} sa {remaining.minutes} dk
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function ExamSchedulePage() {
  const now = useNow();
  const [filter, setFilter] = useState<Filter>('Tümü');

  const counts = useMemo(() => {
    const base: Record<ExamType, number> = { Vize: 0, Final: 0, Bütünleme: 0 };
    for (const exam of EXAM_SCHEDULE) {
      base[exam.type] += 1;
    }
    return base;
  }, []);

  const filtered = useMemo(
    () =>
      EXAM_SCHEDULE.filter((exam) => filter === 'Tümü' || exam.type === filter).sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [filter],
  );

  const nextExam = EXAM_SCHEDULE.find(
    (exam) => new Date(exam.startsAt).getTime() > now,
  );
  const nextRemaining = nextExam ? getRemaining(nextExam.startsAt, now) : null;

  return (
    <div className="animate-rise space-y-4">
      <PageHeader
        eyebrow="Ders ve Dönem İşlemleri"
        title="Sınav Takvimi & Notlar"
        description={`${STUDENT.term} dönemi vize, final ve bütünleme sınav tarihlerini geri sayımla takip et; güncel not dökümünü tek ekranda gör.`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-semibold text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
            <CalendarClock className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
            {EXAM_SCHEDULE.length} sınav kaydı
          </span>
        }
      />

      {nextExam && nextRemaining ? (
        <section className="relative overflow-hidden rounded-[26px] border border-brand-400/20 bg-[radial-gradient(130%_130%_at_0%_0%,#6d4bff_0%,#4c3ad6_38%,#241454_100%)] p-4 text-white shadow-[0_30px_70px_-45px_rgba(76,58,214,0.9)] sm:p-5">
          <div aria-hidden className="bg-noise pointer-events-none absolute inset-0 opacity-[0.06]" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-fuchsia-400/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-cyan-300/15 blur-3xl"
          />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>
                Sıradaki sınav
              </span>
              <h2 className="mt-2.5 font-display text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
                {nextExam.courseName}
              </h2>
              <p className="mt-1.5 text-[10.5px] text-white/60">
                {nextExam.courseCode} · {nextExam.type} ·{' '}
                {dateFormatter.format(new Date(nextExam.startsAt))}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/55">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" aria-hidden />
                  {timeFormatter.format(new Date(nextExam.startsAt))}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {nextExam.room} · Sıra {nextExam.seat}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3 w-3" aria-hidden />
                  {nextExam.durationMinutes} dakika
                </span>
              </p>
            </div>

            <div className="flex items-end gap-2" aria-live="polite" aria-atomic="true">
              {[
                { value: nextRemaining.days, label: 'gün' },
                { value: nextRemaining.hours, label: 'saat' },
                { value: nextRemaining.minutes, label: 'dakika' },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="min-w-[58px] rounded-2xl border border-white/15 bg-white/10 px-2.5 py-2 text-center backdrop-blur sm:min-w-[66px]"
                >
                  <p className="font-display text-[24px] font-bold leading-none tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </p>
                  <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/50">
                    {unit.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <Card className="p-5">
          <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
            Tüm sınavlar tamamlandı
          </p>
          <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
            Yeni sınav takvimi yayınlandığında bu ekranda görünecek.
          </p>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => {
            const isActive = option === filter;
            const count = option === 'Tümü' ? EXAM_SCHEDULE.length : counts[option];

            return (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={isActive}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold transition-colors',
                  isActive
                    ? 'border-brand-400/40 bg-brand-500/10 text-brand-700 shadow-sm dark:border-brand-400/30 dark:text-brand-200'
                    : 'border-slate-200/80 bg-white/60 text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-white/25 dark:hover:text-white',
                )}
              >
                {option}
                <span
                  className={cx(
                    'rounded-full px-1.5 text-[8px] font-bold',
                    isActive
                      ? 'bg-brand-500/15 text-brand-700 dark:text-brand-200'
                      : 'bg-slate-500/10 text-slate-400 dark:text-slate-500',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[9.5px] text-slate-400 dark:text-slate-500">
          Geri sayım her 30 saniyede güncellenir
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exam) => (
          <ExamCard key={exam.id} exam={exam} now={now} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 dark:border-white/[0.06] sm:px-5">
          <div>
            <h2 className="font-display text-[14px] font-semibold text-slate-900 dark:text-white">
              Not özeti
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              Vize %40 · Final %60 · Harf notları otomatik hesaplanır
            </p>
          </div>
          <Link
            to="/panel/dersler"
            className="inline-flex items-center gap-1 rounded-lg text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
          >
            Tüm notlar
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <caption className="sr-only">Ders bazlı vize, final, ortalama ve harf notu özeti</caption>
            <thead>
              <tr className="border-b border-slate-200/80 text-[8.5px] uppercase tracking-[0.13em] text-slate-400 dark:border-white/10 dark:text-slate-500">
                <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold sm:pl-5">
                  Ders
                </th>
                <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                  Vize
                </th>
                <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                  Final
                </th>
                <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                  Ortalama
                </th>
                <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                  Harf
                </th>
                <th scope="col" className="py-2.5 pl-2 pr-4 text-right font-semibold sm:pr-5">
                  Final tarihi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {COURSES.map((course) => {
                const average = computeAverage(course.midterm, course.final);
                const letter = resolveLetter(average);
                const finalExam = EXAM_SCHEDULE.find(
                  (exam) => exam.courseCode === course.code && exam.type === 'Final',
                );

                return (
                  <tr
                    key={course.code}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.03]"
                  >
                    <td className="py-2.5 pl-4 pr-3 sm:pl-5">
                      <p className="whitespace-nowrap text-[10.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {course.name}
                      </p>
                      <p className="text-[8.5px] text-slate-400 dark:text-slate-500">
                        {course.code}
                      </p>
                    </td>
                    <td className="px-2 py-2.5 text-center text-[10px] tabular-nums text-slate-600 dark:text-slate-300">
                      {course.midterm}
                    </td>
                    <td className="px-2 py-2.5 text-center text-[10px] tabular-nums text-slate-600 dark:text-slate-300">
                      {course.final}
                    </td>
                    <td className="px-2 py-2.5 text-center text-[10px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {formatGrade(average)}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <LetterBadge letter={letter} size="sm" />
                    </td>
                    <td className="py-2.5 pl-2 pr-4 text-right text-[9px] text-slate-400 sm:pr-5 dark:text-slate-500">
                      {finalExam
                        ? shortDateFormatter.format(new Date(finalExam.startsAt))
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="flex items-start gap-2 rounded-2xl border border-slate-200/70 bg-white/60 px-3.5 py-2.5 text-[9px] leading-relaxed text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-500">
        <Timer className="mt-px h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden />
        Sınav tarihleri demo amaçlıdır. Resmî takvim için öğrenci işleri duyurularını takip et.
      </p>
    </div>
  );
}
