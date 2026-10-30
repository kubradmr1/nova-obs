import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Notice';
import { TextField } from '@/components/ui/TextField';
import { getHomePath } from '@/config/roles';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import type { MessageKey } from '@/i18n/messages';
import type { Role } from '@/types/auth';
import { resolveErrorMessage } from '@/utils/authErrors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

const ROLE_LABEL_KEYS: Record<Role, MessageKey> = {
  student: 'role.student.label',
  academic: 'role.academic.label',
  admin: 'role.admin.label',
};

const EMAIL_PLACEHOLDERS: Record<Role, string> = {
  student: 'ad.soyad@ogr.uni.edu.tr',
  academic: 'ad.soyad@uni.edu.tr',
  admin: 'yonetici@uni.edu.tr',
};

type Step = 'email' | 'code';

export function OtpLoginForm({ role }: { role: Role }) {
  const { sendOtp, verifyOtp, logout } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const normalized = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(normalized)) {
      setEmailError(t('otp.invalidEmail'));
      return;
    }

    setEmailError(null);
    setCodeError(null);
    setFormError(null);
    setNotice(null);
    setIsSending(true);

    try {
      await sendOtp(normalized);
      setEmail(normalized);
      setStep('code');
      setCode('');
      setCooldown(RESEND_SECONDS);
      setNotice(t('otp.codeSent', { email: normalized }));
    } catch (error) {
      setFormError(resolveErrorMessage(error, t, 'otp.sendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (code.length !== CODE_LENGTH) {
      setCodeError(t('otp.codeLength'));
      return;
    }

    setCodeError(null);
    setFormError(null);
    setIsVerifying(true);

    try {
      const session = await verifyOtp(email, code);

      if (role === 'academic' && session.role !== 'academic') {
        await logout();
        throw new Error(t('otp.role.academic'));
      }

      if (role === 'admin' && session.role !== 'admin') {
        await logout();
        throw new Error(t('otp.role.admin'));
      }

      navigate(getHomePath(session.role), { replace: true });
    } catch (error) {
      setFormError(resolveErrorMessage(error, t, 'otp.verifyFailed'));
    } finally {
      setIsVerifying(false);
    }
  };

  const changeEmail = () => {
    setStep('email');
    setCode('');
    setCodeError(null);
    setFormError(null);
    setNotice(null);
    setCooldown(0);
  };

  if (step === 'email') {
    return (
      <form onSubmit={requestCode} noValidate className="space-y-3.5">
        <TextField
          label={t('otp.emailLabel')}
          icon={Mail}
          type="email"
          placeholder={EMAIL_PLACEHOLDERS[role]}
          autoComplete="email"
          inputMode="email"
          maxLength={160}
          value={email}
          error={emailError ?? undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(null);
            setFormError(null);
          }}
          autoFocus
        />

        <p className="flex items-start gap-2 rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2.5 text-[10.5px] leading-relaxed text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden />
          {t('otp.emailHint')}
        </p>

        {formError ? <Notice tone="danger">{formError}</Notice> : null}
        {notice ? <Notice tone="info">{notice}</Notice> : null}

        <Button
          type="submit"
          isLoading={isSending}
          loadingLabel={t('otp.sending')}
          className="w-full"
        >
          {t('otp.send')}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        </Button>

        <p className="text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t('otp.autoAccount', { role: t(ROLE_LABEL_KEYS[role]).toLocaleLowerCase(locale) })}
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} noValidate className="space-y-3.5">
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-200/60 bg-brand-50/60 px-3 py-2.5 dark:border-brand-400/20 dark:bg-brand-500/10">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-300">
          <Mail className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-300">
            {t('otp.sentTitle')}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
            {email}
          </p>
        </div>
        <button
          type="button"
          onClick={changeEmail}
          className="shrink-0 rounded-lg px-1.5 py-1 text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
        >
          {t('otp.change')}
        </button>
      </div>

      <TextField
        label={t('otp.codeLabel')}
        icon={KeyRound}
        type="text"
        placeholder="000000"
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={CODE_LENGTH}
        value={code}
        error={codeError ?? undefined}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
          setCode(digits);
          setCodeError(null);
          setFormError(null);
        }}
        className="tracking-[0.45em]"
        autoFocus
      />

      {notice ? <Notice tone="info">{notice}</Notice> : null}
      {formError ? <Notice tone="danger">{formError}</Notice> : null}

      <Button
        type="submit"
        isLoading={isVerifying}
        loadingLabel={t('otp.verifying')}
        className="w-full"
      >
        {t('otp.verify')}
        <ShieldCheck className="h-4 w-4" aria-hidden />
      </Button>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={changeEmail}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t('otp.changeEmail')}
        </button>

        <button
          type="button"
          onClick={() => void requestCode()}
          disabled={cooldown > 0 || isSending}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-600 transition-colors hover:text-brand-500 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-brand-300 dark:hover:text-brand-200 dark:disabled:text-slate-500"
        >
          <RefreshCw className={isSending ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} aria-hidden />
          {cooldown > 0
            ? t('otp.resendIn', { seconds: cooldown })
            : t('otp.resend')}
        </button>
      </div>
    </form>
  );
}
