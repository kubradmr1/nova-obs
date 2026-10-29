import { RotateCcw, Save, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LetterBadge } from '@/components/ui/LetterBadge';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { ACADEMICIAN_COURSES } from '@/data/academician';
import type { GradeEntry, GradeMap } from '@/types/academician';
import { cx } from '@/utils/cx';
import {
  computeAverage,
  formatGrade,
  isPassing,
  resolveLetter,
} from '@/utils/grading';
import { cloneGradebooks, loadGradebooks, saveGradebooks } from '@/utils/gradebook';

interface GradebookState {
  drafts: Record<string, GradeMap>;
  saved: Record<string, GradeMap>;
}

function cloneMap(map: GradeMap): GradeMap {
  return Object.fromEntries(
    Object.entries(map).map(([studentNumber, entry]) => [studentNumber, { ...entry }]),
  );
}

function courseDirty(drafts: Record<string, GradeMap>, saved: Record<string, GradeMap>, code: string): boolean {
  return JSON.stringify(drafts[code] ?? {}) !== JSON.stringify(saved[code] ?? {});
}

interface ScoreInputProps {
  label: string;
  value: number | null;
  onChange: (value: string) => void;
}

function ScoreInput({ label, value, onChange }: ScoreInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={3}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      placeholder="—"
      className="h-9 w-16 rounded-xl border border-slate-200/90 bg-white/90 text-center text-[11.5px] font-semibold tabular-nums text-slate-800 shadow-sm transition-all duration-200 placeholder:font-normal placeholder:text-slate-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-600"
    />
  );
}

export function GradeEntryPage() {
  const [state, setState] = useState<GradebookState>(() => {
    const loaded = loadGradebooks(ACADEMICIAN_COURSES);
    return { drafts: loaded, saved: cloneGradebooks(loaded) };
  });
  const [activeCode, setActiveCode] = useState(ACADEMICIAN_COURSES[0]?.code ?? '');
  const [search, setSearch] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const activeCourse =
    ACADEMICIAN_COURSES.find((course) => course.code === activeCode) ?? ACADEMICIAN_COURSES[0];

  const draftMap = state.drafts[activeCourse.code] ?? {};
  const dirty = courseDirty(state.drafts, state.saved, activeCourse.code);

  const summary = useMemo(() => {
    let graded = 0;
    let passed = 0;

    for (const student of activeCourse.roster) {
      const entry = draftMap[student.number];

      if (!entry || entry.midterm === null || entry.final === null) {
        continue;
      }

      const average = computeAverage(entry.midterm, entry.final);
      graded += 1;

      if (isPassing(resolveLetter(average))) {
        passed += 1;
      }
    }

    return {
      total: activeCourse.roster.length,
      graded,
      missing: activeCourse.roster.length - graded,
      passed,
      failed: graded - passed,
    };
  }, [activeCourse, draftMap]);

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');

    if (!term) {
      return activeCourse.roster;
    }

    return activeCourse.roster.filter(
      (student) =>
        student.name.toLocaleLowerCase('tr-TR').includes(term) ||
        student.number.includes(term),
    );
  }, [activeCourse, search]);

  const updateScore = (studentNumber: string, field: keyof GradeEntry, raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 3);
    const value = digits === '' ? null : Math.min(100, Number(digits));

    setState((current) => {
      const courseMap = current.drafts[activeCourse.code] ?? {};
      const entry = courseMap[studentNumber] ?? { midterm: null, final: null };

      return {
        ...current,
        drafts: {
          ...current.drafts,
          [activeCourse.code]: {
            ...courseMap,
            [studentNumber]: { ...entry, [field]: value },
          },
        },
      };
    });
    setSavedNotice(null);
  };

  const switchCourse = (code: string) => {
    setActiveCode(code);
    setSearch('');
    setSavedNotice(null);
  };

  const handleSave = () => {
    const currentDraft = cloneMap(state.drafts[activeCourse.code] ?? {});
    const nextSaved = { ...state.saved, [activeCourse.code]: currentDraft };

    saveGradebooks(nextSaved);
    setState((current) => ({ ...current, saved: nextSaved }));
    setSavedNotice(
      `${activeCourse.code} · ${activeCourse.name} için ${summary.total} öğrencinin notları kaydedildi.`,
    );
  };

  const handleReset = () => {
    setState((current) => ({
      ...current,
      drafts: {
        ...current.drafts,
        [activeCourse.code]: cloneMap(current.saved[activeCourse.code] ?? {}),
      },
    }));
    setSavedNotice(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Akademisyen Paneli"
        title="Dersler & Not Girişi"
        description="Ders seç, vize ve final notlarını gir. Ortalama ve harf notu anında hesaplanır; değişiklikleri 'Notları Kaydet' ile kalıcı hale getir."
      />

      <Card className="p-2">
        <div
          className="flex gap-1.5 overflow-x-auto"
          role="group"
          aria-label="Not girilecek ders"
        >
          {ACADEMICIAN_COURSES.map((course) => {
            const isActive = course.code === activeCourse.code;
            const hasChanges = courseDirty(state.drafts, state.saved, course.code);

            return (
              <button
                key={course.code}
                type="button"
                aria-pressed={isActive}
                onClick={() => switchCourse(course.code)}
                className={cx(
                  'flex min-w-[210px] items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all duration-200',
                  isActive
                    ? 'bg-[linear-gradient(110deg,#7c5cff,#5f6bff_55%,#a855f7)] text-white shadow-[0_14px_30px_-18px_rgba(124,92,255,0.95)]'
                    : 'text-slate-600 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-white/[0.06]',
                )}
              >
                <span
                  className={cx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-display text-[9.5px] font-bold tracking-[0.02em]',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
                  )}
                >
                  {course.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold">{course.name}</span>
                  <span
                    className={cx(
                      'mt-0.5 block text-[8.5px]',
                      isActive ? 'text-white/70' : 'text-slate-400 dark:text-slate-500',
                    )}
                  >
                    {course.roster.length} öğrenci · {course.schedule}
                  </span>
                </span>
                {hasChanges ? (
                  <span
                    className={cx(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      isActive ? 'bg-amber-200' : 'bg-amber-500',
                    )}
                    title="Kaydedilmemiş değişiklik"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </Card>

      {savedNotice ? (
        <Notice tone="success" title="Notlar kaydedildi">
          {savedNotice}
        </Notice>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200/70 p-4 dark:border-white/[0.07]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-[16px] font-bold text-slate-900 dark:text-white">
                  {activeCourse.name}
                </h2>
                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-300">
                  {activeCourse.code}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                {activeCourse.term} · {activeCourse.credits} kredi · {activeCourse.ects} AKTS ·{' '}
                {activeCourse.schedule}, {activeCourse.room}
              </p>
            </div>

            <div className="relative w-full lg:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Öğrenci adı veya numarası ara…"
                aria-label="Öğrenci ara"
                className="h-9 w-full rounded-xl border border-slate-200/90 bg-white/80 pl-9 pr-3 text-[11px] font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-[9px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
              Kayıtlı <span className="text-slate-800 dark:text-slate-100">{summary.total}</span>
            </span>
            <span className="rounded-full border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-[9px] font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
              Not eksik <span className="font-bold">{summary.missing}</span>
            </span>
            <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-[9px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              Geçen <span className="font-bold">{summary.passed}</span>
            </span>
            <span className="rounded-full border border-rose-200/80 bg-rose-50/80 px-2.5 py-1 text-[9px] font-semibold text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
              Kalan <span className="font-bold">{summary.failed}</span>
            </span>
            {search ? (
              <span className="rounded-full border border-brand-200/80 bg-brand-50/80 px-2.5 py-1 text-[9px] font-semibold text-brand-600 dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300">
                {visibleStudents.length} sonuç
              </span>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/60 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-500">
                <th scope="col" className="px-4 py-2.5">
                  Öğrenci
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Vize (%40)
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Final (%60)
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Ortalama
                </th>
                <th scope="col" className="px-3 py-2.5 text-center">
                  Harf Notu
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/90 dark:divide-white/[0.05]">
              {visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
                      Öğrenci bulunamadı
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      Arama ifadesini temizleyip tekrar dene.
                    </p>
                  </td>
                </tr>
              ) : (
                visibleStudents.map((student) => {
                  const entry = draftMap[student.number];
                  const average =
                    entry && entry.midterm !== null && entry.final !== null
                      ? computeAverage(entry.midterm, entry.final)
                      : null;
                  const letter = average !== null ? resolveLetter(average) : null;
                  const passing = letter !== null ? isPassing(letter) : false;

                  return (
                    <tr
                      key={student.number}
                      className="transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={student.name} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                              {student.name}
                            </p>
                            <p className="mt-0.5 text-[9px] tabular-nums text-slate-400 dark:text-slate-500">
                              {student.number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center">
                          <ScoreInput
                            label={`${student.name} vize notu`}
                            value={entry?.midterm ?? null}
                            onChange={(value) => updateScore(student.number, 'midterm', value)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center">
                          <ScoreInput
                            label={`${student.name} final notu`}
                            value={entry?.final ?? null}
                            onChange={(value) => updateScore(student.number, 'final', value)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-[12px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
                          {average !== null ? formatGrade(average) : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center">
                          {letter ? (
                            <LetterBadge letter={letter} size="sm" />
                          ) : (
                            <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {letter ? (
                          <span
                            className={cx(
                              'inline-flex rounded-full px-2 py-0.5 text-[8.5px] font-semibold',
                              passing
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
                            )}
                          >
                            {passing ? 'Geçti' : 'Kaldı'}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[8.5px] font-semibold text-amber-600 dark:text-amber-300">
                            Not bekliyor
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.07]">
          <div className="flex items-center gap-2 text-[10px] font-medium">
            <span
              className={cx(
                'h-1.5 w-1.5 rounded-full',
                dirty ? 'bg-amber-500' : 'bg-emerald-500',
              )}
              aria-hidden
            />
            <span className={dirty ? 'text-amber-600 dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}>
              {dirty ? 'Kaydedilmemiş değişiklikler var' : 'Tüm değişiklikler kayıtlı'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={!dirty}
              className="px-4 py-2.5 text-[11.5px]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Değişiklikleri geri al
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!dirty}
              className="px-4 py-2.5 text-[11.5px]"
            >
              <Save className="h-3.5 w-3.5" aria-hidden />
              Notları Kaydet
            </Button>
          </div>
        </div>
      </Card>

      <p className="text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500">
        Not girişleri bu tarayıcıda saklanır ve demo amaçlıdır. Vize %40, final %60 ağırlığıyla
        hesaplanır; 60 ve üzeri ortalama (DD) geçer not kabul edilir.
      </p>
    </div>
  );
}
