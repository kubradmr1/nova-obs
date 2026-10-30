import { AlertTriangle, CheckCircle2, ChevronDown, RotateCcw, Target } from 'lucide-react';
import { useState } from 'react';
import { COURSES } from '@/data/student';
import { useI18n } from '@/hooks/useI18n';
import type { LetterGrade } from '@/types/student';
import { cx } from '@/utils/cx';
import {
  computeAverage,
  formatGrade,
  isPassing,
  letterMinimum,
  requiredFinal,
  resolveLetter,
} from '@/utils/grading';

const TARGET_LETTERS: LetterGrade[] = ['DD', 'DC', 'CC', 'CB', 'BB', 'BA', 'AA'];

const clampScore = (value: string): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(parsed)));
};

interface ScoreControlProps {
  id: string;
  label: string;
  weight: string;
  value: number;
  onChange: (value: number) => void;
}

function ScoreControl({ id, label, weight, value, onChange }: ScoreControlProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
        >
          {label}
        </label>
        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
          {weight}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input
          id={id}
          type="number"
          min={0}
          max={100}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(clampScore(event.target.value))}
          className="h-10 w-[68px] shrink-0 rounded-xl border border-slate-200/90 bg-white px-2 text-center text-[17px] font-semibold tabular-nums text-slate-900 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
        />
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          aria-label={t('se.gradeSim.sliderAria', { label })}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500 dark:bg-white/10"
        />
      </div>
    </div>
  );
}

export function GradeSimulator() {
  const { t } = useI18n();
  const [courseCode, setCourseCode] = useState(COURSES[0].code);
  const course = COURSES.find((item) => item.code === courseCode) ?? COURSES[0];
  const [midterm, setMidterm] = useState(course.midterm);
  const [finalScore, setFinalScore] = useState(course.final);
  const [target, setTarget] = useState<LetterGrade>('DD');

  const handleCourseChange = (code: string) => {
    const next = COURSES.find((item) => item.code === code) ?? COURSES[0];
    setCourseCode(next.code);
    setMidterm(next.midterm);
    setFinalScore(next.final);
  };

  const resetToCourseGrades = () => {
    setMidterm(course.midterm);
    setFinalScore(course.final);
  };

  const targetMin = letterMinimum(target);
  const needed = requiredFinal(midterm, targetMin);
  const impossible = needed > 100;

  const average = computeAverage(midterm, finalScore);
  const scenarioLetter = resolveLetter(average);
  const scenarioPassed = isPassing(scenarioLetter);
  const maxAchievable = computeAverage(midterm, 100);
  const maxLetter = resolveLetter(maxAchievable);

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200/70 bg-white/80 shadow-[0_26px_60px_-45px_rgba(30,20,80,0.5)] backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#0d0c1c]/75">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/[0.06] sm:px-6">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">
            {t('se.gradeSim.title')}
          </h3>
          <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
            {t('se.gradeSim.subtitle')}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {t('se.sim.live')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-[1.05fr_1fr] lg:p-6">
        <div className="space-y-3.5">
          <div>
            <label
              htmlFor="simulator-course"
              className="mb-1.5 block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
            >
              {t('common.course')}
            </label>
            <div className="relative">
              <select
                id="simulator-course"
                value={courseCode}
                onChange={(event) => handleCourseChange(event.target.value)}
                className="h-11 w-full appearance-none rounded-2xl border border-slate-200/90 bg-white/80 pl-3.5 pr-10 text-[12px] font-semibold text-slate-800 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
              >
                {COURSES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} · {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <ScoreControl
              id="simulator-midterm"
              label={t('se.gradeSim.midterm')}
              weight="%40"
              value={midterm}
              onChange={setMidterm}
            />
            <ScoreControl
              id="simulator-final"
              label={t('se.gradeSim.final')}
              weight="%60"
              value={finalScore}
              onChange={setFinalScore}
            />
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <Target className="h-3 w-3 text-brand-500 dark:text-brand-300" aria-hidden />
              {t('se.gradeSim.targetLetter')}
            </p>
            <div className="grid grid-cols-7 gap-1">
              {TARGET_LETTERS.map((letter) => {
                const isActive = letter === target;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setTarget(letter)}
                    aria-pressed={isActive}
                    aria-label={t('se.gradeSim.targetAria', {
                      letter,
                      min: letterMinimum(letter),
                    })}
                    title={t('se.gradeSim.targetTitle', {
                      letter,
                      min: letterMinimum(letter),
                    })}
                    className={cx(
                      'flex items-center justify-center rounded-xl border py-2 text-[11.5px] font-bold tracking-[0.04em] transition-all duration-200',
                      isActive
                        ? 'border-brand-400 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-400/40 dark:bg-brand-500/15 dark:text-brand-200'
                        : 'border-slate-200/80 bg-white/70 text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:border-white/25 dark:hover:text-white',
                    )}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
              {t('se.gradeSim.liveHint')}
            </p>
            <button
              type="button"
              onClick={resetToCourseGrades}
              className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-slate-400 transition-colors hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-300"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              {t('se.gradeSim.reset')}
            </button>
          </div>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-[22px] bg-[radial-gradient(120%_120%_at_0%_0%,#7c5cff_0%,#4f46e5_46%,#271764_100%)] p-5 text-white">
          <div aria-hidden className="bg-noise pointer-events-none absolute inset-0 opacity-[0.07]" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-fuchsia-400/30 blur-3xl"
          />

          <div className="relative">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
              {t('se.gradeSim.neededLabel', { target })}
            </p>
            <div
              className="mt-1.5 flex items-end gap-2"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="font-display text-[52px] font-bold leading-[0.95] tracking-tight">
                {needed > 100 ? '100+' : needed}
              </p>
              <span className="pb-1.5 text-[13px] font-medium text-white/45">/ 100</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-w-[38px] items-center justify-center rounded-lg border border-white/25 bg-white/15 px-2 py-0.5 text-[10.5px] font-bold tracking-[0.04em] text-white">
                {target}
              </span>
              <span className="text-[10px] text-white/55">
                {t('se.gradeSim.targetSummary', { min: targetMin })}
              </span>
            </div>

            <div className="mt-5">
              <div className="relative h-2 rounded-full bg-white/15">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.45),#ffffff)] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, needed))}%` }}
                />
                <span
                  className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"
                  style={{ left: `${Math.min(100, Math.max(0, needed))}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[8.5px] font-medium text-white/40">
                <span>0</span>
                <span>100</span>
              </div>
            </div>

            {impossible ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/30 bg-amber-400/15 px-3 py-2.5 text-[10.5px] leading-relaxed text-amber-100">
                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  {t('se.gradeSim.impossibleBefore')}{' '}
                  <strong className="font-semibold text-white">{maxLetter}</strong>.
                </span>
              </div>
            ) : (
              <p className="mt-4 flex items-start gap-2 text-[10.5px] leading-relaxed text-white/60">
                <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                {t('se.gradeSim.successBefore')}{' '}
                <strong className="font-semibold text-white">{needed}</strong>{' '}
                {t('se.gradeSim.successAfter', { target })}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/20 px-3.5 py-3 backdrop-blur">
              <div>
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  {t('se.gradeSim.inScenario')}
                </p>
                <p className="mt-1 flex items-baseline gap-1.5 text-[16px] font-semibold">
                  {formatGrade(average)}
                  <span className="text-[9.5px] font-normal text-white/45">
                    {t('se.gradeSim.average')}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <span
                  className={cx(
                    'inline-flex min-w-[38px] items-center justify-center rounded-lg border px-2 py-1 text-[10.5px] font-bold tracking-[0.04em]',
                    scenarioPassed
                      ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200'
                      : 'border-rose-300/30 bg-rose-400/15 text-rose-200',
                  )}
                >
                  {scenarioLetter}
                </span>
                <p
                  className={cx(
                    'mt-1 text-[9px] font-semibold',
                    scenarioPassed ? 'text-emerald-300' : 'text-rose-300',
                  )}
                >
                  {scenarioPassed ? t('se.gradeSim.pass') : t('se.gradeSim.fail')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
