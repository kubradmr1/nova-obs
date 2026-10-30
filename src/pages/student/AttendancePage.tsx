import { AlertTriangle, CalendarCheck, Clock, Info, Percent } from 'lucide-react';
import { StatCard } from '@/components/student/StatCard';
import { Card } from '@/components/ui/Card';
import { COURSES, RECENT_ABSENCES, STUDENT } from '@/data/student';
import { useI18n } from '@/hooks/useI18n';
import { localizeClassYear, localizeTerm } from '@/utils/localeData';
import type { MessageKey } from '@/i18n/messages';
import type { AttendanceStatus } from '@/types/student';
import { cx } from '@/utils/cx';
import {
  absenceLimit,
  attendanceRate,
  attendanceStatus,
  formatGrade,
  remainingAbsence,
  summarizeAttendance,
} from '@/utils/grading';

const STATUS_META: Record<AttendanceStatus, { badge: string; bar: string; text: string }> = {
  safe: {
    badge:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
  risk: {
    badge: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-300',
  },
  critical: {
    badge: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300',
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-300',
  },
};

const STATUS_LABELS: Record<AttendanceStatus, MessageKey> = {
  safe: 'sc.attendance.safe',
  risk: 'sc.attendance.risky',
  critical: 'sc.attendance.critical',
};

const RULES: MessageKey[] = [
  'sc.attendance.rule1',
  'sc.attendance.rule2',
  'sc.attendance.rule3',
];

function dateFromDaysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export function AttendancePage() {
  const { t, formatDate, locale } = useI18n();
  const summary = summarizeAttendance(COURSES);
  const usedRatio = Math.round((summary.absentHours / summary.totalLimit) * 100);

  return (
    <div className="animate-rise space-y-4 sm:space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            {localizeTerm(STUDENT.term, locale)} · {localizeClassYear(STUDENT.classYear, locale)}
          </p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[31px] dark:text-white">
            {t('sc.attendance.title')}
          </h1>
          <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            {t('sc.attendance.description')}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[9.5px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400">
          <Info className="h-3 w-3 text-brand-500 dark:text-brand-300" aria-hidden />
          {t('sc.attendance.regulation')}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('sc.attendance.overallRate')}
          value={locale === 'en' ? `${formatGrade(summary.rate)}%` : `%${formatGrade(summary.rate)}`}
          hint={t('sc.attendance.overallRateHint', { hours: summary.totalHours })}
          icon={Percent}
          tone={summary.rate >= 90 ? 'emerald' : 'amber'}
        />
        <StatCard
          label={t('sc.attendance.totalAbsence')}
          value={t('sc.attendance.hoursValue', { hours: summary.absentHours })}
          hint={t('sc.attendance.usedHint', { percent: usedRatio })}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label={t('sc.attendance.remainingTitle')}
          value={t('sc.attendance.hoursValue', { hours: summary.remaining })}
          hint={t('sc.attendance.remainingHint', { hours: summary.totalLimit })}
          icon={CalendarCheck}
          tone="sky"
        />
        <StatCard
          label={t('sc.attendance.riskyCourse')}
          value={String(summary.riskyCount)}
          hint={
            summary.riskyCount > 0
              ? t('sc.attendance.riskyHint')
              : t('sc.attendance.allSafe')
          }
          icon={AlertTriangle}
          tone={summary.riskyCount > 0 ? 'rose' : 'emerald'}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
              {t('sc.attendance.byCourse')}
            </h2>
            <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
              {t('sc.attendance.byCourseHint')}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-medium text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{' '}
              {t('sc.attendance.safe')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{' '}
              {t('sc.attendance.risky')}
            </span>
          </div>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {COURSES.map((course) => {
            const limit = absenceLimit(course);
            const remaining = remainingAbsence(course);
            const status = attendanceStatus(course);
            const meta = STATUS_META[status];
            const usedPercent = Math.min(100, (course.absentHours / Math.max(1, limit)) * 100);

            return (
              <li key={course.code} className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[9px] font-bold tracking-wide text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                      {course.code.replace(/[0-9]/g, '')}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {course.name}
                      </p>
                      <p className="truncate text-[9.5px] text-slate-400 dark:text-slate-500">
                        {course.code} · {course.schedule} · {course.room}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cx(
                        'rounded-full border px-2 py-0.5 text-[8.5px] font-semibold',
                        meta.badge,
                      )}
                    >
                      {t(STATUS_LABELS[status])}
                    </span>
                    <span className="text-[10.5px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                      {t('sc.attendance.percentAttended', {
                        percent: formatGrade(attendanceRate(course)),
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className={cx('h-full rounded-full transition-all duration-500', meta.bar)}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                    {t('sc.attendance.hoursOf', { used: course.absentHours, limit })}
                  </span>
                  <span
                    className={cx(
                      'w-[68px] shrink-0 text-right text-[10px] font-semibold',
                      remaining > 0 ? meta.text : 'text-rose-500 dark:text-rose-300',
                    )}
                  >
                    {remaining > 0
                      ? t('sc.attendance.hoursLeft', { hours: remaining })
                      : t('sc.attendance.usedUp')}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-[10px] leading-relaxed text-slate-400 sm:px-6 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-500">
          <Info className="mt-px h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden />
          {t('sc.attendance.note')}
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="px-5 pb-2.5 pt-5">
            <h2 className="font-display text-[14px] font-semibold text-slate-900 dark:text-white">
              {t('sc.attendance.recent')}
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {t('sc.attendance.recentHint')}
            </p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {RECENT_ABSENCES.map((record) => {
              const course = COURSES.find((item) => item.code === record.courseCode);

              return (
                <li key={record.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                      {course?.name ?? record.courseCode}
                    </p>
                    <p className="text-[9.5px] text-slate-400 dark:text-slate-500">
                      {t('sc.attendance.recentRecord', {
                        date: formatDate(dateFromDaysAgo(record.daysAgo), {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }),
                        hours: record.hours,
                      })}
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-100/80 px-2 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                    {record.courseCode}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-[14px] font-semibold text-slate-900 dark:text-white">
            {t('sc.attendance.rules')}
          </h2>
          <ul className="mt-3 space-y-2.5">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <p className="text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {t(rule)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl border border-brand-200/60 bg-brand-50/60 px-3.5 py-3 dark:border-brand-400/15 dark:bg-brand-500/[0.08]">
            <p className="text-[10px] font-semibold text-brand-700 dark:text-brand-200">
              {t('sc.attendance.askAdvisor')}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-brand-700/70 dark:text-brand-200/70">
              {t('sc.attendance.advisorSlot', { name: STUDENT.advisor })}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
