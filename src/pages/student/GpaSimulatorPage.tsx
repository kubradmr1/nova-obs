import {
  Calculator,
  ChevronDown,
  Info,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { LetterBadge } from '@/components/ui/LetterBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { COURSES, STUDENT } from '@/data/student';
import { useI18n } from '@/hooks/useI18n';
import type { LetterGrade } from '@/types/student';
import { cx } from '@/utils/cx';
import {
  LETTER_SCALE,
  computeAverage,
  formatGpa,
  formatGrade,
  letterPoints,
  resolveLetter,
} from '@/utils/grading';
import { readJson, writeJson } from '@/utils/storage';

const SCENARIO_STORAGE_KEY = 'obs.student.gpa-scenario.v1';

const LETTERS: LetterGrade[] = ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF'];

function buildDefaultGrades(): Record<string, LetterGrade> {
  return Object.fromEntries(
    COURSES.map((course) => [
      course.code,
      resolveLetter(computeAverage(course.midterm, course.final)),
    ]),
  );
}

function loadScenario(): Record<string, LetterGrade> {
  const defaults = buildDefaultGrades();
  const stored = readJson<Record<string, LetterGrade>>(SCENARIO_STORAGE_KEY);

  if (!stored) {
    return defaults;
  }

  const result = { ...defaults };
  for (const course of COURSES) {
    const letter = stored[course.code];
    if (letter && LETTERS.includes(letter)) {
      result[course.code] = letter;
    }
  }
  return result;
}

export function GpaSimulatorPage() {
  const { t } = useI18n();
  const [grades, setGrades] = useState<Record<string, LetterGrade>>(loadScenario);

  const scenario = useMemo(() => {
    let credits = 0;
    let ects = 0;
    let weightedPoints = 0;

    for (const course of COURSES) {
      const letter = grades[course.code] ?? 'FF';
      credits += course.credits;
      ects += course.ects;
      weightedPoints += letterPoints(letter) * course.credits;
    }

    const termGpa = credits > 0 ? weightedPoints / credits : 0;
    const projected =
      (STUDENT.cumulativeGpa * STUDENT.completedEcts + termGpa * credits) /
      (STUDENT.completedEcts + credits);
    const delta = projected - STUDENT.cumulativeGpa;

    const distribution = LETTER_SCALE.map((entry) => ({
      letter: entry.letter,
      count: COURSES.filter((course) => grades[course.code] === entry.letter).length,
    })).filter((entry) => entry.count > 0);

    return { credits, ects, termGpa, projected, delta, distribution };
  }, [grades]);

  const updateGrade = (code: string, letter: LetterGrade) => {
    setGrades((current) => {
      const next = { ...current, [code]: letter };
      writeJson(SCENARIO_STORAGE_KEY, next);
      return next;
    });
  };

  const resetGrades = () => {
    const defaults = buildDefaultGrades();
    setGrades(defaults);
    writeJson(SCENARIO_STORAGE_KEY, defaults);
  };

  const applyAll = (letter: LetterGrade) => {
    const next = Object.fromEntries(COURSES.map((course) => [course.code, letter]));
    setGrades(next);
    writeJson(SCENARIO_STORAGE_KEY, next);
  };

  const positive = scenario.delta >= 0;
  const tone =
    scenario.projected >= 3.5
      ? { label: t('se.sim.tone.highHonor'), className: 'text-emerald-600 dark:text-emerald-300' }
      : scenario.projected >= 3
        ? { label: t('se.sim.tone.honor'), className: 'text-teal-600 dark:text-teal-300' }
        : scenario.projected >= 2
          ? { label: t('se.sim.tone.passing'), className: 'text-amber-600 dark:text-amber-300' }
          : { label: t('se.sim.tone.risk'), className: 'text-rose-600 dark:text-rose-300' };

  return (
    <div className="animate-rise space-y-4">
      <PageHeader
        eyebrow={t('nav.groups.academic')}
        title={t('se.sim.title')}
        description={t('se.sim.description')}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {t('se.sim.live')}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Card className="p-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {t('se.sim.currentGpa')}
          </p>
          <p className="mt-1.5 font-display text-[22px] font-bold leading-none text-slate-900 dark:text-white">
            {formatGpa(STUDENT.cumulativeGpa)}
          </p>
          <p className="mt-1 text-[9px] text-slate-400 dark:text-slate-500">
            {t('se.sim.official')}
          </p>
        </Card>
        <Card className="relative overflow-hidden border-brand-300/40 bg-[linear-gradient(150deg,rgba(124,92,255,0.12),rgba(34,211,238,0.07))] p-3.5 dark:border-brand-400/25">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
            {t('se.sim.projectedGpa')}
          </p>
          <p className="mt-1.5 font-display text-[22px] font-bold leading-none text-slate-900 dark:text-white">
            {formatGpa(scenario.projected)}
          </p>
          <p className={cx('mt-1 inline-flex items-center gap-1 text-[9px] font-semibold', positive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
            {positive ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
            {positive ? '+' : ''}
            {formatGpa(scenario.delta)}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {t('se.sim.termGpa')}
          </p>
          <p className="mt-1.5 font-display text-[22px] font-bold leading-none text-slate-900 dark:text-white">
            {formatGpa(scenario.termGpa)}
          </p>
          <p className="mt-1 text-[9px] text-slate-400 dark:text-slate-500">
            {t('se.sim.termCredits', {
              credits: scenario.credits,
              ects: scenario.ects,
            })}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            {t('common.status')}
          </p>
          <p className={cx('mt-1.5 font-display text-[17px] font-bold leading-tight', tone.className)}>
            {tone.label}
          </p>
          <p className="mt-1 text-[9px] text-slate-400 dark:text-slate-500">
            {t('se.sim.statusHint')}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3.5 dark:border-white/[0.06] sm:px-5">
            <div>
              <h2 className="flex items-center gap-1.5 font-display text-[14px] font-semibold text-slate-900 dark:text-white">
                <Calculator className="h-4 w-4 text-brand-500 dark:text-brand-300" aria-hidden />
                {t('se.sim.scenarioTitle')}
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                {t('se.sim.scenarioHint')}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyAll('AA')}
                className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300"
              >
                {t('se.sim.allAA')}
              </button>
              <button
                type="button"
                onClick={() => applyAll('FF')}
                className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-[9px] font-semibold text-rose-600 transition-colors hover:bg-rose-500/15 dark:text-rose-300"
              >
                {t('se.sim.allFF')}
              </button>
              <button
                type="button"
                onClick={resetGrades}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/70 px-2 py-1 text-[9px] font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 dark:hover:text-brand-300"
              >
                <RotateCcw className="h-2.5 w-2.5" aria-hidden />
                {t('se.sim.current')}
              </button>
            </div>
          </div>

          <div className="hidden grid-cols-[minmax(0,1fr)_70px_86px] gap-2 border-b border-slate-100 px-4 py-2 text-[8px] font-semibold uppercase tracking-[0.13em] text-slate-400 dark:border-white/[0.06] dark:text-slate-500 sm:grid sm:px-5">
            <span>{t('common.course')}</span>
            <span className="text-center">{t('se.sim.current')}</span>
            <span className="text-right">{t('se.sim.scenario')}</span>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {COURSES.map((course) => {
              const currentLetter = resolveLetter(computeAverage(course.midterm, course.final));
              const scenarioLetter = grades[course.code] ?? 'FF';
              const changed = currentLetter !== scenarioLetter;

              return (
                <li
                  key={course.code}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_70px_86px] sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                        {course.name}
                      </p>
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                        {course.code}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[8.5px] text-slate-400 dark:text-slate-500">
                      {t('se.sim.courseMeta', {
                        credits: course.credits,
                        ects: course.ects,
                        average: formatGrade(computeAverage(course.midterm, course.final)),
                      })}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 sm:justify-center">
                    <LetterBadge letter={currentLetter} size="sm" />
                    <span className="text-[8px] text-slate-400 sm:hidden dark:text-slate-500">
                      {changed ? `→ ${scenarioLetter}` : ''}
                    </span>
                  </div>

                  <div className="relative col-span-2 sm:col-span-1">
                    <label className="sr-only" htmlFor={`scenario-${course.code}`}>
                      {t('se.sim.selectAria', { course: course.name })}
                    </label>
                    <select
                      id={`scenario-${course.code}`}
                      value={scenarioLetter}
                      onChange={(event) => updateGrade(course.code, event.target.value as LetterGrade)}
                      className={cx(
                        'h-8 w-full appearance-none rounded-lg border pl-2 pr-7 text-[10.5px] font-bold tracking-[0.03em] transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10',
                        changed
                          ? 'border-brand-400/60 bg-brand-500/10 text-brand-700 dark:border-brand-400/40 dark:text-brand-200'
                          : 'border-slate-200/90 bg-white/80 text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200',
                      )}
                    >
                      {LETTERS.map((letter) => (
                        <option key={letter} value={letter}>
                          {letter}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="border-t border-slate-100 px-4 py-2.5 text-[9px] text-slate-400 dark:border-white/[0.06] dark:text-slate-500 sm:px-5">
            {t('se.sim.disclaimer')}
          </p>
        </Card>

        <div className="space-y-3">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                  {t('se.sim.projectedGpa')}
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  {t('se.sim.completedEcts', { ects: STUDENT.completedEcts })}
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-brand-500 dark:text-brand-300" aria-hidden />
            </div>

            <div className="mt-3 flex items-end gap-2">
              <p className="font-display text-[46px] font-bold leading-[0.9] tracking-tight text-slate-900 dark:text-white">
                {formatGpa(scenario.projected)}
              </p>
              <span className="pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                / 4,00
              </span>
            </div>

            <div className="mt-3">
              <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#7c5cff,#a855f7,#22d3ee)] transition-all duration-300"
                  style={{ width: `${Math.min(100, (scenario.projected / 4) * 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[8.5px] font-medium text-slate-400 dark:text-slate-500">
                <span>0,00</span>
                <span>{t('se.sim.passingMark')}</span>
                <span>4,00</span>
              </div>
            </div>

            <div
              className={cx(
                'mt-3 flex items-start gap-2 rounded-xl border px-2.5 py-2 text-[9.5px] leading-relaxed',
                positive
                  ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-400/25 bg-rose-500/10 text-rose-600 dark:text-rose-300',
              )}
            >
              {positive ? (
                <TrendingUp className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <TrendingDown className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
              <span>
                {t('se.sim.deltaBefore')}{' '}
                <strong className="font-bold">
                  {positive ? '+' : ''}
                  {formatGpa(scenario.delta)}
                </strong>{' '}
                {t('se.sim.deltaAfter', { tone: tone.label })}
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              {t('se.sim.distributionTitle')}
            </h2>
            <p className="mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
              {t('se.sim.distributionHint', { count: COURSES.length })}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {scenario.distribution.map((entry) => (
                <span
                  key={entry.letter}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/60 px-1.5 py-1 dark:border-white/[0.08] dark:bg-white/[0.04]"
                >
                  <LetterBadge letter={entry.letter} size="sm" />
                  <span className="pr-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                    ×{entry.count}
                  </span>
                </span>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
              <Info className="mt-px h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden />
              {t('se.sim.distributionNote')}
            </p>
          </Card>

          <p className="px-1 text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
            {t('se.sim.footerNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
