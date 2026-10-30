import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  CalendarCheck,
  CalendarClock,
  GraduationCap,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/student/StatCard';
import { Card } from '@/components/ui/Card';
import { LetterBadge } from '@/components/ui/LetterBadge';
import { COURSES, STUDENT, UPCOMING_EXAMS } from '@/data/student';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { localizeClassYear, localizeTerm } from '@/utils/localeData';
import {
  absenceLimit,
  attendanceStatus,
  computeAverage,
  formatGpa,
  formatGrade,
  resolveLetter,
  summarizeAttendance,
  summarizeSemester,
} from '@/utils/grading';

function dateFromNow(offsetDays: number): Date {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

export function DashboardPage() {
  const { session } = useAuth();
  const { t, formatDate, locale } = useI18n();
  const summary = summarizeSemester(COURSES);
  const attendance = summarizeAttendance(COURSES);
  const riskCourse = COURSES.find((course) => attendanceStatus(course) !== 'safe');
  const nextExam = UPCOMING_EXAMS.reduce((closest, exam) =>
    exam.inDays < closest.inDays ? exam : closest,
  );

  const firstName = session?.name.trim().split(/\s+/)[0] ?? STUDENT.name.split(' ')[0];
  const today = formatDate(dateFromNow(0), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const weekday = formatDate(dateFromNow(0), { weekday: 'long' });

  const countdownLabel = (days: number): string => {
    if (days <= 0) {
      return t('common.today');
    }

    if (days === 1) {
      return t('sc.dash.tomorrow');
    }

    return t('sc.dash.daysLeft', { count: days });
  };

  return (
    <div className="animate-rise space-y-4 sm:space-y-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {today} · {weekday}
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[31px] dark:text-white">
          {t('sc.dash.greeting', { name: firstName })}
        </h1>
        <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400">
          {localizeTerm(STUDENT.term, locale)} · {localizeClassYear(STUDENT.classYear, locale)} ·{' '}
          {STUDENT.department}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('sc.gpa.overall')}
          value={formatGpa(STUDENT.cumulativeGpa)}
          suffix={t('sc.gpa.scale')}
          hint={t('sc.dash.overallHint', { ects: STUDENT.completedEcts })}
          icon={GraduationCap}
          tone="brand"
        />
        <StatCard
          label={t('sc.gpa.term')}
          value={formatGpa(summary.gpa)}
          suffix={t('sc.gpa.scale')}
          hint={t('sc.dash.termHint', { ects: summary.ects, credits: summary.credits })}
          icon={TrendingUp}
          tone="sky"
        />
        <StatCard
          label={t('sc.dash.attendanceRate')}
          value={locale === 'en' ? `${formatGrade(attendance.rate)}%` : `%${formatGrade(attendance.rate)}`}
          hint={t('sc.dash.attendanceHint', {
            hours: attendance.absentHours,
            courses: attendance.riskyCount,
          })}
          icon={CalendarCheck}
          tone={attendance.riskyCount > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          label={t('sc.dash.upcomingExam')}
          value={String(UPCOMING_EXAMS.length)}
          hint={t('sc.dash.nextExamHint', { days: nextExam.inDays })}
          icon={CalendarClock}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.55fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
                {t('sc.dash.termGrades')}
              </h2>
              <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                {t('sc.dash.termGradesHint', { term: t('common.term') })}
              </p>
            </div>
            <Link
              to="/panel/dersler"
              className="inline-flex items-center gap-1 rounded-lg px-1 text-[10.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
            >
              {t('sc.dash.allGrades')}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {COURSES.map((course) => {
              const average = computeAverage(course.midterm, course.final);
              const letter = resolveLetter(average);

              return (
                <li
                  key={course.code}
                  className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50/60 sm:px-6 dark:hover:bg-white/[0.02]"
                >
                  <LetterBadge letter={letter} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                      {course.name}
                    </p>
                    <p className="truncate text-[9.5px] text-slate-400 dark:text-slate-500">
                      {course.code} · {course.instructor}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                      {formatGrade(average)}
                    </p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500">
                      {course.ects} {t('sc.table.ects')}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:px-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
              {t('sc.gpa.termAverage')}
            </span>
            <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              <span className="tabular-nums">{formatGpa(summary.gpa)}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-300">
                {t('sc.dash.passedCount', {
                  passed: summary.passedCount,
                  total: COURSES.length,
                })}
              </span>
            </span>
          </div>
        </Card>

        <div className="min-w-0 space-y-3">
          <Card className="overflow-hidden">
            <div className="px-5 pb-2.5 pt-5">
              <h2 className="font-display text-[14px] font-semibold text-slate-900 dark:text-white">
                {t('sc.dash.upcomingExams')}
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                {t('sc.dash.upcomingRange')}
              </p>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {UPCOMING_EXAMS.map((exam) => {
                const course = COURSES.find((item) => item.code === exam.courseCode);
                const date = dateFromNow(exam.inDays);

                return (
                  <li key={exam.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                      <span className="font-display text-[15px] font-bold leading-none">
                        {date.getDate()}
                      </span>
                      <span className="mt-1 text-[8px] font-semibold uppercase tracking-wide">
                        {formatDate(date, { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {course?.name ?? exam.courseCode}
                      </p>
                      <p className="truncate text-[9.5px] text-slate-400 dark:text-slate-500">
                        {exam.title} · {exam.time} · {exam.location}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[8.5px] font-semibold text-amber-600 dark:text-amber-300">
                      {countdownLabel(exam.inDays)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {riskCourse ? (
            <Card className="border-amber-300/60 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(255,255,255,0.55))] p-4 dark:border-amber-400/20 dark:bg-none dark:bg-amber-500/[0.07]">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-semibold text-amber-800 dark:text-amber-200">
                    {t('sc.dash.absenceRisk')}
                  </p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-amber-700/80 dark:text-amber-200/70">
                    {t('sc.dash.absenceRiskText', {
                      course: riskCourse.name,
                      used: riskCourse.absentHours,
                      limit: absenceLimit(riskCourse),
                    })}
                  </p>
                  <Link
                    to="/panel/devamsizlik"
                    className="mt-2 inline-flex items-center gap-1 rounded-lg text-[10px] font-semibold text-amber-800 transition-colors hover:text-amber-600 dark:text-amber-200 dark:hover:text-amber-100"
                  >
                    {t('sc.dash.absenceDetail')}
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[26px] border border-brand-400/20 bg-[linear-gradient(115deg,#1b1240_0%,#2c1a72_45%,#4a2bb8_100%)] p-5 text-white shadow-[0_30px_70px_-45px_rgba(58,35,160,0.9)] sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-fuchsia-500/30 blur-3xl"
        />
        <div
          aria-hidden
          className="bg-grid pointer-events-none absolute inset-0 opacity-[0.12] [mask-image:linear-gradient(to_left,black,transparent_70%)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
              <Calculator className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-200/80">
                {t('sc.sim.title')}
              </p>
              <h2 className="mt-1 font-display text-[17px] font-semibold tracking-tight sm:text-[19px]">
                {t('sc.sim.question')}
              </h2>
              <p className="mt-1 max-w-md text-[10.5px] leading-relaxed text-white/55">
                {t('sc.sim.description')}
              </p>
            </div>
          </div>
          <Link
            to="/panel/dersler#simulator"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11.5px] font-semibold text-brand-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-50"
          >
            {t('sc.sim.open')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
