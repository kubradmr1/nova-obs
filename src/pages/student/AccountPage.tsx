import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CloudCog,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField } from '@/components/ui/FormFields';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { findAcademicianByName } from '@/data/academicians';
import { STUDENT } from '@/data/student';
import { useAuth } from '@/hooks/useAuth';
import { formatGpa } from '@/utils/grading';

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  repeatPassword?: string;
}

const PROFILE_FIELDS = [
  { label: 'E-posta', value: STUDENT.email, icon: Mail },
  { label: 'Telefon', value: STUDENT.phone, icon: Phone },
  { label: 'Fakülte', value: STUDENT.faculty, icon: GraduationCap },
  { label: 'Bölüm', value: STUDENT.department, icon: CloudCog },
  { label: 'Program', value: STUDENT.program, icon: CloudCog },
  { label: 'Kayıt yılı', value: STUDENT.enrolledAt, icon: CalendarDays },
];

export function AccountPage() {
  const { session } = useAuth();
  const advisor = findAcademicianByName(STUDENT.advisor);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  const name = session?.name ?? STUDENT.name;
  const identifier = session?.identifier ?? STUDENT.identifier;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setRepeatPassword('');
    setErrors({});
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: PasswordErrors = {};

    if (currentPassword.length < 6) {
      nextErrors.currentPassword = 'Mevcut şifreni gir (en az 6 karakter).';
    }

    if (newPassword.length < 6) {
      nextErrors.newPassword = 'Yeni şifre en az 6 karakter olmalı.';
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = 'Yeni şifre mevcut şifrenden farklı olmalı.';
    }

    if (repeatPassword !== newPassword || repeatPassword.length === 0) {
      nextErrors.repeatPassword = 'Yeni şifre ile tekrarı eşleşmiyor.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice(null);
      return;
    }

    setNotice(
      'Şifre değişikliği talebin alındı. Demo ortamında şifreler saklanmadığı için oturumun aynı kalıyor.',
    );
    resetForm();
  };

  return (
    <div className="animate-rise space-y-4">
      <PageHeader
        eyebrow="Kullanıcı İşlemleri"
        title="Profil & Güvenlik"
        description="Kayıt bilgilerini, danışmanını ve oturum güvenliği ayarlarını tek ekrandan yönet."
        actions={
          <Link
            to="/panel/mesajlar"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/70 px-3.5 py-2 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:border-white/25 dark:hover:text-white"
          >
            Danışmana yaz
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />

      {notice ? (
        <Notice tone="success" title="Güvenlik güncellemesi">
          {notice}
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.12fr_1fr]">
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(56,189,248,0.1)_55%,rgba(168,85,247,0.12))] px-4 py-4 sm:px-5">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-brand-400/25 blur-3xl"
            />
            <div className="relative flex flex-wrap items-center gap-3">
              <Avatar name={name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="font-display text-[18px] font-bold tracking-tight text-slate-900 dark:text-white">
                    {name}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                    <BadgeCheck className="h-2.5 w-2.5" aria-hidden />
                    Aktif
                  </span>
                </div>
                <p className="mt-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                  {identifier} · {STUDENT.classYear} · {STUDENT.term}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-lg bg-white/70 px-1.5 py-0.5 text-[9px] font-semibold text-brand-700 backdrop-blur dark:bg-white/[0.08] dark:text-brand-200">
                  <CloudCog className="h-3 w-3" aria-hidden />
                  Bulut Bilişim Operatörlüğü
                </p>
              </div>
              <div className="flex gap-2">
                <div className="rounded-xl border border-white/70 bg-white/60 px-2.5 py-1.5 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    GANO
                  </p>
                  <p className="text-[13px] font-bold text-slate-800 dark:text-white">
                    {formatGpa(STUDENT.cumulativeGpa)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white/60 px-2.5 py-1.5 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    AKTS
                  </p>
                  <p className="text-[13px] font-bold text-slate-800 dark:text-white">
                    {STUDENT.completedEcts}/{STUDENT.totalEcts}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 p-4 sm:grid-cols-2 sm:p-5">
            {PROFILE_FIELDS.map((field) => {
              const Icon = field.icon;

              return (
                <div key={field.label} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-500/8 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      {field.label}
                    </dt>
                    <dd className="mt-0.5 break-words text-[11px] font-medium leading-snug text-slate-700 dark:text-slate-200">
                      {field.value}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>

          <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-200/70 p-4 dark:border-white/[0.07] sm:p-5">
            <Avatar name={STUDENT.advisor} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
                Danışman Akademisyen
              </p>
              <p className="text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                {STUDENT.advisor}
              </p>
              <p className="mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                {advisor?.department ?? STUDENT.department} · Ofis {advisor?.office ?? 'V-204'} ·{' '}
                {advisor?.officeHours ?? 'Salı 14.00 – 16.00'}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <KeyRound className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">
                  Şifre değiştir
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  Güçlü bir şifre için en az 6 karakter, bir harf ve bir rakam kullan.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
              <InputField
                label="Mevcut şifre"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={currentPassword}
                error={errors.currentPassword}
                onChange={(event) => {
                  setCurrentPassword(event.target.value);
                  setErrors((current) => ({ ...current, currentPassword: undefined }));
                  setNotice(null);
                }}
              />
              <InputField
                label="Yeni şifre"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                error={errors.newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setErrors((current) => ({ ...current, newPassword: undefined }));
                  setNotice(null);
                }}
              />
              <InputField
                label="Yeni şifre (tekrar)"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={repeatPassword}
                error={errors.repeatPassword}
                onChange={(event) => {
                  setRepeatPassword(event.target.value);
                  setErrors((current) => ({ ...current, repeatPassword: undefined }));
                  setNotice(null);
                }}
              />

              <div className="flex flex-wrap gap-2 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.07]">
                <Button type="submit" className="px-4 py-2.5 text-[12px]">
                  <LockKeyhole className="h-4 w-4" aria-hidden />
                  Şifreyi Güncelle
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-4 py-2.5 text-[12px]"
                  onClick={() => {
                    resetForm();
                    setNotice(null);
                  }}
                >
                  Temizle
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                  Oturum güvenliği
                </h2>
                <p className="mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                  Hesabına bağlı güvenlik önlemleri
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500 dark:text-emerald-300" aria-hidden />
            </div>

            <ul className="mt-3 space-y-2">
              {[
                { label: 'İki adımlı doğrulama', value: 'Demo modunda kapalı' },
                { label: 'Son giriş', value: 'Bu oturum · Chrome · Windows' },
                { label: 'Kayıtlı cihaz', value: '1 cihaz' },
                { label: 'KVKK aydınlatma metni', value: 'Onaylandı' },
              ].map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-2.5 py-2 text-[10px] dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <span className="font-medium text-slate-500 dark:text-slate-400">{row.label}</span>
                  <span className="text-right font-semibold text-slate-700 dark:text-slate-200">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
              <UserCog className="mt-px h-3 w-3 shrink-0" aria-hidden />
              Profil bilgileri öğrenci işleri tarafından güncellenir. Değişiklik için Formlar &amp;
              Belgeler ekranından dilekçe oluşturabilirsin.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
