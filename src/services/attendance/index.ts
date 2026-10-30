import { runtimeConfig } from '@/config/runtime';
import { ACADEMICIAN_COURSES } from '@/data/academician';
import type {
  AttendanceRepository,
  AttendanceSession,
  JoinFailureReason,
  JoinSessionInput,
  JoinSessionResult,
  StartSessionInput,
} from '@/types/attendance';
import { isSessionCodeValid } from './code';
import { attendanceRepository } from './localRepository';

export interface AttendanceService {
  listSessions(): Promise<AttendanceSession[]>;
  subscribe(listener: (sessions: AttendanceSession[]) => void): () => void;
  startSession(input: StartSessionInput): Promise<AttendanceSession>;
  endSession(sessionId: string): Promise<AttendanceSession | null>;
  joinSession(input: JoinSessionInput): Promise<JoinSessionResult>;
}

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

function isEnrolled(courseCode: string, studentNumber: string): boolean {
  // Roster anahtarı öğrenci numarasıdır; e-posta/UUID ile giriş yapan
  // hesaplarda (Supabase) liste kontrolü atlanır.
  if (!/^\d{4,12}$/.test(studentNumber)) {
    return true;
  }

  const course = ACADEMICIAN_COURSES.find((item) => item.code === courseCode);

  if (!course) {
    return true;
  }

  return course.roster.some((student) => student.number === studentNumber);
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

    async joinSession(input: JoinSessionInput) {
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

      const updated: AttendanceSession = {
        ...target,
        participants: [
          ...target.participants,
          {
            studentId: input.studentId,
            studentNumber: input.studentNumber,
            studentName: input.studentName,
            signedAt: new Date(now).toISOString(),
            signature: input.signature,
            code: normalizedCode,
          },
        ],
      };

      repository.persist(sessions.map((session) => (session.id === target.id ? updated : session)));
      notify();

      return { ok: true, session: updated };
    },
  };
}

export const attendanceService = createAttendanceService(attendanceRepository);
