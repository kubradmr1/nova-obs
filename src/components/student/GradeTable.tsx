import { LetterBadge } from '@/components/ui/LetterBadge';
import type { CourseRecord } from '@/types/student';
import { cx } from '@/utils/cx';
import {
  computeAverage,
  formatGrade,
  isPassing,
  resolveLetter,
} from '@/utils/grading';

interface GradeTableProps {
  courses: CourseRecord[];
}

export function GradeTable({ courses }: GradeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-collapse">
        <caption className="sr-only">
          2026–2027 Güz dönemi ders notları, vize ve final ağırlıklı ortalamalar
        </caption>
        <thead>
          <tr className="border-b border-slate-200/80 text-[9.5px] uppercase tracking-[0.14em] text-slate-400 dark:border-white/10 dark:text-slate-500">
            <th scope="col" className="py-3 pl-5 pr-4 text-left font-semibold sm:pl-6">
              Ders Adı
            </th>
            <th scope="col" className="px-3 py-3 text-center font-semibold">
              Vize <span className="font-medium text-slate-300 dark:text-slate-600">(%40)</span>
            </th>
            <th scope="col" className="px-3 py-3 text-center font-semibold">
              Final <span className="font-medium text-slate-300 dark:text-slate-600">(%60)</span>
            </th>
            <th scope="col" className="px-3 py-3 text-center font-semibold">
              Ortalama
            </th>
            <th scope="col" className="px-3 py-3 text-center font-semibold">
              Harf Notu
            </th>
            <th scope="col" className="py-3 pl-3 pr-5 text-right font-semibold sm:pr-6">
              AKTS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {courses.map((course) => {
            const average = computeAverage(course.midterm, course.final);
            const letter = resolveLetter(average);
            const passed = isPassing(letter);

            return (
              <tr
                key={course.code}
                className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.03]"
              >
                <td className="py-3.5 pl-5 pr-4 sm:pl-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[9px] font-bold tracking-wide text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                      {course.code.replace(/[0-9]/g, '')}
                    </span>
                    <div className="min-w-0">
                      <p className="whitespace-nowrap text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {course.name}
                      </p>
                      <p className="whitespace-nowrap text-[10px] text-slate-400 dark:text-slate-500">
                        {course.code} · {course.instructor}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-center text-[12.5px] font-medium tabular-nums text-slate-600 dark:text-slate-300">
                  {course.midterm}
                </td>
                <td className="px-3 py-3.5 text-center text-[12.5px] font-medium tabular-nums text-slate-600 dark:text-slate-300">
                  {course.final}
                </td>
                <td className="px-3 py-3.5">
                  <p className="text-center text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatGrade(average)}
                  </p>
                  <div className="mx-auto mt-1 h-1 w-14 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div
                      className={cx(
                        'h-full rounded-full',
                        passed ? 'bg-emerald-400' : 'bg-rose-400',
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, average))}%` }}
                    />
                  </div>
                </td>
                <td className="px-3 py-3.5 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <LetterBadge letter={letter} />
                    <span
                      className={cx(
                        'text-[9px] font-semibold',
                        passed
                          ? 'text-emerald-600 dark:text-emerald-300'
                          : 'text-rose-500 dark:text-rose-300',
                      )}
                    >
                      {passed ? 'Geçti' : 'Kaldı'}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 pl-3 pr-5 text-right sm:pr-6">
                  <p className="text-[12px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {course.ects}
                  </p>
                  <p className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {course.credits} kredi
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
