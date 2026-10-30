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

export type JoinFailureReason =
  | 'not-found'
  | 'closed'
  | 'expired'
  | 'invalid-code'
  | 'duplicate'
  | 'not-enrolled'
  | 'signature-required';

export type JoinSessionResult =
  | { ok: true; session: AttendanceSession }
  | { ok: false; reason: JoinFailureReason };

export interface AttendanceRepository {
  load(): AttendanceSession[];
  persist(sessions: AttendanceSession[]): void;
  subscribe(onChange: () => void): () => void;
}
