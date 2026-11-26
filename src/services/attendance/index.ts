import { runtimeConfig } from '@/config/runtime';
import { ACADEMICIAN_COURSES } from '@/data/academician';
import { isSupabaseConfigured } from '@/lib/supabase';
import type {
  AttendanceCodeSnapshot,
  AttendanceCourseSummary,
  AttendanceIdentity,
  AttendanceRepository,
  AttendanceService,
  AttendanceSession,
  JoinFailureReason,
  JoinSessionInput,
  JoinSessionResult,
  LookupCodeResult,
  StartSessionInput,
} from '@/types/attendance';
import {
  deriveAttendanceCode,
  isSessionCodeValid,
  rotationSlot,
} from './code';
import { attendanceRepository } from './localRepository';
import { createSupabaseAttendanceService } from './supabase';

export function findJoinTarget(
  sessions: AttendanceSession[],
  options: { sessionId?: string; code: string; nowMs: number },
): AttendanceSession | null {
  const code = options.code.trim().toUpperCase();

  if (options.sessionId) {
    return sessions.find((session) => session.id === options.sessionId) ?? null;
  }

  return (
    sessions.find(
      (session) =>
        session.status === 'active' &&
        options.nowMs < new Date(session.endsAt).getTime() &&
        isSessionCodeValid(session, code, options.nowMs),
    ) ?? null
  );
}

export function joinBlockReason(
  session: AttendanceSession,
  options: { code: string; studentId: string; studentNumber: string; nowMs: number },
): JoinFailureReason | null {
  if (session.status === 'ended') {
    return 'closed';
  }

  if (options.nowMs >= new Date(session.endsAt).getTime()) {
    return 'expired';
  }

  if (!isSessionCodeValid(session, options.code, options.nowMs)) {
    return 'invalid-code';
  }

  const alreadySigned = session.participants.some(
    (participant) =>
      participant.studentId === options.studentId ||
      participant.studentNumber === options.studentNumber,
  );

  if (alreadySigned) {
    return 'duplicate';
  }

  if (!isEnrolled(session.courseCode, options.studentNumber)) {
    return 'not-enrolled';
  }

  return null;
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function createSecret(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

// Roster anahtarı öğrenci numarasıdır. E-posta/UUID ile giriş yapan hesap
// veya bilinmeyen ders eşleşmediği için kontrol fail-closed davranır.
function isEnrolled(courseCode: string, studentNumber: string): boolean {
  const course = ACADEMICIAN_COURSES.find((item) => item.code === courseCode);

  if (!course) {
    return false;
  }

  return course.roster.some((student) => student.number === studentNumber);
}

function buildCodeSnapshot(
  session: AttendanceSession,
  nowMs: number,
): AttendanceCodeSnapshot {
  const startedAtMs = new Date(session.startedAt).getTime();
  const slot = rotationSlot(startedAtMs, session.rotationSeconds, nowMs);
  const base: AttendanceCodeSnapshot = {
    sessionId: session.id,
    status: 'active',
    code: null,
    slot,
    codeExpiresAt: null,
    endsAt: session.endsAt,
    rotationSeconds: session.rotationSeconds,
    serverTime: new Date(nowMs).toISOString(),
  };

  if (session.status === 'ended') {
    return { ...base, status: 'ended' };
  }

  if (nowMs >= new Date(session.endsAt).getTime()) {
    return { ...base, status: 'expired' };
  }

  const codeExpiresAt = new Date(
    startedAtMs + (slot + 1) * session.rotationSeconds * 1000,
  ).toISOString();

  return {
    ...base,
    code: deriveAttendanceCode(session.secret, session.id, slot),
    codeExpiresAt,
  };
}

export function createAttendanceService(repository: AttendanceRepository): AttendanceService {
  const listeners = new Set<(sessions: AttendanceSession[]) => void>();

  const snapshot = (): AttendanceSession[] =>
    [...repository.load()].sort(
      (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
    );

  const notify = () => {
    const sessions = snapshot();
    listeners.forEach((listener) => listener(sessions));
  };

  repository.subscribe(notify);

  return {
    mode: 'local',

    async listSessions() {
      return snapshot();
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());

      return () => listeners.delete(listener);
    },

    async startSession(input: StartSessionInput) {
      const now = Date.now();
      const duration = Math.min(
        runtimeConfig.attendance.maxDurationMinutes,
        Math.max(runtimeConfig.attendance.minDurationMinutes, Math.round(input.durationMinutes)),
      );
      const session: AttendanceSession = {
        id: createSessionId(),
        courseCode: input.courseCode,
        courseName: input.courseName,
        room: input.room,
        academicianId: input.academicianId,
        academicianName: input.academicianName,
        startedAt: new Date(now).toISOString(),
        endsAt: new Date(now + duration * 60_000).toISOString(),
        durationMinutes: duration,
        rotationSeconds: runtimeConfig.attendance.rotationSeconds,
        secret: createSecret(),
        status: 'active',
        participants: [],
      };

      const sessions = repository
        .load()
        .filter((item) => !(item.academicianId === input.academicianId && item.status === 'active'));
      repository.persist([session, ...sessions]);
      notify();

      return session;
    },

    async endSession(sessionId: string) {
      const sessions = repository.load();
      const target = sessions.find((session) => session.id === sessionId);

      if (!target) {
        return null;
      }

      if (target.status === 'ended') {
        return target;
      }

      const ended: AttendanceSession = {
        ...target,
        status: 'ended',
        endedAt: new Date().toISOString(),
      };

      repository.persist(sessions.map((session) => (session.id === sessionId ? ended : session)));
      notify();

      return ended;
    },

    async joinSession(input: JoinSessionInput): Promise<JoinSessionResult> {
      const sessions = repository.load();
      const now = Date.now();
      const normalizedCode = input.code.trim().toUpperCase();
      const target = findJoinTarget(sessions, {
        sessionId: input.sessionId,
        code: normalizedCode,
        nowMs: now,
      });

      if (!target) {
        return { ok: false, reason: 'not-found' };
      }

      const blocked = joinBlockReason(target, {
        code: normalizedCode,
        studentId: input.studentId,
        studentNumber: input.studentNumber,
        nowMs: now,
      });

      if (blocked) {
        return { ok: false, reason: blocked };
      }

      if (!input.signature) {
        return { ok: false, reason: 'signature-required' };
      }

      const participant = {
        studentId: input.studentId,
        studentNumber: input.studentNumber,
        studentName: input.studentName,
        signedAt: new Date(now).toISOString(),
        signature: input.signature,
        code: normalizedCode,
      };

      const updated: AttendanceSession = {
        ...target,
        participants: [...target.participants, participant],
      };

      repository.persist(sessions.map((session) => (session.id === target.id ? updated : session)));
      notify();

      return { ok: true, session: updated, participant };
    },

    async lookupCode(
      code: string,
      identity?: AttendanceIdentity,
    ): Promise<LookupCodeResult> {
      const sessions = repository.load();
      const nowMs = Date.now();
      const target = findJoinTarget(sessions, {
        code: code.trim().toUpperCase(),
        nowMs,
      });

      if (!target) {
        return { ok: false, reason: 'invalid-code' };
      }

      const alreadyJoined = identity
        ? target.participants.some(
            (participant) =>
              participant.studentId === identity.studentId ||
              participant.studentNumber === identity.studentNumber,
          )
        : false;

      return { ok: true, alreadyJoined, session: target };
    },

    async currentCode(sessionId: string) {
      const session = repository.load().find((item) => item.id === sessionId);

      return session ? buildCodeSnapshot(session, Date.now()) : null;
    },

    async listCourses() {
      return ACADEMICIAN_COURSES.map<AttendanceCourseSummary>((course) => ({
        code: course.code,
        name: course.name,
        term: course.term,
        room: course.room,
        rosterCount: course.roster.length,
      }));
    },
  };
}

const localService = createAttendanceService(attendanceRepository);

export const attendanceService: AttendanceService = isSupabaseConfigured
  ? createSupabaseAttendanceService()
  : localService;
