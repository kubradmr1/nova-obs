import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Hourglass,
  QrCode as QrCodeIcon,
  RefreshCw,
  Timer,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { QrCodeImage } from '@/components/attendance/QrCodeImage';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { runtimeConfig } from '@/config/runtime';
import { ACADEMICIAN_COURSES } from '@/data/academician';
import {
  DEFAULT_ACADEMICIAN_ID,
  findAcademicianById,
  getAcademicianIdForSession,
} from '@/data/academicians';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useNow } from '@/hooks/useNow';
import { attendanceService } from '@/services/attendance';
import { buildQrPayload, rotationCountdown, sessionCodeAt } from '@/services/attendance/code';
import type { AttendanceParticipant, AttendanceSession } from '@/types/attendance';
import { cx } from '@/utils/cx';

const DURATION_OPTIONS = [5, 10, 15, 30];

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

type SessionState = 'live' | 'ended' | 'expired';

function resolveState(session: AttendanceSession, now: number): SessionState {
  if (session.status === 'ended') {
    return 'ended';
  }

  return new Date(session.endsAt).getTime() > now ? 'live' : 'expired';
}

export function QrAttendancePage() {
  const { session } = useAuth();
  const { t, formatDate, formatTime } = useI18n();
  const now = useNow(1000);
  const sessions = useAttendance();

  const academicianId =
    session?.academicianKey ??
    (session ? getAcademicianIdForSession(session) : DEFAULT_ACADEMICIAN_ID);
  const profile = findAcademicianById(academicianId);
  const academicianName = profile?.name ?? session?.name ?? '';

  const [courseCode, setCourseCode] = useState(ACADEMICIAN_COURSES[0]?.code ?? '');
  const [duration, setDuration] = useState(runtimeConfig.attendance.defaultDurationMinutes);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<AttendanceParticipant | null>(null);

  const course =
    ACADEMICIAN_COURSES.find((item) => item.code === courseCode) ?? ACADEMICIAN_COURSES[0];

  const mySessions = useMemo(
    () => sessions.filter((item) => item.academicianId === academicianId),
    [sessions, academicianId],
  );

  const liveSession = mySessions.find((item) => resolveState(item, now) === 'live');
  const history = mySessions.filter((item) => item.id !== liveSession?.id);
  const liveCourse = liveSession
    ? ACADEMICIAN_COURSES.find((item) => item.code === liveSession.courseCode)
    : undefined;

  const currentCode = liveSession ? sessionCodeAt(liveSession, now) : '';
  const qrPayload = liveSession
    ? buildQrPayload(liveSession.id, currentCode)
    : '';
  const rotationLeft = liveSession
    ? rotationCountdown(new Date(liveSession.startedAt).getTime(), liveSession.rotationSeconds, now)
    : 0;
  const rotationPercent = liveSession
    ? Math.max(0, Math.min(100, (rotationLeft / liveSession.rotationSeconds) * 100))
    : 0;
  const remainingMs = liveSession
    ? Math.max(0, new Date(liveSession.endsAt).getTime() - now)
    : 0;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1800);

    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleStart = async () => {
    if (!course || isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      await attendanceService.startSession({
        courseCode: course.code,
        courseName: course.name,
        room: course.room,
        academicianId,
        academicianName,
        durationMinutes: duration,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    if (!liveSession || isEnding) {
      return;
    }

    setIsEnding(true);

    try {
      await attendanceService.endSession(liveSession.id);
    } finally {
      setIsEnding(false);
    }
  };

  const handleCopy = async () => {
    if (!currentCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const participants = liveSession
    ? [...liveSession.participants].sort(
        (left, right) => new Date(right.signedAt).getTime() - new Date(left.signedAt).getTime(),
      )
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('attendance.eyebrow')}
        title={t('attendance.academic.title')}
        description={t('attendance.academic.description')}
      />

      {!liveSession && course ? (
        <Card className="overflow-hidden">
          <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="attendance-course"
                  className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
                >
                  {t('attendance.selectCourse')}
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="attendance-course"
                    value={courseCode}
                    onChange={(event) => setCourseCode(event.target.value)}
                    className="h-11 w-full appearance-none rounded-2xl border border-slate-200/90 bg-white/80 pl-3.5 pr-9 text-[12.5px] font-medium text-slate-900 shadow-sm transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-brand-400/70"
                  >
                    {ACADEMICIAN_COURSES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} · {item.name}
                      </option>
                    ))}
                  </select>
                  <QrCodeIcon
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    aria-hidden
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  {t('attendance.duration')}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setDuration(minutes)}
                      aria-pressed={duration === minutes}
                      className={cx(
                        'rounded-xl border px-3.5 py-2 text-[11.5px] font-semibold transition-all duration-200',
                        duration === minutes
                          ? 'border-transparent bg-[linear-gradient(110deg,#7c5cff,#5f6bff)] text-white shadow-[0_12px_26px_-16px_rgba(124,92,255,0.9)]'
                          : 'border-slate-200/90 bg-white/70 text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/25',
                      )}
                    >
                      {t('attendance.durationOption', { minutes })}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button onClick={() => void handleStart()} isLoading={isStarting} loadingLabel={t('attendance.starting')}>
                  <QrCodeIcon className="h-4 w-4" aria-hidden />
                  {t('attendance.start')}
                </Button>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
                  {t('attendance.courseRosterHint')}
                </p>
              </div>
            </div>

            <aside className="rounded-2xl border border-brand-200/60 bg-[linear-gradient(140deg,rgba(124,92,255,0.09),rgba(56,189,248,0.05))] p-4 dark:border-brand-400/15 dark:bg-brand-500/[0.06]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                {course.code}
              </p>
              <p className="mt-1 text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
                {course.name}
              </p>
              <div className="mt-3 space-y-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
                  {course.schedule}
                </p>
                <p className="flex items-center gap-1.5">
                  <QrCodeIcon className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
                  {t('attendance.room')}: {course.room}
                </p>
                <p className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-brand-500 dark:text-brand-300" aria-hidden />
                  {t('attendance.rosterCount', { count: course.roster.length })}
                </p>
              </div>
            </aside>
          </div>
        </Card>
      ) : null}

      {liveSession ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/[0.07]">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {t('attendance.active')}
              </p>
              <h2 className="mt-1.5 truncate text-[14px] font-semibold text-slate-900 dark:text-white">
                {liveSession.courseCode} · {liveSession.courseName}
              </h2>
              <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                {t('attendance.sessionSummary', {
                  course: liveSession.room,
                  minutes: liveSession.durationMinutes,
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-right dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {t('attendance.sessionTime')}
                </p>
                <p className="font-display text-[15px] font-bold tabular-nums text-slate-800 dark:text-white">
                  {formatCountdown(remainingMs)}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => void handleEnd()}
                isLoading={isEnding}
                loadingLabel={t('attendance.ending')}
                className="px-4 py-2.5 text-[12px]"
              >
                <X className="h-4 w-4" aria-hidden />
                {t('attendance.end')}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[290px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {t('attendance.qrTitle')}
              </p>
              <div className="mt-3 flex justify-center">
                <QrCodeImage value={qrPayload} size={210} />
              </div>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                {t('attendance.qrHint')}
              </p>

              <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/80 p-3 text-center dark:border-white/10 dark:bg-white/[0.05]">
                <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  {t('attendance.codeTitle')}
                </p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <p className="font-mono text-[22px] font-bold tracking-[0.3em] text-slate-900 dark:text-white">
                    {currentCode}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    title={t('common.copy')}
                    aria-label={t('common.copy')}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/10 dark:hover:text-brand-300"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </button>
                </div>
                <p className="mt-0.5 text-[9px] text-slate-400 dark:text-slate-500">
                  {copied ? t('common.copied') : t('attendance.codeHint')}
                </p>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[9.5px] font-medium text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" aria-hidden />
                    {t('attendance.rotationTime')}
                  </span>
                  <span className="tabular-nums">{rotationLeft}s</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#7c5cff,#67e8f9)] transition-[width] duration-500 ease-linear"
                    style={{ width: `${rotationPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {t('attendance.joined')}
                </p>
                <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[9.5px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  {t('attendance.joinedCount', {
                    count: participants.length,
                    total: liveCourse?.roster.length ?? participants.length,
                  })}
                </span>
              </div>

              {participants.length === 0 ? (
                <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 px-4 py-10 text-center dark:border-white/10">
                  <Hourglass className="h-6 w-6 text-slate-300 dark:text-slate-600" aria-hidden />
                  <p className="mt-2 max-w-[260px] text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                    {t('attendance.waiting')}
                  </p>
                </div>
              ) : (
                <ul className="mt-3 max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
                  {participants.map((participant) => (
                    <li
                      key={participant.studentId}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-white/[0.07] dark:bg-white/[0.04]"
                    >
                      <Avatar name={participant.studentName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                          {participant.studentName}
                        </p>
                        <p className="text-[9.5px] text-slate-400 dark:text-slate-500">
                          {participant.studentNumber} ·{' '}
                          {t('attendance.signedAt', {
                            time: formatTime(participant.signedAt),
                          })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreview(participant)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[9.5px] font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                      >
                        {t('attendance.viewSignature')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-5 py-3.5 dark:border-white/[0.07]">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t('attendance.completed')}
          </p>
          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
            {t('attendance.sessionCount', { count: history.length })}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <Timer className="h-6 w-6 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              {t('attendance.noSessions')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
            {history.map((item) => {
              const state = resolveState(item, now);
              const itemCourse = ACADEMICIAN_COURSES.find(
                (candidate) => candidate.code === item.courseCode,
              );

              return (
                <li key={item.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                        {item.courseCode} · {item.courseName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDate(item.startedAt, { day: 'numeric', month: 'short' })} ·{' '}
                        {t('attendance.startedAt', { time: formatTime(item.startedAt) })}
                        {item.endedAt
                          ? ` · ${t('attendance.endedAt', { time: formatTime(item.endedAt) })}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cx(
                          'rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]',
                          state === 'ended'
                            ? 'bg-slate-500/10 text-slate-500 dark:bg-white/10 dark:text-slate-300'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
                        )}
                      >
                        {t(state === 'ended' ? 'attendance.ended' : 'attendance.expired')}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-300">
                        <UserCheck className="h-3 w-3" aria-hidden />
                        {item.participants.length}/{itemCourse?.roster.length ?? item.participants.length}
                      </span>
                    </div>
                  </div>

                  {item.participants.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.participants.map((participant) => (
                        <button
                          key={participant.studentId}
                          type="button"
                          onClick={() => setPreview(participant)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/70 px-2 py-1 text-[9.5px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/25"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden />
                          {participant.studentName}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setPreview(null)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-[26px] border border-white/70 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0d0c1c]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                  {t('attendance.signatureTitle')}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-slate-900 dark:text-white">
                  {preview.studentName}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {preview.studentNumber} · {formatTime(preview.signedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label={t('common.close')}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
              <img src={preview.signature} alt={t('attendance.signatureTitle')} className="h-40 w-full object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
