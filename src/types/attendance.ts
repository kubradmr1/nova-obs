export type AttendanceSessionStatus = 'active' | 'ended';

export interface AttendanceParticipant {
  studentId: string;
  studentNumber: string;
  studentName: string;
  signedAt: string;
  signature: string;
  code: string;
}

export interface AttendanceSession {
  id: string;
  courseCode: string;
  courseName: string;
  room: string;
  academicianId: string;
  academicianName: string;
  startedAt: string;
  endsAt: string;
  durationMinutes: number;
  rotationSeconds: number;
  secret: string;
  status: AttendanceSessionStatus;
  endedAt?: string;
  participants: AttendanceParticipant[];
}

export interface StartSessionInput {
  courseCode: string;
  courseName: string;
  room: string;
  academicianId: string;
  academicianName: string;
  durationMinutes: number;
}

export interface JoinSessionInput {
  sessionId: string;
  code: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  signature: string;
}

// attendance_join_session / attendance_lookup_code yanıtlarındaki
// reason değerlerinin tamamı. 'unavailable' istemci tarafı taşıma hatasıdır.
export type JoinFailureReason =
  | 'not-found'
  | 'closed'
  | 'expired'
  | 'invalid-code'
  | 'duplicate'
  | 'not-enrolled'
  | 'signature-required'
  | 'rate-limited'
  | 'forbidden'
  | 'signature-too-large'
  | 'invalid-signature'
  | 'unavailable';

export type StartFailureReason =
  | 'forbidden'
  | 'course-not-found'
  | 'invalid-duration'
  | 'session-conflict'
  | 'unavailable';

export type JoinSessionResult =
  | { ok: true; session: AttendanceSession; participant?: AttendanceParticipant }
  | { ok: false; reason: JoinFailureReason };

export type LookupCodeResult =
  | { ok: true; alreadyJoined: boolean; session: AttendanceSession }
  | { ok: false; reason: JoinFailureReason };

export interface AttendanceCodeSnapshot {
  sessionId: string;
  status: 'active' | 'ended' | 'expired';
  code: string | null;
  slot: number;
  codeExpiresAt: string | null;
  endsAt: string;
  rotationSeconds: number;
  serverTime: string;
}

export interface AttendanceCourseSummary {
  code: string;
  name: string;
  term: string;
  room: string;
  rosterCount: number;
}

export interface AttendanceIdentity {
  studentId: string;
  studentNumber: string;
}

export interface AttendanceService {
  readonly mode: 'local' | 'supabase';
  listSessions(): Promise<AttendanceSession[]>;
  subscribe(listener: (sessions: AttendanceSession[]) => void): () => void;
  startSession(input: StartSessionInput): Promise<AttendanceSession>;
  endSession(sessionId: string): Promise<AttendanceSession | null>;
  joinSession(input: JoinSessionInput): Promise<JoinSessionResult>;
  lookupCode(code: string, identity?: AttendanceIdentity): Promise<LookupCodeResult>;
  currentCode(sessionId: string): Promise<AttendanceCodeSnapshot | null>;
  listCourses(): Promise<AttendanceCourseSummary[]>;
}

export class AttendanceServiceError extends Error {
  readonly reason: StartFailureReason;

  constructor(reason: StartFailureReason) {
    super(reason);
    this.name = 'AttendanceServiceError';
    this.reason = reason;
  }
}

export interface AttendanceRepository {
  load(): AttendanceSession[];
  persist(sessions: AttendanceSession[]): void;
  subscribe(onChange: () => void): () => void;
}
