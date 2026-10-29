import { RotateCcw, UserCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField, SelectField } from '@/components/ui/FormFields';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  ACADEMIC_TITLES,
  ACADEMICIANS_STORAGE_KEY,
  FACULTIES,
  SEED_ACADEMICIANS,
  SEED_STUDENTS,
  STUDENTS_STORAGE_KEY,
  departmentsFor,
} from '@/data/admin';
import { useStoredList } from '@/hooks/useStoredList';
import type { RegisteredAcademician } from '@/types/admin';
import { readCollection } from '@/utils/storage';

interface AcademicianFormState {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  faculty: string;
  department: string;
  office: string;
  phone: string;
}

type AcademicianFormErrors = Partial<Record<keyof AcademicianFormState, string>>;

function createEmptyForm(): AcademicianFormState {
  return {
    title: 'Dr. Öğr. Üyesi',
    firstName: '',
    lastName: '',
    email: '',
    faculty: '',
    department: '',
    office: '',
    phone: '',
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AcademicianRegistrationPage() {
  const { items, add } = useStoredList<RegisteredAcademician>(
    ACADEMICIANS_STORAGE_KEY,
    SEED_ACADEMICIANS,
  );
  const [values, setValues] = useState<AcademicianFormState>(createEmptyForm);
  const [errors, setErrors] = useState<AcademicianFormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  const update = (field: keyof AcademicianFormState, value: string) => {
    setValues((current) => {
      if (field === 'faculty') {
        return { ...current, faculty: value, department: '' };
      }

      return { ...current, [field]: value };
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  };

  const validate = (): AcademicianFormErrors => {
    const next: AcademicianFormErrors = {};
    const students = readCollection(STUDENTS_STORAGE_KEY, SEED_STUDENTS);

    if (!values.title) {
      next.title = 'Unvan seçimi zorunlu.';
    }

    if (values.firstName.trim().length < 2) {
      next.firstName = 'Ad en az 2 karakter olmalı.';
    }

    if (values.lastName.trim().length < 2) {
      next.lastName = 'Soyad en az 2 karakter olmalı.';
    }

    if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = 'Geçerli bir kurumsal e-posta gir.';
    } else if (
      items.some(
        (academician) => academician.email.toLowerCase() === values.email.trim().toLowerCase(),
      ) ||
      students.some(
        (student) => student.email.toLowerCase() === values.email.trim().toLowerCase(),
      )
    ) {
      next.email = 'Bu e-posta adresi sistemde kayıtlı.';
    }

    if (!values.faculty) {
      next.faculty = 'Fakülte seçimi zorunlu.';
    }

    if (!values.department) {
      next.department = 'Bölüm seçimi zorunlu.';
    }

    if (values.office.trim().length < 2) {
      next.office = 'Ofis bilgisi zorunlu (örn. D-310).';
    }

    const phoneDigits = values.phone.replace(/\D/g, '');

    if (phoneDigits.length > 0 && (phoneDigits.length < 10 || phoneDigits.length > 11)) {
      next.phone = 'Telefon 10–11 haneli olmalı (isteğe bağlı).';
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

    const fullName = `${values.title} ${values.firstName.trim()} ${values.lastName.trim()}`;

    add({
      id: `academician-${Date.now().toString(36)}`,
      title: values.title,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      faculty: values.faculty,
      department: values.department,
      office: values.office.trim(),
      phone: values.phone.trim(),
    });

    setNotice(
      `${fullName} kaydı oluşturuldu. Kurumsal e-posta hesabı ve ders atama yetkisi aktifleştirildi.`,
    );
    setValues(createEmptyForm());
    setErrors({});
  };

  const handleReset = () => {
    setValues(createEmptyForm());
    setErrors({});
    setNotice(null);
  };

  const latestAcademicians = items.slice(0, 5);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Yönetim Paneli"
        title="Yeni Akademisyen Kaydı"
        description="Akademik kadroya yeni bir kullanıcı ekle. Kurumsal e-posta adresi benzersiz olmalı ve bölüm bilgisiyle birlikte kaydedilir."
      />

      {notice ? (
        <Notice tone="success" title="Kayıt tamamlandı">
          {notice}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1fr]">
        <Card className="p-4">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
              <UserCheck className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                Akademisyen bilgileri
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                Unvan, birim ve iletişim bilgilerini girerek kayıt oluştur.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <section className="space-y-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Kişisel bilgiler
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Unvan"
                  options={ACADEMIC_TITLES}
                  value={values.title}
                  error={errors.title}
                  onChange={(event) => update('title', event.target.value)}
                />
                <InputField
                  label="Kurumsal E-posta"
                  type="email"
                  placeholder="ad.soyad@uni.edu.tr"
                  autoComplete="off"
                  value={values.email}
                  error={errors.email}
                  onChange={(event) => update('email', event.target.value)}
                />
                <InputField
                  label="Ad"
                  placeholder="Burak"
                  autoComplete="off"
                  value={values.firstName}
                  error={errors.firstName}
                  onChange={(event) => update('firstName', event.target.value)}
                />
                <InputField
                  label="Soyad"
                  placeholder="Şen"
                  autoComplete="off"
                  value={values.lastName}
                  error={errors.lastName}
                  onChange={(event) => update('lastName', event.target.value)}
                />
                <InputField
                  label="Ofis"
                  placeholder="D-312"
                  autoComplete="off"
                  value={values.office}
                  error={errors.office}
                  onChange={(event) => update('office', event.target.value)}
                />
                <InputField
                  label="Telefon (isteğe bağlı)"
                  type="tel"
                  placeholder="0312 000 00 00"
                  autoComplete="off"
                  value={values.phone}
                  error={errors.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Birim bilgileri
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
              </div>
            </section>

            <div className="flex flex-wrap gap-2 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
              <Button type="submit" className="px-4 py-2.5 text-[12px]">
                <UserCheck className="h-4 w-4" aria-hidden />
                Akademisyeni Kaydet
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
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold text-sky-600 dark:text-sky-300">
              Toplam {items.length}
            </span>
          </div>

          <ul className="mt-2 divide-y divide-slate-200/60 dark:divide-white/[0.06]">
            {latestAcademicians.length === 0 ? (
              <li className="py-8 text-center text-[10px] text-slate-400 dark:text-slate-500">
                Henüz akademisyen kaydı yok.
              </li>
            ) : (
              latestAcademicians.map((academician) => {
                const fullName = `${academician.title} ${academician.firstName} ${academician.lastName}`;

                return (
                  <li key={academician.id} className="flex items-start gap-2.5 py-2.5">
                    <Avatar name={fullName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {fullName}
                      </p>
                      <p className="truncate text-[9px] text-slate-400 dark:text-slate-500">
                        {academician.department} · Ofis {academician.office}
                      </p>
                      <p className="mt-0.5 truncate text-[8.5px] text-slate-400 dark:text-slate-500">
                        {academician.email}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <p className="mt-3 border-t border-slate-200/60 pt-2.5 text-[9px] leading-relaxed text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
            Yeni kayıtların görüşme saatleri ve ders atamaları, ilgili bölüm yöneticisi tarafından
            güncellenebilir.
          </p>
        </Card>
      </div>
    </div>
  );
}
