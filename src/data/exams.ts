import { COURSES } from '@/data/student';
import type { ExamScheduleEntry, ExamType } from '@/types/student';

const courseNames = new Map(COURSES.map((course) => [course.code, course.name]));

function exam(
  id: string,
  courseCode: string,
  type: ExamType,
  startsAt: string,
  room: string,
  seat: string,
  durationMinutes: number,
): ExamScheduleEntry {
  return {
    id,
    courseCode,
    courseName: courseNames.get(courseCode) ?? courseCode,
    type,
    startsAt,
    room,
    seat,
    durationMinutes,
  };
}

export const EXAM_SCHEDULE: ExamScheduleEntry[] = [
  exam('bm201-vize', 'BM201', 'Vize', '2026-11-12T10:00:00+03:00', 'D-204', 'B-12', 60),
  exam('bm203-vize', 'BM203', 'Vize', '2026-11-13T13:30:00+03:00', 'B-101', 'C-07', 75),
  exam('bm205-vize', 'BM205', 'Vize', '2026-11-16T10:00:00+03:00', 'D-112', 'A-21', 60),
  exam('bm207-vize', 'BM207', 'Vize', '2026-11-17T14:00:00+03:00', 'D-204', 'B-04', 75),
  exam('bm209-vize', 'BM209', 'Vize', '2026-11-18T09:00:00+03:00', 'CLD-01', 'LAB-09', 90),
  exam('mat205-vize', 'MAT205', 'Vize', '2026-11-19T09:00:00+03:00', 'A-305', 'D-16', 75),
  exam('eng201-vize', 'ENG201', 'Vize', '2026-11-20T13:30:00+03:00', 'Y-102', 'E-22', 60),
  exam('bm201-final', 'BM201', 'Final', '2027-01-05T10:00:00+03:00', 'D-204', 'B-12', 90),
  exam('bm203-final', 'BM203', 'Final', '2027-01-06T13:30:00+03:00', 'B-101', 'C-07', 90),
  exam('bm205-final', 'BM205', 'Final', '2027-01-07T10:00:00+03:00', 'D-112', 'A-21', 90),
  exam('bm207-final', 'BM207', 'Final', '2027-01-08T14:00:00+03:00', 'D-204', 'B-04', 90),
  exam('bm209-final', 'BM209', 'Final', '2027-01-11T09:00:00+03:00', 'CLD-01', 'LAB-09', 90),
  exam('mat205-final', 'MAT205', 'Final', '2027-01-12T09:00:00+03:00', 'A-305', 'D-16', 90),
  exam('eng201-final', 'ENG201', 'Final', '2027-01-13T13:30:00+03:00', 'Y-102', 'E-22', 75),
  exam('bm201-but', 'BM201', 'Bütünleme', '2027-01-25T10:00:00+03:00', 'D-204', 'B-12', 90),
  exam('bm203-but', 'BM203', 'Bütünleme', '2027-01-25T13:30:00+03:00', 'B-101', 'C-07', 90),
  exam('bm205-but', 'BM205', 'Bütünleme', '2027-01-26T10:00:00+03:00', 'D-112', 'A-21', 90),
  exam('bm207-but', 'BM207', 'Bütünleme', '2027-01-26T14:00:00+03:00', 'D-204', 'B-04', 90),
  exam('bm209-but', 'BM209', 'Bütünleme', '2027-01-27T09:00:00+03:00', 'CLD-01', 'LAB-09', 90),
  exam('mat205-but', 'MAT205', 'Bütünleme', '2027-01-27T14:00:00+03:00', 'A-305', 'D-16', 90),
  exam('eng201-but', 'ENG201', 'Bütünleme', '2027-01-28T13:30:00+03:00', 'Y-102', 'E-22', 75),
].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
