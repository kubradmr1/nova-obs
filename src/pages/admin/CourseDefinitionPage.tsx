import { BookPlus, RotateCcw } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  ACADEMICIANS_STORAGE_KEY,
  COURSES_STORAGE_KEY,
  FACULTIES,
  SEED_ACADEMICIANS,
  SEED_COURSES,
  TERM_OPTIONS,
  departmentsFor,
} from '@/data/admin';
import { ACADEMICIANS } from '@/data/academicians';
import { COURSES } from '@/data/student';
import { useStoredList } from '@/hooks/useStoredList';
import type { DefinedCourse } from '@/types/admin';
import { readCollection } from '@/utils/storage';

interface CourseFormState {
  code: string;
  name: string;
  faculty: string;
  department: string;
  instructor: string;
  credits: string;
  ects: string;
  term: string;
  quota: string;
}

type CourseFormErrors = Partial<Record<keyof CourseFormState, string>>;

function createEmptyForm(): CourseFormState {
  return {
    code: '',
    name: '',
    faculty: '',
    department: '',
    instructor: '',
    credits: '3',
    ects: '5',
    term: TERM_OPTIONS[0],
    quota: '60',
  };
}

export function CourseDefinitionPage() {
  const { items, add } = useStoredList<DefinedCourse>(COURSES_STORAGE_KEY, SEED_COURSES);
  const [values, setValues] = useState<CourseFormState>(createEmptyForm);
  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  const instructorOptions = useMemo(() => {
    const registered = readCollection(ACADEMICIANS_STORAGE_KEY, SEED_ACADEMICIANS);
    const names = [
      ...ACADEMICIANS.map((academician) => academician.name),
      ...registered.map(
        (academician) => `${academician.title} ${academician.firstName} ${academician.lastName}`,
      ),
    ];

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'tr'));
  }, []);

  const update = (field: keyof CourseFormState, value: string) => {
    setValues((current) => {
      if (field === 'faculty') {
        return { ...current, faculty: value, department: '' };
      }

      return { ...current, [field]: value };
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  };

  const validate = (): CourseFormErrors => {
    const next: CourseFormErrors = {};
    const code = values.code.trim();
    const existingCodes = new Set([
      ...COURSES.map((course) => course.code),
      ...items.map((course) => course.code),
    ]);

    if (!/^[A-Z]{2,4}\d{3,4}$/.test(code)) {
      next.code = 'Ders kodu 2–4 harf ve 3–4 rakamdan oluşmalı (örn. BM401).';
    } else if (existingCodes.has(code)) {
      next.code = 'Bu ders kodu zaten tanımlı.';
    }

    if (values.name.trim().length < 3) {
      next.name = 'Ders adı en az 3 karakter olmalı.';
    }

    if (!values.faculty) {
      next.faculty = 'Fakülte seçimi zorunlu.';
    }

    if (!values.department) {
      next.department = 'Bölüm seçimi zorunlu.';
    }

    if (!values.instructor) {
      next.instructor = 'Dersi verecek akademisyeni seç.';
    }

    const credits = Number(values.credits);

    if (!/^\d+$/.test(values.credits) || credits < 1 || credits > 10) {
      next.credits = 'Kredi 1–10 arasında olmalı.';
    }

    const ects = Number(values.ects);

    if (!/^\d+$/.test(values.ects) || ects < 1 || ects > 30) {
      next.ects = 'AKTS 1–30 arasında olmalı.';
    }

    const quota = Number(values.quota);

    if (!/^\d+$/.test(values.quota) || quota < 1 || quota > 500) {
      next.quota = 'Kontenjan 1–500 arasında olmalı.';
    }

    if (!values.term) {
      next.term = 'Dönem seçimi zorunlu.';
    }

    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice(null);
      return;
    }

    add({
      id: `course-${Date.now().toString(36)}`,
      code: values.code.trim(),
      name: values.name.trim(),
      faculty: values.faculty,
      department: values.department,
      instructor: values.instructor,
      credits: Number(values.credits),
      ects: Number(values.ects),
      term: values.term,
      quota: Number(values.quota),
    });

    setNotice(
      `${values.code.trim()} · ${values.name.trim()} dersi tanımlandı ve ${values.instructor} ile eşleştirildi.`,
    );
    setValues(createEmptyForm());
    setErrors({});
  };

  const handleReset = () => {
    setValues(createEmptyForm());
    setErrors({});
    setNotice(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Yönetim Paneli"
        title="Ders Tanımlama"
        description="Müfredata yeni ders ekle, dersin akademisyenini, kredi/AKTS değerlerini ve kontenjanını belirle."
      />

      {notice ? (
        <Notice tone="success" title="Ders tanımlandı">
          {notice}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.95fr_1.45fr]">
        <Card className="p-4">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <BookPlus className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                Yeni ders
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                Ders kodu sistemde benzersiz olmalıdır.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField
                label="Ders Kodu"
                placeholder="BM401"
                autoComplete="off"
                maxLength={8}
                value={values.code}
                error={errors.code}
                onChange={(event) =>
                  update('code', event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                }
              />
              <InputField
                label="Ders Adı"
                placeholder="Makine Öğrenmesi"
                autoComplete="off"
                value={values.name}
                error={errors.name}
                onChange={(event) => update('name', event.target.value)}
              />
              <SelectField
                label="Fakülte"
                placeholder="Fakülte seç"
                options={FACULTIES.map((faculty) => faculty.name)}
                value={values.faculty}
                error={errors.faculty}
                onChange={(event) => update('faculty', event.target.value)}
              />
              <SelectField
                label="Bölüm"
                placeholder={values.faculty ? 'Bölüm seç' : 'Önce fakülte seç'}
                options={departmentsFor(values.faculty)}
                value={values.department}
                error={errors.department}
                disabled={!values.faculty}
                onChange={(event) => update('department', event.target.value)}
              />
              <SelectField
                label="Akademisyen"
                placeholder="Akademisyen seç"
                options={instructorOptions}
                value={values.instructor}
                error={errors.instructor}
                fieldClassName="sm:col-span-2"
                onChange={(event) => update('instructor', event.target.value)}
              />
              <SelectField
                label="Dönem"
                options={TERM_OPTIONS}
                value={values.term}
                error={errors.term}
                onChange={(event) => update('term', event.target.value)}
              />
              <InputField
                label="Kontenjan"
                inputMode="numeric"
                placeholder="60"
                value={values.quota}
                error={errors.quota}
                onChange={(event) => update('quota', event.target.value.replace(/\D/g, ''))}
              />
              <InputField
                label="Kredi"
                inputMode="numeric"
                placeholder="3"
                value={values.credits}
                error={errors.credits}
                onChange={(event) => update('credits', event.target.value.replace(/\D/g, ''))}
              />
              <InputField
                label="AKTS"
                inputMode="numeric"
                placeholder="5"
                value={values.ects}
                error={errors.ects}
                onChange={(event) => update('ects', event.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
              <Button type="submit" className="px-4 py-2.5 text-[12px]">
                <BookPlus className="h-4 w-4" aria-hidden />
                Dersi Tanımla
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                className="px-4 py-2.5 text-[12px]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Formu temizle
              </Button>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-4">
            <div>
              <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                Tanımlı dersler
              </h2>
              <p className="mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                Bu panelden eklenen dersler ve demo başlangıç kayıtları
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">
              {items.length} ders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] border-collapse text-left">
              <thead>
                <tr className="border-y border-slate-200/70 bg-slate-50/60 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-500">
                  <th scope="col" className="px-4 py-2.5">
                    Kod
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Ders
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Akademisyen
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center">
                    Kredi / AKTS
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center">
                    Kontenjan
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Dönem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90 dark:divide-white/[0.05]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[10px] text-slate-400 dark:text-slate-500">
                      Henüz ders tanımı yok.
                    </td>
                  </tr>
                ) : (
                  items.map((course) => (
                    <tr
                      key={course.id}
                      className="transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-2.5">
                        <span className="inline-flex rounded-lg bg-brand-500/10 px-1.5 py-1 font-display text-[9px] font-bold tracking-[0.03em] text-brand-600 dark:text-brand-300">
                          {course.code}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                          {course.name}
                        </p>
                        <p className="mt-0.5 text-[8.5px] text-slate-400 dark:text-slate-500">
                          {course.department}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-[9.5px] text-slate-500 dark:text-slate-400">
                        {course.instructor}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                        {course.credits} / {course.ects}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                        {course.quota}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[9px] text-slate-500 dark:text-slate-400">
                        {course.term}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="border-t border-slate-200/60 px-4 py-2.5 text-[9px] leading-relaxed text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
            Öğrenci panelindeki mevcut ders kodları da benzersizlik kontrolüne dahil edilir.
          </p>
        </Card>
      </div>
    </div>
  );
}
