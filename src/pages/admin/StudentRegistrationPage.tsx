import { RotateCcw, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  ACADEMICIANS_STORAGE_KEY,
  CLASS_YEARS,
  FACULTIES,
  SEED_ACADEMICIANS,
  SEED_STUDENTS,
  STUDENTS_STORAGE_KEY,
  departmentsFor,
} from '@/data/admin';
import { useStoredList } from '@/hooks/useStoredList';
import type { RegisteredStudent } from '@/types/admin';
import { readCollection } from '@/utils/storage';

interface StudentFormState {
  firstName: string;
  lastName: string;
  studentNumber: string;
  faculty: string;
  department: string;
  classYear: string;
  email: string;
  phone: string;
  enrolledAt: string;
}

type StudentFormErrors = Partial<Record<keyof StudentFormState, string>>;

function createEmptyForm(): StudentFormState {
  return {
    firstName: '',
    lastName: '',
    studentNumber: '',
    faculty: '',
    department: '',
    classYear: '1. Sınıf',
    email: '',
    phone: '',
    enrolledAt: String(new Date().getFullYear()),
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StudentRegistrationPage() {
  const { items, add } = useStoredList<RegisteredStudent>(
    STUDENTS_STORAGE_KEY,
    SEED_STUDENTS,
  );
  const [values, setValues] = useState<StudentFormState>(createEmptyForm);
  const [errors, setErrors] = useState<StudentFormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  const update = (field: keyof StudentFormState, value: string) => {
    setValues((current) => {
      if (field === 'faculty') {
        return { ...current, faculty: value, department: '' };
      }

      return { ...current, [field]: value };
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  };

  const validate = (): StudentFormErrors => {
    const next: StudentFormErrors = {};
    const academicians = readCollection(ACADEMICIANS_STORAGE_KEY, SEED_ACADEMICIANS);

    if (values.firstName.trim().length < 2) {
      next.firstName = 'Ad en az 2 karakter olmalı.';
    }

    if (values.lastName.trim().length < 2) {
      next.lastName = 'Soyad en az 2 karakter olmalı.';
    }

    if (!/^\d{8,10}$/.test(values.studentNumber.trim())) {
      next.studentNumber = '8–10 haneli bir öğrenci numarası gir.';
    } else if (items.some((student) => student.studentNumber === values.studentNumber.trim())) {
      next.studentNumber = 'Bu öğrenci numarası zaten kayıtlı.';
    }

    if (!values.faculty) {
      next.faculty = 'Fakülte seçimi zorunlu.';
    }

    if (!values.department) {
      next.department = 'Bölüm seçimi zorunlu.';
    }

    if (!values.classYear) {
      next.classYear = 'Sınıf seçimi zorunlu.';
    }

    if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = 'Geçerli bir e-posta adresi gir.';
    } else if (
      items.some((student) => student.email.toLowerCase() === values.email.trim().toLowerCase()) ||
      academicians.some(
        (academician) => academician.email.toLowerCase() === values.email.trim().toLowerCase(),
      )
    ) {
      next.email = 'Bu e-posta adresi sistemde kayıtlı.';
    }

    const phoneDigits = values.phone.replace(/\D/g, '');

    if (phoneDigits.length > 0 && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
      next.phone = 'Telefon 10–11 haneli olmalı (isteğe bağlı).';
    }

    const year = Number(values.enrolledAt);

    if (
      !/^\d{4}$/.test(values.enrolledAt.trim()) ||
      year < 2000 ||
      year > new Date().getFullYear() + 1
    ) {
      next.enrolledAt = 'Geçerli bir kayıt yılı gir.';
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

    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`;

    add({
      id: `student-${Date.now().toString(36)}`,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      studentNumber: values.studentNumber.trim(),
      faculty: values.faculty,
      department: values.department,
      classYear: values.classYear,
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      enrolledAt: values.enrolledAt.trim(),
    });

    setNotice(
      `${fullName} (${values.studentNumber.trim()}) kaydı oluşturuldu. Giriş bilgileri öğrenci e-postasına iletilir.`,
    );
    setValues(createEmptyForm());
    setErrors({});
  };

  const handleReset = () => {
    setValues(createEmptyForm());
    setErrors({});
    setNotice(null);
  };

  const latestStudents = items.slice(0, 5);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Yönetim Paneli"
        title="Yeni Öğrenci Kaydı"
        description="Öğrencinin kimlik, iletişim ve akademik bilgilerini girerek sisteme kaydet. Kayıt numarası benzersiz olmalıdır."
      />

      {notice ? (
        <Notice tone="success" title="Kayıt tamamlandı">
          {notice}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1fr]">
        <Card className="p-4">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <UserPlus className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                Öğrenci bilgileri
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                Zorunlu alanları doldurarak yeni kayıt oluştur.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <section className="space-y-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Kişisel bilgiler
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <InputField
                  label="Ad"
                  placeholder="Zeynep"
                  autoComplete="off"
                  value={values.firstName}
                  error={errors.firstName}
                  onChange={(event) => update('firstName', event.target.value)}
                />
                <InputField
                  label="Soyad"
                  placeholder="Kaya"
                  autoComplete="off"
                  value={values.lastName}
                  error={errors.lastName}
                  onChange={(event) => update('lastName', event.target.value)}
                />
                <InputField
                  label="Öğrenci Numarası"
                  placeholder="2026001234"
                  inputMode="numeric"
                  maxLength={10}
                  value={values.studentNumber}
                  error={errors.studentNumber}
                  onChange={(event) => update('studentNumber', event.target.value.replace(/\D/g, ''))}
                />
                <InputField
                  label="Kayıt Yılı"
                  placeholder="2026"
                  inputMode="numeric"
                  maxLength={4}
                  value={values.enrolledAt}
                  error={errors.enrolledAt}
                  onChange={(event) => update('enrolledAt', event.target.value.replace(/\D/g, ''))}
                />
                <InputField
                  label="E-posta"
                  type="email"
                  placeholder="ad.soyad@ogr.uni.edu.tr"
                  autoComplete="off"
                  value={values.email}
                  error={errors.email}
                  onChange={(event) => update('email', event.target.value)}
                />
                <InputField
                  label="Telefon (isteğe bağlı)"
                  type="tel"
                  placeholder="0532 000 00 00"
                  autoComplete="off"
                  value={values.phone}
                  error={errors.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Akademik bilgiler
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
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
                  label="Sınıf"
                  options={CLASS_YEARS}
                  value={values.classYear}
                  error={errors.classYear}
                  onChange={(event) => update('classYear', event.target.value)}
                />
              </div>
            </section>

            <div className="flex flex-wrap gap-2 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
              <Button type="submit" className="px-4 py-2.5 text-[12px]">
                <UserPlus className="h-4 w-4" aria-hidden />
                Öğrenciyi Kaydet
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

        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              Son kayıtlar
            </h2>
            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-300">
              Toplam {items.length}
            </span>
          </div>

          <ul className="mt-2 divide-y divide-slate-200/60 dark:divide-white/[0.06]">
            {latestStudents.length === 0 ? (
              <li className="py-8 text-center text-[10px] text-slate-400 dark:text-slate-500">
                Henüz öğrenci kaydı yok.
              </li>
            ) : (
              latestStudents.map((student) => {
                const fullName = `${student.firstName} ${student.lastName}`;

                return (
                  <li key={student.id} className="flex items-start gap-2.5 py-2.5">
                    <Avatar name={fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {fullName}
                      </p>
                      <p className="truncate text-[9px] text-slate-400 dark:text-slate-500">
                        {student.studentNumber} · {student.department}
                      </p>
                      <p className="mt-0.5 truncate text-[8.5px] text-slate-400 dark:text-slate-500">
                        {student.email}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-semibold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                      {student.classYear}
                    </span>
                  </li>
                );
              })
            )}
          </ul>

          <p className="mt-3 border-t border-slate-200/60 pt-2.5 text-[9px] leading-relaxed text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
            Kayıtlar bu tarayıcıda saklanır. Yeni kayıtlar listenin en üstünde görünür.
          </p>
        </Card>
      </div>
    </div>
  );
}
