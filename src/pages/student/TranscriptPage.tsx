import { Info, Printer, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LetterBadge } from '@/components/ui/LetterBadge';
import {
  UNIVERSITY_NAME,
  UNIVERSITY_UNIT,
  UNIVERSITY_VERIFICATION,
} from '@/config/branding';
import { ACADEMIC_HISTORY, COURSES, STUDENT } from '@/data/student';
import { useAuth } from '@/hooks/useAuth';
import type { SemesterRecord } from '@/types/student';
import {
  computeAverage,
  formatGpa,
  formatGrade,
  letterPoints,
  resolveLetter,
  summarizeSemester,
} from '@/utils/grading';

const IDENTITY_FIELDS: Array<{ label: string; value: string }> = [
  { label: 'Fakülte', value: STUDENT.faculty },
  { label: 'Bölüm', value: STUDENT.department },
  { label: 'Program', value: STUDENT.program },
  { label: 'Sınıf', value: STUDENT.classYear },
  { label: 'Kayıt yılı', value: STUDENT.enrolledAt },
  { label: 'Danışman', value: STUDENT.advisor },
];

const STATUS_BADGES: Record<SemesterRecord['status'], string> = {
  completed:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  ongoing: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300',
};

const STATUS_LABELS: Record<SemesterRecord['status'], string> = {
  completed: 'Tamamlandı',
  ongoing: 'Devam ediyor',
};

export function TranscriptPage() {
  const { session } = useAuth();
  const summary = summarizeSemester(COURSES);
  const ectsProgress = Math.round((STUDENT.completedEcts / STUDENT.totalEcts) * 100);

  const name = session?.name ?? STUDENT.name;
  const identifier = session?.identifier ?? STUDENT.identifier;
  const issuedAt = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const documentNo = `NOVA-TR-${new Date().getFullYear()}-${identifier}`;

  return (
    <div className="animate-rise space-y-4 sm:space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Resmî olmayan öğrenci belgesi
          </p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[31px] dark:text-white">
            Transkript
          </h1>
          <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400">
            {STUDENT.term} itibarıyla akademik kayıt dökümün
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => window.print()}
          className="w-fit px-4 py-2.5 text-[11.5px] print:hidden"
        >
          <Printer className="h-4 w-4" aria-hidden />
          Yazdır / PDF
        </Button>
      </header>

      <Card className="overflow-hidden p-5 sm:p-6 print:break-inside-avoid print:bg-white print:shadow-none">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img
              src="/nova-mark.svg"
              alt=""
              width={38}
              height={38}
              className="h-9 w-9 shrink-0 rounded-xl shadow-[0_10px_24px_-14px_rgba(124,92,255,0.9)]"
              aria-hidden
            />
            <div>
              <p className="font-display text-[11.5px] font-bold uppercase tracking-[0.12em] text-slate-800 dark:text-slate-100">
                {UNIVERSITY_NAME}
              </p>
              <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">
                {UNIVERSITY_UNIT} · {UNIVERSITY_VERIFICATION}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              Belge no
            </p>
            <p className="mt-0.5 text-[9.5px] font-semibold text-slate-700 dark:text-slate-200">
              {documentNo}
            </p>
            <p className="text-[8.5px] text-slate-400 dark:text-slate-500">{issuedAt}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#8b5cf6,#4f46e5)] font-display text-[15px] font-bold text-white">
              {name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toLocaleUpperCase('tr-TR'))
                .join('')}
            </span>
            <div>
              <h2 className="font-display text-[18px] font-semibold tracking-tight text-slate-900 dark:text-white">
                {name}
              </h2>
              <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                {identifier} · {STUDENT.program}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-300">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Aktif öğrenci
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-6 dark:border-white/[0.06]">
          {IDENTITY_FIELDS.map((field) => (
            <div key={field.label}>
              <dt className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {field.label}
              </dt>
              <dd className="mt-1 text-[10.5px] font-semibold leading-snug text-slate-700 dark:text-slate-200">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Genel not ortalaması
          </p>
          <p className="mt-1.5 flex items-baseline gap-1.5 font-display text-[24px] font-bold leading-none text-slate-900 dark:text-white">
            {formatGpa(STUDENT.cumulativeGpa)}
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              / 4,00
            </span>
          </p>
          <p className="mt-1 text-[9.5px] text-slate-400 dark:text-slate-500">
            {ACADEMIC_HISTORY.length} dönem ortalaması
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Toplam AKTS
          </p>
          <p className="mt-1.5 flex items-baseline gap-1.5 font-display text-[24px] font-bold leading-none text-slate-900 dark:text-white">
            {STUDENT.completedEcts}
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              / {STUDENT.totalEcts}
            </span>
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7c5cff,#a855f7)]"
              style={{ width: `${ectsProgress}%` }}
            />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Dönem ortalaması
          </p>
          <p className="mt-1.5 flex items-baseline gap-1.5 font-display text-[24px] font-bold leading-none text-slate-900 dark:text-white">
            {formatGpa(summary.gpa)}
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              / 4,00
            </span>
          </p>
          <p className="mt-1 text-[9.5px] text-slate-400 dark:text-slate-500">
            {summary.passedCount}/{COURSES.length} ders başarılı · {summary.ects} AKTS
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden print:break-inside-avoid print:bg-white print:shadow-none">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
              {STUDENT.term} dönem dökümü
            </h2>
            <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
              {summary.credits} kredi · {summary.ects} AKTS
            </p>
          </div>
          <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[9px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
            Güncel dönem
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <caption className="sr-only">
              {STUDENT.term} dönemi ders, kredi, AKTS, harf notu ve katsayı dökümü
            </caption>
            <thead>
              <tr className="border-b border-slate-200/80 text-[9px] uppercase tracking-[0.14em] text-slate-400 dark:border-white/10 dark:text-slate-500">
                <th scope="col" className="py-2.5 pl-5 pr-3 text-left font-semibold sm:pl-6">
                  Ders
                </th>
                <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                  Kredi
                </th>
                <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                  AKTS
                </th>
                <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                  Ortalama
                </th>
                <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                  Harf
                </th>
                <th scope="col" className="py-2.5 pl-3 pr-5 text-right font-semibold sm:pr-6">
                  Katsayı
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {COURSES.map((course) => {
                const average = computeAverage(course.midterm, course.final);
                const letter = resolveLetter(average);

                return (
                  <tr
                    key={course.code}
                    className="transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.03]"
                  >
                    <td className="py-2.5 pl-5 pr-3 sm:pl-6">
                      <p className="whitespace-nowrap text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {course.name}
                      </p>
                      <p className="text-[9.5px] text-slate-400 dark:text-slate-500">
                        {course.code}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-center text-[11px] tabular-nums text-slate-600 dark:text-slate-300">
                      {course.credits}
                    </td>
                    <td className="px-3 py-2.5 text-center text-[11px] tabular-nums text-slate-600 dark:text-slate-300">
                      {course.ects}
                    </td>
                    <td className="px-3 py-2.5 text-center text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {formatGrade(average)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <LetterBadge letter={letter} size="sm" />
                    </td>
                    <td className="py-2.5 pl-3 pr-5 text-right text-[11px] font-semibold tabular-nums text-slate-700 sm:pr-6 dark:text-slate-200">
                      {formatGrade(letterPoints(letter))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200/80 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]">
                <td className="py-3 pl-5 pr-3 text-[10.5px] font-semibold text-slate-500 sm:pl-6 dark:text-slate-400">
                  Dönem sonu
                </td>
                <td className="px-3 py-3 text-center text-[10.5px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                  {summary.credits}
                </td>
                <td className="px-3 py-3 text-center text-[10.5px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                  {summary.ects}
                </td>
                <td className="px-3 py-3 text-center text-[10.5px] text-slate-400 dark:text-slate-500">
                  —
                </td>
                <td className="px-3 py-3 text-center text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                  GNO
                </td>
                <td className="py-3 pl-3 pr-5 text-right text-[11.5px] font-bold tabular-nums text-slate-900 sm:pr-6 dark:text-white">
                  {formatGpa(summary.gpa)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden print:break-inside-avoid print:bg-white print:shadow-none">
        <div className="px-5 py-4 sm:px-6">
          <h2 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
            Akademik geçmiş
          </h2>
          <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
            Dönem bazlı not ortalamaları
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <caption className="sr-only">Dönem bazlı AKTS, GNO ve durum bilgileri</caption>
            <thead>
              <tr className="border-y border-slate-200/80 text-[9px] uppercase tracking-[0.14em] text-slate-400 dark:border-white/10 dark:text-slate-500">
                <th scope="col" className="py-2.5 pl-5 pr-3 text-left font-semibold sm:pl-6">
                  Dönem
                </th>
                <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                  AKTS
                </th>
                <th scope="col" className="px-3 py-2.5 text-center font-semibold">
                  GNO
                </th>
                <th scope="col" className="py-2.5 pl-3 pr-5 text-right font-semibold sm:pr-6">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {ACADEMIC_HISTORY.map((semester) => (
                <tr key={semester.term}>
                  <td className="py-3 pl-5 pr-3 text-[11.5px] font-semibold text-slate-800 sm:pl-6 dark:text-slate-100">
                    {semester.term}
                  </td>
                  <td className="px-3 py-3 text-center text-[11px] tabular-nums text-slate-600 dark:text-slate-300">
                    {semester.ects}
                  </td>
                  <td className="px-3 py-3 text-center text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                    {formatGpa(semester.gpa)}
                  </td>
                  <td className="py-3 pl-3 pr-5 text-right sm:pr-6">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[8.5px] font-semibold ${STATUS_BADGES[semester.status]}`}
                    >
                      {STATUS_LABELS[semester.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200/80 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]">
                <td className="py-3 pl-5 pr-3 text-[10.5px] font-semibold text-slate-500 sm:pl-6 dark:text-slate-400">
                  Genel toplam
                </td>
                <td className="px-3 py-3 text-center text-[10.5px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                  {STUDENT.completedEcts}
                </td>
                <td className="px-3 py-3 text-center text-[10.5px] font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatGpa(STUDENT.cumulativeGpa)}
                </td>
                <td className="py-3 pl-3 pr-5 text-right text-[9px] font-semibold text-slate-400 sm:pr-6 dark:text-slate-500">
                  {STUDENT.totalEcts} AKTS program
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <p className="flex items-start gap-2 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 text-[10px] leading-relaxed text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-500 print:bg-white">
        <Info className="mt-px h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden />
        Bu transkript demo amaçlı üretilmiştir ve resmî belge niteliği taşımaz. Resmî transkript
        için öğrenci işleri birimine başvurmalısın.
      </p>
    </div>
  );
}
