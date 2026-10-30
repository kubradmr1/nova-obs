import type { AttendanceRepository, AttendanceSession } from '@/types/attendance';

const STORAGE_KEY = 'obs.attendance.sessions.v1';
const CHANNEL_NAME = 'obs-attendance';

function readStorage(): AttendanceSession[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as AttendanceSession[]) : [];
  } catch {
    return [];
  }
}

export class LocalAttendanceRepository implements AttendanceRepository {
  private channel: BroadcastChannel | null;

  constructor() {
    this.channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);
  }

  load(): AttendanceSession[] {
    return readStorage();
  }

  persist(sessions: AttendanceSession[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    this.channel?.postMessage({ type: 'attendance-updated' });
  }

  subscribe(onChange: () => void): () => void {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        onChange();
      }
    };

    const handleChannel = () => onChange();

    window.addEventListener('storage', handleStorage);
    this.channel?.addEventListener('message', handleChannel);

    return () => {
      window.removeEventListener('storage', handleStorage);
      this.channel?.removeEventListener('message', handleChannel);
    };
  }
}

export const attendanceRepository: AttendanceRepository = new LocalAttendanceRepository();
