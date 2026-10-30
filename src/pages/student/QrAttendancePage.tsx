import {
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  GraduationCap,
  Keyboard,
  QrCode as QrCodeIcon,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { QrScanner, type ScannerError } from '@/components/attendance/QrScanner';
import { SignaturePad } from '@/components/attendance/SignaturePad';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { STUDENT } from '@/data/student';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useNow } from '@/hooks/useNow';
import { attendanceService, findJoinTarget, joinBlockReason } from '@/services/attendance';
import { parseQrPayload, sessionCodeAt } from '@/services/attendance/code';
import type {
  AttendanceParticipant,
  AttendanceSession,
  JoinFailureReason,
} from '@/types/attendance';
import { cx } from '@/utils/cx';

type Step = 'scan' | 'sign' | 'done';

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const STEP_KEYS = ['attendance.step.scan', 'attendance.step.sign', 'attendance.step.done'] as const;

export function QrAttendancePage() {
  const { session } = useAuth();
  const { t, formatDate, formatTime } = useI18n();
  const now = useNow(1000);
  const sessions = useAttendance();

  const isDemo = session?.provider !== 'supabase';
  const studentId =
    session?.provider === 'supabase'
      ? session.profileId ?? session.identifier
      : session?.identifier ?? STUDENT.identifier;
  const studentNumber = session?.identifier ?? STUDENT.identifier;
  const studentName = session?.name ?? STUDENT.name;

  const [step, setStep] = useState<Step>('scan');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannerError, setScannerError] = useState<ScannerError | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ session: AttendanceSession; code: string } | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState<{
    session: AttendanceSession;
    participant: AttendanceParticipant;
  } | null>(null);
  const [historySignature, setHistorySignature] = useState<AttendanceParticipant | null>(null);

  const reasonMessage = useCallback(
    (reason: JoinFailureReason): string => {
      switch (reason) {
        case 'duplicate':
          return t('attendance.alreadySigned');
        case 'not-enrolled':
          return t('attendance.notEnrolled');
        case 'expired':
          return t('attendance.expiredNotice');
        case 'closed':
          return t('attendance.closedNotice');
        case 'signature-required':
          return t('attendance.signatureRequired');
        default:
          return t('attendance.codeInvalid');
      }
    },
    [t],
  );

  const verifyTarget = useCallback(
    (sessionId: string | undefined, code: string) => {
      const nowMs = Date.now();
      const target = findJoinTarget(sessions, { sessionId, code, nowMs });

      if (!target) {
        setError(t('attendance.codeInvalid'));
        return;
      }

      const blocked = joinBlockReason(target, {
        code,
        studentId,
        studentNumber,
        nowMs,
      });

      if (blocked) {
        setError(reasonMessage(blocked));
        return;
      }

      setPending({ session: target, code: code.trim().toUpperCase() });
      setSignature(null);
      setError(null);
      setScannerError(null);
      setIsCameraOpen(false);
      setStep('sign');
    },
    [sessions, studentId, studentNumber, t, reasonMessage],
  );

  const handleDetected = useCallback(
    (raw: string) => {
      const parsed = parseQrPayload(raw);

      if (!parsed) {
        setError(t('attendance.codeInvalid'));
        setIsCameraOpen(false);
        return;
      }

      verifyTarget(parsed.sessionId, parsed.code);
    },
    [t, verifyTarget],
  );

  const handleScannerError = useCallback((reason: ScannerError) => {
    setScannerError(reason);
    setIsCameraOpen(false);
  }, []);

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = manualCode.trim().toUpperCase();

    if (normalized.length !== 6) {
      setError(t('attendance.codeInvalid'));
      return;
    }

    verifyTarget(undefined, normalized);
  };

  const handleSubmitSignature = async () => {
    if (!pending || isSubmitting) {
      return;
    }

    if (!signature) {
      setError(t('attendance.signatureRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await attendanceService.joinSession({
        sessionId: pending.session.id,
        code: pending.code,
        studentId,
        studentNumber,
        studentName,
        signature,
      });

      if (result.ok) {
        const participant = result.session.participants.find(
          (item) => item.studentId === studentId || item.studentNumber === studentNumber,
        );

        setCompleted({ session: result.session, participant: participant ?? {
          studentId,
          studentNumber,
          studentName,
          signedAt: new Date().toISOString(),
          signature,
          code: pending.code,
        } });
        setSignature(null);
        setManualCode('');
        setPending(null);
        setStep('done');
        return;
      }

      setError(reasonMessage(result.reason));

      if (result.reason !== 'duplicate' && result.reason !== 'not-enrolled') {
        setPending(null);
        setStep('scan');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep('scan');
    setPending(null);
    setSignature(null);
    setError(null);
    setManualCode('');
    setIsCameraOpen(false);
    setScannerError(null);
    setCompleted(null);
  };

  const activeSessions = useMemo(
    () =>
      sessions.filter(
        (item) => item.status === 'active' && new Date(item.endsAt).getTime() > now,
      ),
    [sessions, now],
  );

  const history = useMemo(
    () =>
      sessions
        .flatMap((item) =>
          item.participants
            .filter(
              (participant) =>
                participant.studentId === studentId ||
                participant.studentNumber === studentNumber,
            )
            .map((participant) => ({ session: item, participant })),
        )
        .sort(
          (left, right) =>
            new Date(right.participant.signedAt).getTime() -
            new Date(left.participant.signedAt).getTime(),
        ),
    [sessions, studentId, studentNumber],
  );

  const activeStepIndex = step === 'scan' ? 0 : step === 'sign' ? 1 : 2;
  const pendingRemainingMs = pending
    ? Math.max(0, new Date(pending.session.endsAt).getTime() - now)
    : 0;
  const pendingExpired = Boolean(pending && pendingRemainingMs <= 0);

  const scannerMessage =
    scannerError === 'unsupported'
      ? t('attendance.scan.unsupported')
      : scannerError === 'permission'
        ? t('attendance.scan.permission')
        : scannerError === 'camera'
          ? t('attendance.scan.cameraError')
          : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('attendance.eyebrow')}
        title={t('attendance.student.title')}
        description={t('attendance.student.description')}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/[0.07]">
          <div className="flex items-center gap-2">
            {STEP_KEYS.map((key, index) => (
              <span key={key} className="flex items-center gap-2">
                <span
                  className={cx(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em] transition-colors',
                    index === activeStepIndex
                      ? 'bg-brand-500/12 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
                      : index < activeStepIndex
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                        : 'bg-slate-500/[0.08] text-slate-400 dark:bg-white/[0.06] dark:text-slate-500',
                  )}
                >
                  {index < activeStepIndex ? (
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                  ) : (
                    <span className="tabular-nums">{index + 1}</span>
                  )}
                  {t(key)}
                </span>
                {index < STEP_KEYS.length - 1 ? (
                  <span className="h-px w-4 bg-slate-200 dark:bg-white/10" aria-hidden />
                ) : null}
              </span>
            ))}
          </div>

          <p className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
            {studentName} · {studentNumber}
          </p>
        </div>

        <div className="p-5">
          {step === 'scan' ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-3">
                {isCameraOpen ? (
                  <div className="space-y-2">
                    <QrScanner onDetected={handleDetected} onError={handleScannerError} />
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={() => setIsCameraOpen(false)}
                        className="px-4 py-2 text-[11.5px]"
                      >
                        <CameraOff className="h-3.5 w-3.5" aria-hidden />
                        {t('attendance.scan.close')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setScannerError(null);
                      setError(null);
                      setIsCameraOpen(true);
                    }}
                    aria-label={t('attendance.scan.open')}
                    className="group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-brand-300/70 bg-[linear-gradient(140deg,rgba(124,92,255,0.08),rgba(56,189,248,0.06))] px-5 py-10 text-center transition-all duration-300 hover:border-brand-400 hover:shadow-[0_20px_44px_-30px_rgba(124,92,255,0.8)] dark:border-brand-400/25 dark:bg-brand-500/[0.06]"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-brand-600 shadow-sm dark:bg-white/[0.08] dark:text-brand-300">
                      <Camera className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="mt-3 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                      {t('attendance.scan.open')}
                    </span>
                    <span className="mt-1 max-w-[280px] text-[10.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {t('attendance.qrHint')}
                    </span>
                  </button>
                )}

                {scannerMessage ? <Notice tone="warning">{scannerMessage}</Notice> : null}
                {error ? <Notice tone="danger">{error}</Notice> : null}

                <form
                  onSubmit={handleManualSubmit}
                  className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.07] dark:bg-white/[0.03]"
                >
                  <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    <Keyboard className="h-3.5 w-3.5" aria-hidden />
                    {t('attendance.manualTitle')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      value={manualCode}
                      onChange={(event) => {
                        const value = event.target.value
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .toUpperCase()
                          .slice(0, 6);
                        setManualCode(value);
                        setError(null);
                      }}
                      aria-label={t('attendance.manualLabel')}
                      placeholder={t('attendance.manualPlaceholder')}
                      autoComplete="off"
                      spellCheck={false}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200/90 bg-white/90 px-3 font-mono text-[14px] font-bold uppercase tracking-[0.28em] text-slate-900 shadow-sm transition-all duration-200 placeholder:font-sans placeholder:text-[11px] placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-slate-600"
                    />
                    <Button type="submit" className="px-4 py-2.5 text-[12px]">
                      <ScanLine className="h-4 w-4" aria-hidden />
                      {t('attendance.manualSubmit')}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-brand-200/60 bg-[linear-gradient(140deg,rgba(124,92,255,0.08),rgba(56,189,248,0.05))] p-4 dark:border-brand-400/15 dark:bg-brand-500/[0.06]">
                  <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                    {t('attendance.details')}
                  </p>
                  <dl className="mt-2.5 space-y-1.5 text-[10.5px]">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-400 dark:text-slate-500">{t('attendance.studentNumber')}</dt>
                      <dd className="font-semibold text-slate-700 dark:text-slate-200">{studentNumber}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-[9.5px] leading-relaxed text-slate-400 dark:text-slate-500">
                    {t('attendance.courseRosterHint')}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      <QrCodeIcon className="h-3.5 w-3.5" aria-hidden />
                      {t('attendance.activeSessions')}
                    </p>
                    <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                      {activeSessions.length}
                    </span>
                  </div>

                  {activeSessions.length === 0 ? (
                    <p className="mt-2.5 text-[10.5px] leading-relaxed text-slate-400 dark:text-slate-500">
                      {t('attendance.noActiveSessions')}
                    </p>
                  ) : (
                    <ul className="mt-2.5 space-y-1.5">
                      {activeSessions.map((item) => {
                        const remaining = Math.max(
                          0,
                          new Date(item.endsAt).getTime() - now,
                        );

                        return (
                          <li
                            key={item.id}
                            className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-white/[0.07] dark:bg-white/[0.04]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                                  {item.courseCode} · {item.courseName}
                                </p>
                                <p className="mt-0.5 text-[9.5px] text-slate-400 dark:text-slate-500">
                                  {item.room} · {t('attendance.remaining', {
                                    time: formatCountdown(remaining),
                                  })}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  verifyTarget(item.id, sessionCodeAt(item, Date.now()))
                                }
                                className="shrink-0 rounded-lg px-2 py-1 text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                              >
                                {t('attendance.step.sign')}
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {isDemo ? (
                    <p className="mt-2 text-[9px] leading-relaxed text-slate-400 dark:text-slate-500">
                      {t('attendance.demoHint')}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {step === 'sign' && pending ? (
            <div className="mx-auto max-w-lg space-y-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">
                      {t('attendance.sessionFound')}
                    </p>
                    <p className="mt-1.5 truncate text-[13.5px] font-semibold text-slate-900 dark:text-white">
                      {pending.session.courseCode} · {pending.session.courseName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                      {pending.session.room} · {t('attendance.teacher')}: {pending.session.academicianName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-1.5 text-right dark:border-white/10 dark:bg-white/[0.05]">
                    <p className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                      <Clock className="h-2.5 w-2.5" aria-hidden />
                      {t('attendance.sessionTime')}
                    </p>
                    <p className="font-display text-[14px] font-bold tabular-nums text-slate-800 dark:text-white">
                      {formatCountdown(pendingRemainingMs)}
                    </p>
                  </div>
                </div>
              </div>

              {pendingExpired ? (
                <Notice tone="warning">{t('attendance.expiredNotice')}</Notice>
              ) : null}
              {error ? <Notice tone="danger">{error}</Notice> : null}

              <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {t('attendance.signaturePad')}
                </p>
                <div className="mt-2">
                  <SignaturePad
                    onChange={setSignature}
                    disabled={pendingExpired || isSubmitting}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  onClick={resetFlow}
                  className="px-3 py-2 text-[11.5px]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={() => void handleSubmitSignature()}
                  isLoading={isSubmitting}
                  loadingLabel={t('attendance.verifying')}
                  disabled={pendingExpired}
                  className="px-5 py-2.5 text-[12.5px]"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  {t('attendance.submitSignature')}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'done' && completed ? (
            <div className="mx-auto max-w-md space-y-3 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 className="h-7 w-7" aria-hidden />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-slate-900 dark:text-white">
                  {t('attendance.signatureSaved')}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {t('attendance.signatureSavedHint', {
                    course: `${completed.session.courseCode} · ${completed.session.courseName}`,
                    time: formatTime(completed.participant.signedAt),
                  })}
                </p>
              </div>

              <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <img
                  src={completed.participant.signature}
                  alt={t('attendance.signatureTitle')}
                  className="h-24 w-full object-contain"
                />
              </div>

              <Button onClick={resetFlow} variant="secondary" className="px-4 py-2.5 text-[12px]">
                <ScanLine className="h-4 w-4" aria-hidden />
                {t('attendance.scanAgain')}
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-5 py-3.5 dark:border-white/[0.07]">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t('attendance.history')}
          </p>
          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
            {t('attendance.historyCount', { count: history.length })}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <QrCodeIcon className="h-6 w-6 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {t('attendance.historyEmpty')}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-300 dark:text-slate-600">
              {t('attendance.historyHint')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
            {history.map((entry) => (
              <li
                key={`${entry.session.id}-${entry.participant.studentId}`}
                className="flex flex-wrap items-center gap-3 px-5 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                    {entry.session.courseCode} · {entry.session.courseName}
                  </p>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500">
                    {formatDate(entry.participant.signedAt, {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {formatTime(entry.participant.signedAt)} · {entry.session.room}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistorySignature(entry.participant)}
                  className="shrink-0 rounded-lg border border-slate-200/80 bg-white/70 px-2 py-1 text-[9.5px] font-semibold text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/25"
                >
                  {t('attendance.viewSignature')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {historySignature ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setHistorySignature(null)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-[26px] border border-white/70 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0d0c1c]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                  {t('attendance.signatureTitle')}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-900 dark:text-white">
                  {historySignature.studentName}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {historySignature.studentNumber} · {formatTime(historySignature.signedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistorySignature(null)}
                aria-label={t('common.close')}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
              <img
                src={historySignature.signature}
                alt={t('attendance.signatureTitle')}
                className="h-40 w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
