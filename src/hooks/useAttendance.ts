import { useEffect, useState } from 'react';
import { attendanceService } from '@/services/attendance';
import type { AttendanceSession } from '@/types/attendance';

export function useAttendance(): AttendanceSession[] {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);

  useEffect(() => attendanceService.subscribe(setSessions), []);

  return sessions;
}
