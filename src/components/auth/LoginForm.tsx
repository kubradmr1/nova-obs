import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Hash,
  Info,
  KeyRound,
  Landmark,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { getHomePath, getRole } from '@/config/roles';
import { useAuth } from '@/hooks/useAuth';
import type { LoginCredentials, Role } from '@/types/auth';
import { cx } from '@/utils/cx';
import { validateLogin, type LoginErrors } from '@/utils/validation';

interface LoginFormProps {
  role: Role;
}

export function LoginForm({ role }: LoginFormProps) {
  const definition = getRole(role);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<LoginCredentials>({ identifier: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const IdentifierIcon =
    role === 'student' ? Hash : role === 'academic' ? Mail : UserRound;

  const updateValue = (field: keyof LoginCredentials, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const fillDemoCredentials = () => {
    setValues(definition.demo);
    setErrors({});
    setFormError(null);
    setShowPassword(false);
    setRemember(true);
    setNotice(`${definition.label} için demo bilgileri dolduruldu.`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateLogin(role, values);
    setErrors(nextErrors);
    setNotice(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await login(role, values, remember);
      navigate(getHomePath(role), { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Giriş yapılamadı, lütfen tekrar dene.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      <TextField
        label={definition.identifierLabel}
        icon={IdentifierIcon}
        placeholder={definition.identifierPlaceholder}
        autoComplete={role === 'academic' ? 'email' : 'username'}
        inputMode={role === 'student' ? 'numeric' : 'text'}
        maxLength={120}
        value={values.identifier}
        error={errors.identifier}
        onChange={(event) => updateValue('identifier', event.target.value)}
      />

      <TextField
        label="Şifre"
        icon={KeyRound}
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        autoComplete="current-password"
        value={values.password}
        error={errors.password}
        onChange={(event) => updateValue('password', event.target.value)}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        }
      />

      <div className="flex items-center justify-between gap-3 pt-1">
        <label className="flex cursor-pointer items-center gap-2.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="peer sr-only"
          />
          <span
            className={cx(
              'flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-all duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/15',
              remember
                ? 'border-transparent bg-[linear-gradient(135deg,#7c5cff,#5f6bff)] text-white'
                : 'border-slate-300 bg-white dark:border-white/15 dark:bg-white/5',
            )}
          >
            {remember ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : null}
          </span>
          Beni hatırla
        </label>

        <button
          type="button"
          onClick={() =>
            setNotice(
              'Şifre sıfırlama bağlantısı demo sürümünde gönderilmiyor. Demo bilgilerini doldurarak giriş yapabilirsin.',
            )
          }
          className="rounded-md text-[12px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
        >
          Şifremi unuttum
        </button>
      </div>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200/70 bg-rose-50/80 px-3 py-2.5 text-[11px] font-medium leading-relaxed text-rose-600 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {formError}
        </div>
      ) : null}

      {notice ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
        >
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden />
          {notice}
        </p>
      ) : null}

      <Button
        type="submit"
        isLoading={isSubmitting}
        loadingLabel="Giriş yapılıyor…"
        className="w-full"
      >
        Giriş Yap
        <ArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        />
      </Button>

      <div className="flex items-center gap-3 py-0.5">
        <span className="h-px flex-1 bg-slate-200/90 dark:bg-white/10" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          veya
        </span>
        <span className="h-px flex-1 bg-slate-200/90 dark:bg-white/10" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() =>
          setNotice(
            'e-Devlet entegrasyonu demo sürümünde devre dışıdır. Demo bilgilerini doldurarak devam edebilirsin.',
          )
        }
      >
        <Landmark className="h-4 w-4" aria-hidden />
        e-Devlet ile Giriş
      </Button>

      <button
        type="button"
        onClick={fillDemoCredentials}
        className="mx-auto flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Demo bilgilerini doldur
      </button>
    </form>
  );
}
