import { GradeSimulator } from '@/components/student/GradeSimulator';
import { GradeTable } from '@/components/student/GradeTable';
import { Card } from '@/components/ui/Card';
import { COURSES, STUDENT } from '@/data/student';
import {
  computeAverage,
  formatGpa,
  letterMinimum,
  resolveLetter,
  summarizeSemester,
} from '@/utils/grading';

const SUMMARY_ITEMS = (gpa: string, ects: number, aaCount: number) => [
  { label: 'Dönem GNO', value: gpa, hint: 'Kredi ağırlıklı' },
  { label: 'Toplam AKTS', value: String(ects), hint: 'Bu dönem' },
  { label: 'AA sayısı', value: String(aaCount), hint: 'En yüksek not' },
  {
    label: 'Geçme sınırı',
    value: 'DD',
    hint: `En az ${letterMinimum('DD')} ortalama`,
  },
];

export function GradesPage() {
  const summary = summarizeSemester(COURSES);
  const aaCount = COURSES.filter(
    (course) => resolveLetter(computeAverage(course.midterm, course.final)) === 'AA',
  ).length;
  const items = SUMMARY_ITEMS(formatGpa(summary.gpa), summary.ects, aaCount);

  return (
    <div className="animate-rise space-y-4 sm:space-y-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {STUDENT.term} · {STUDENT.classYear}
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[31px] dark:text-white">
          Derslerim &amp; Notlarım
        </h1>
        <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          Vize notun %40, final notun %60 ağırlığıyla değerlendirilir. Ortalama ve harf notu
          otomatik hesaplanır.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label} className="p-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {item.label}
            </p>
            <p className="mt-1.5 font-display text-[20px] font-bold leading-none tracking-tight text-slate-900 dark:text-white">
              {item.value}
            </p>
            <p className="mt-1 text-[9.5px] text-slate-400 dark:text-slate-500">{item.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
              Not dökümü
            </h2>
            <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
              {COURSES.length} ders · {summary.credits} kredi · {summary.ects} AKTS
            </p>
          </div>
          <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[9.5px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
            Vize %40 · Final %60
          </span>
        </div>

        <GradeTable courses={COURSES} />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:px-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Dönem not ortalaması</p>
            <p className="mt-0.5 flex items-baseline gap-2">
              <span className="font-display text-[18px] font-bold tabular-nums text-slate-900 dark:text-white">
                {formatGpa(summary.gpa)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">/ 4,00</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Başarı durumu</p>
            <p className="mt-0.5 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
              {summary.passedCount} ders geçti
              {summary.failedCount > 0 ? ` · ${summary.failedCount} ders kaldı` : ''}
            </p>
          </div>
        </div>
      </Card>

      <section id="simulator" className="scroll-mt-24 space-y-3 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-500 dark:text-brand-300">
              Canlı hesaplama
            </p>
            <h2 className="mt-1 font-display text-[20px] font-semibold tracking-tight text-slate-900 sm:text-[22px] dark:text-white">
              Harf Notu Simülatörü
            </h2>
          </div>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
            &ldquo;Finalden kaç alırsam geçerim?&rdquo; sorusunun cevabı
          </p>
        </div>

        <GradeSimulator />
      </section>
    </div>
  );
}
