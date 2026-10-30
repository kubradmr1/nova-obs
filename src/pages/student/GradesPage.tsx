import { GradeSimulator } from '@/components/student/GradeSimulator';
import { GradeTable } from '@/components/student/GradeTable';
import { Card } from '@/components/ui/Card';
import { COURSES, STUDENT } from '@/data/student';
import { useI18n } from '@/hooks/useI18n';
import { localizeClassYear, localizeTerm } from '@/utils/localeData';
import {
  computeAverage,
  formatGpa,
  letterMinimum,
  resolveLetter,
  summarizeSemester,
} from '@/utils/grading';

export function GradesPage() {
  const { t, locale } = useI18n();
  const summary = summarizeSemester(COURSES);
  const aaCount = COURSES.filter(
    (course) => resolveLetter(computeAverage(course.midterm, course.final)) === 'AA',
  ).length;
  const items = [
    {
      label: t('sc.gpa.term'),
      value: formatGpa(summary.gpa),
      hint: t('sc.grades.creditWeighted'),
    },
    {
      label: t('sc.grades.totalEcts'),
      value: String(summary.ects),
      hint: t('sc.grades.thisTerm'),
    },
    {
      label: t('sc.grades.aaCount'),
      value: String(aaCount),
      hint: t('sc.grades.aaHint'),
    },
    {
      label: t('sc.grades.passThreshold'),
      value: 'DD',
      hint: t('sc.grades.passThresholdHint', { min: letterMinimum('DD') }),
    },
  ];

  return (
    <div className="animate-rise space-y-4 sm:space-y-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {localizeTerm(STUDENT.term, locale)} · {localizeClassYear(STUDENT.classYear, locale)}
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[31px] dark:text-white">
          {t('sc.grades.title')}
        </h1>
        <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
          {t('sc.grades.description')}
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
              {t('sc.grades.breakdown')}
            </h2>
            <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
              {t('sc.grades.breakdownHint', {
                courses: COURSES.length,
                credits: summary.credits,
                ects: summary.ects,
              })}
            </p>
          </div>
          <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[9.5px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
            {t('sc.grades.weighting')}
          </span>
        </div>

        <GradeTable courses={COURSES} />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:px-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {t('sc.gpa.termAverageLong')}
            </p>
            <p className="mt-0.5 flex items-baseline gap-2">
              <span className="font-display text-[18px] font-bold tabular-nums text-slate-900 dark:text-white">
                {formatGpa(summary.gpa)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {t('sc.gpa.scale')}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {t('sc.grades.passStatus')}
            </p>
            <p className="mt-0.5 text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
              {t('sc.grades.passedCourses', { count: summary.passedCount })}
              {summary.failedCount > 0
                ? ` · ${t('sc.grades.failedCourses', { count: summary.failedCount })}`
                : ''}
            </p>
          </div>
        </div>
      </Card>

      <section id="simulator" className="scroll-mt-24 space-y-3 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-500 dark:text-brand-300">
              {t('sc.grades.liveCalc')}
            </p>
            <h2 className="mt-1 font-display text-[20px] font-semibold tracking-tight text-slate-900 sm:text-[22px] dark:text-white">
              {t('sc.sim.title')}
            </h2>
          </div>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
            {t('sc.sim.answerHint')}
          </p>
        </div>

        <GradeSimulator />
      </section>
    </div>
  );
}
