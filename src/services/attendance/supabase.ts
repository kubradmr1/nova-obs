import { requireSupabaseClient, supabase } from '@/lib/supabase';
import {
  AttendanceServiceError,
  type AttendanceCodeSnapshot,
  type AttendanceCourseSummary,
  type AttendanceParticipant,
  type AttendanceService,
  type AttendanceSession,
  type JoinFailureReason,
  type JoinSessionInput,
  type JoinSessionResult,
  type LookupCodeResult,
  type StartFailureReason,
  type StartSessionInput,
} from '@/types/attendance';

// Realtime kapalıysa panelin donmaması için periyodik yedek yenileme.
const REFRESH_INTERVAL_MS = 15_000;

interface SessionRow {
  id: string;
  course_code: string;
  course_name: string;
  room: string;
  academician_key: string | null;
  academician_name: string;
  started_at: string;
  ends_at: string;
  duration_minutes: number;
  rotation_seconds: number;
  status: string;
  ended_at: string | null;
}

interface ParticipantRow {
  id: string;
  session_id: string;
  student_profile_id: string | null;
  student_number: string;
  student_name: string;
  signed_at: string;
}

interface SignatureRow {
  participant_id: string;
  signature_data: string;
}

interface RpcSessionSummary {
  id: string;
  courseCode: string;
  courseName: string;
  room: string;
  academicianName: string;
  startedAt: string;
  endsAt: string;
  rotationSeconds: number;
  status: string;
  durationMinutes?: number;
}

type StartResponse =
  | {
      ok: true;
      session: RpcSessionSummary;
      code: string;
      codeExpiresAt: string;
      serverTime: string;
    }
  | { ok: false; reason: StartFailureReason };

type CurrentCodeResponse =
  | {
      ok: true;
      status: 'active';
      sessionId: string;
      code: string;
      slot: number;
      codeExpiresAt: string;
      endsAt: string;
      rotationSeconds: number;
      serverTime: string;
    }
  | {
      ok: true;
      status: 'ended' | 'expired';
      sessionId: string;
      code: null;
      endsAt: string;
      serverTime: string;
    }
  | { ok: false; reason: string };

type LookupResponse =
  | { ok: true; alreadyJoined: boolean; session: RpcSessionSummary }
  | { ok: false; reason: JoinFailureReason };

type JoinResponse =
  | {
      ok: true;
      participant: {
        id: string;
        studentNumber: string;
        studentName: string;
        signedAt: string;
        codeSlot: number;
      };
      session: RpcSessionSummary;
      serverTime: string;
    }
  | { ok: false; reason: JoinFailureReason };

function mapSessionRow(row: SessionRow, participants: AttendanceParticipant[]): AttendanceSession {
  return {
    id: row.id,
    courseCode: row.course_code,
    courseName: row.course_name,
    room: row.room,
    academicianId: row.academician_key ?? '',
    academicianName: row.academician_name,
    startedAt: row.started_at,
    endsAt: row.ends_at,
    durationMinutes: row.duration_minutes,
    rotationSeconds: row.rotation_seconds,
    secret: '',
    status: row.status === 'ended' ? 'ended' : 'active',
    endedAt: row.ended_at ?? undefined,
    participants,
  };
}

function mapRpcSession(raw: RpcSessionSummary): AttendanceSession {
  const durationMinutes =
    raw.durationMinutes ??
    Math.max(
      1,
      Math.round(
        (new Date(raw.endsAt).getTime() - new Date(raw.startedAt).getTime()) / 60_000,
      ),
    );

  return {
    id: raw.id,
    courseCode: raw.courseCode,
    courseName: raw.courseName,
    room: raw.room,
    academicianId: '',
    academicianName: raw.academicianName,
    startedAt: raw.startedAt,
    endsAt: raw.endsAt,
    durationMinutes,
    rotationSeconds: raw.rotationSeconds,
    secret: '',
    status: raw.status === 'ended' ? 'ended' : 'active',
    participants: [],
  };
}

async function fetchSessions(): Promise<AttendanceSession[]> {
  const client = requireSupabaseClient();
  const { data: sessionRows, error } = await client
    .from('attendance_sessions')
    .select(
      'id, course_code, course_name, room, academician_key, academician_name, started_at, ends_at, duration_minutes, rotation_seconds, status, ended_at',
    )
    .order('started_at', { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  const rows = (sessionRows ?? []) as SessionRow[];

  if (rows.length === 0) {
    return [];
  }

  const sessionIds = rows.map((row) => row.id);
  const [participantResult, signatureResult] = await Promise.all([
    client
      .from('attendance_participants')
      .select('id, session_id, student_profile_id, student_number, student_name, signed_at')
      .in('session_id', sessionIds),
    client
      .from('attendance_signatures')
      .select('participant_id, signature_data')
      .in('session_id', sessionIds),
  ]);

  if (participantResult.error) {
    console.error('Yoklama katılımcıları okunamadı:', participantResult.error.message);
  }

  if (signatureResult.error) {
    console.error('Yoklama imzaları okunamadı:', signatureResult.error.message);
  }

  const signatures = new Map<string, string>();

  for (const row of (signatureResult.data ?? []) as SignatureRow[]) {
    signatures.set(row.participant_id, row.signature_data);
  }

  const participantsBySession = new Map<string, AttendanceParticipant[]>();

  for (const row of (participantResult.data ?? []) as ParticipantRow[]) {
    const list = participantsBySession.get(row.session_id) ?? [];
    list.push({
      studentId: row.student_profile_id ?? row.student_number,
      studentNumber: row.student_number,
      studentName: row.student_name,
      signedAt: row.signed_at,
      signature: signatures.get(row.id) ?? '',
      code: '',
    });
    participantsBySession.set(row.session_id, list);
  }

  return rows.map((row) => mapSessionRow(row, participantsBySession.get(row.id) ?? []));
}

export function createSupabaseAttendanceService(): AttendanceService {
  const listeners = new Set<(sessions: AttendanceSession[]) => void>();

  const emit = async (): Promise<AttendanceSession[]> => {
    const sessions = await fetchSessions();
    listeners.forEach((listener) => listener(sessions));
    return sessions;
  };

  const safeEmit = async (): Promise<AttendanceSession[] | null> => {
    try {
      return await emit();
    } catch (error) {
      console.error('Yoklama listesi yenilenemedi:', error);
      return null;
    }
  };

  return {
    mode: 'supabase',

    listSessions: fetchSessions,

    subscribe(listener) {
      listeners.add(listener);

      void fetchSessions()
        .then((sessions) => {
          if (listeners.has(listener)) {
            listener(sessions);
          }
        })
        .catch((error) => {
          console.error('Yoklama listesi yüklenemedi:', error);
        });

      const client = supabase;
      const channel = client
        ? client
            .channel(`attendance-live-${Math.random().toString(36).slice(2)}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'attendance_sessions' },
              () => void safeEmit(),
            )
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'attendance_participants' },
              () => void safeEmit(),
            )
            .subscribe()
        : null;

      const timer = window.setInterval(() => void safeEmit(), REFRESH_INTERVAL_MS);

      return () => {
        listeners.delete(listener);
        window.clearInterval(timer);

        if (client && channel) {
          void client.removeChannel(channel);
        }
      };
    },

    async startSession(input: StartSessionInput): Promise<AttendanceSession> {
      const client = requireSupabaseClient();
      const { data, error } = await client.rpc('attendance_start_session', {
        p_course_code: input.courseCode,
        p_duration_minutes: input.durationMinutes,
      });

      if (error) {
        console.error('Yoklama başlatılamadı:', error.message);
        throw new AttendanceServiceError('unavailable');
      }

      const response = data as StartResponse | null;

      if (!response || response.ok !== true) {
        throw new AttendanceServiceError(
          response && response.ok === false ? response.reason : 'unavailable',
        );
      }

      await safeEmit();

      return mapRpcSession(response.session);
    },

    async endSession(sessionId: string): Promise<AttendanceSession | null> {
      const client = requireSupabaseClient();
      const { data, error } = await client.rpc('attendance_end_session', {
        p_session_id: sessionId,
      });

      if (error) {
        console.error('Yoklama bitirilemedi:', error.message);
        return null;
      }

      const response = data as { ok?: boolean } | null;

      if (!response?.ok) {
        return null;
      }

      const sessions = await safeEmit();

      return sessions?.find((item) => item.id === sessionId) ?? null;
    },

    async joinSession(input: JoinSessionInput): Promise<JoinSessionResult> {
      const client = requireSupabaseClient();
      const normalizedCode = input.code.trim().toUpperCase();
      const { data, error } = await client.rpc('attendance_join_session', {
        p_session_id: input.sessionId,
        p_code: normalizedCode,
        p_signature_data: input.signature,
      });

      if (error) {
        console.error('Yoklamaya katılınamadı:', error.message);
        return { ok: false, reason: 'unavailable' };
      }

      const response = data as JoinResponse | null;

      if (!response) {
        return { ok: false, reason: 'unavailable' };
      }

      if (response.ok !== true) {
        return { ok: false, reason: response.reason };
      }

      const participant: AttendanceParticipant = {
        studentId: input.studentId,
        studentNumber: response.participant.studentNumber,
        studentName: response.participant.studentName,
        signedAt: response.participant.signedAt,
        signature: input.signature,
        code: normalizedCode,
      };

      await safeEmit();

      return {
        ok: true,
        session: mapRpcSession(response.session),
        participant,
      };
    },

    async lookupCode(code: string): Promise<LookupCodeResult> {
      const client = requireSupabaseClient();
      const { data, error } = await client.rpc('attendance_lookup_code', {
        p_code: code.trim().toUpperCase(),
      });

      if (error) {
        console.error('Yoklama kodu doğrulanamadı:', error.message);
        return { ok: false, reason: 'unavailable' };
      }

      const response = data as LookupResponse | null;

      if (!response) {
        return { ok: false, reason: 'unavailable' };
      }

      if (response.ok !== true) {
        return { ok: false, reason: response.reason };
      }

      return {
        ok: true,
        alreadyJoined: Boolean(response.alreadyJoined),
        session: mapRpcSession(response.session),
      };
    },

    async currentCode(sessionId: string): Promise<AttendanceCodeSnapshot | null> {
      const client = requireSupabaseClient();
      const { data, error } = await client.rpc('attendance_current_code', {
        p_session_id: sessionId,
      });

      if (error) {
        console.error('Güncel yoklama kodu alınamadı:', error.message);
        return null;
      }

      const response = data as CurrentCodeResponse | null;

      if (!response || response.ok !== true) {
        return null;
      }

      if (response.status === 'active') {
        return {
          sessionId: response.sessionId,
          status: 'active',
          code: response.code,
          slot: Number(response.slot ?? 0),
          codeExpiresAt: response.codeExpiresAt,
          endsAt: response.endsAt,
          rotationSeconds: response.rotationSeconds ?? 20,
          serverTime: response.serverTime,
        };
      }

      return {
        sessionId: response.sessionId,
        status: response.status,
        code: null,
        slot: 0,
        codeExpiresAt: null,
        endsAt: response.endsAt,
        rotationSeconds: 20,
        serverTime: response.serverTime,
      };
    },

    async listCourses(): Promise<AttendanceCourseSummary[]> {
      const client = requireSupabaseClient();
      const { data: courseRows, error } = await client
        .from('academician_courses')
        .select('course_code, course_name, term, room')
        .eq('is_active', true)
        .order('course_code');

      if (error) {
        throw error;
      }

      const { data: rosterRows, error: rosterError } = await client
        .from('course_rosters')
        .select('course_code');

      if (rosterError) {
        console.error('Ders listesi okunamadı:', rosterError.message);
      }

      const counts = new Map<string, number>();

      for (const row of (rosterRows ?? []) as { course_code: string }[]) {
        counts.set(row.course_code, (counts.get(row.course_code) ?? 0) + 1);
      }

      return (
        (courseRows ?? []) as {
          course_code: string;
          course_name: string;
          term: string;
          room: string;
        }[]
      ).map((row) => ({
        code: row.course_code,
        name: row.course_name,
        term: row.term,
        room: row.room,
        rosterCount: counts.get(row.course_code) ?? 0,
      }));
    },
  };
}
