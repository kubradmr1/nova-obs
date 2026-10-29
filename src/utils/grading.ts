import type {
  AttendanceStatus,
  CourseRecord,
  LetterGrade,
  LetterScaleEntry,
} from '@/types/student';

export const GRADE_WEIGHTS = { midterm: 0.4, final: 0.6 } as const;

export const ATTENDANCE_LIMIT_RATIO = 0.3;

export const LETTER_SCALE: LetterScaleEntry[] = [
  { letter: 'AA', min: 90, points: 4 },
  { letter: 'BA', min: 85, points: 3.5 },
  { letter: 'BB', min: 80, points: 3 },
  { letter: 'CB', min: 75, points: 2.5 },
  { letter: 'CC', min: 70, points: 2 },
  { letter: 'DC', min: 65, points: 1.5 },
  { letter: 'DD', min: 60, points: 1 },
  { letter: 'FD', min: 50, points: 0.5 },
  { letter: 'FF', min: 0, points: 0 },
];

const gpaFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const gradeFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatGpa(value: number): string {
  return gpaFormatter.format(value);
}

export function formatGrade(value: number): string {
  return gradeFormatter.format(value);
}

export function computeAverage(midterm: number, final: number): number {
  return midterm * GRADE_WEIGHTS.midterm + final * GRADE_WEIGHTS.final;
}

export function resolveLetter(average: number): LetterGrade {
  return LETTER_SCALE.find((entry) => average >= entry.min)?.letter ?? 'FF';
}

export function letterPoints(letter: LetterGrade): number {
  return LETTER_SCALE.find((entry) => entry.letter === letter)?.points ?? 0;
}

export function letterMinimum(letter: LetterGrade): number {
  return LETTER_SCALE.find((entry) => entry.letter === letter)?.min ?? 0;
}

export function isPassing(letter: LetterGrade): boolean {
  return letterPoints(letter) >= 1;
}

export interface SemesterSummary {
  credits: number;
  ects: number;
  gpa: number;
  passedCount: number;
  failedCount: number;
}

export function summarizeSemester(courses: CourseRecord[]): SemesterSummary {
  let credits = 0;
  let ects = 0;
  let weightedPoints = 0;
  let passedCount = 0;
  let failedCount = 0;

  for (const course of courses) {
    const letter = resolveLetter(computeAverage(course.midterm, course.final));
    credits += course.credits;
    ects += course.ects;
    weightedPoints += letterPoints(letter) * course.credits;

    if (isPassing(letter)) {
      passedCount += 1;
    } else {
      failedCount += 1;
    }
  }

  return {
    credits,
    ects,
    gpa: credits > 0 ? weightedPoints / credits : 0,
    passedCount,
    failedCount,
  };
}

export function absenceLimit(course: CourseRecord): number {
  return Math.floor(course.totalHours * ATTENDANCE_LIMIT_RATIO);
}

export function remainingAbsence(course: CourseRecord): number {
  return Math.max(0, absenceLimit(course) - course.absentHours);
}

export function attendanceRate(course: CourseRecord): number {
  if (course.totalHours === 0) {
    return 100;
  }

  return ((course.totalHours - course.absentHours) / course.totalHours) * 100;
}

export function attendanceStatus(course: CourseRecord): AttendanceStatus {
  const limit = absenceLimit(course);

  if (course.absentHours > limit) {
    return 'critical';
  }

  if (limit > 0 && course.absentHours / limit >= 0.75) {
    return 'risk';
  }

  return 'safe';
}

export interface AttendanceSummary {
  totalHours: number;
  absentHours: number;
  totalLimit: number;
  remaining: number;
  rate: number;
  riskyCount: number;
}

export function summarizeAttendance(courses: CourseRecord[]): AttendanceSummary {
  let totalHours = 0;
  let absentHours = 0;
  let totalLimit = 0;
  let riskyCount = 0;

  for (const course of courses) {
    totalHours += course.totalHours;
    absentHours += course.absentHours;
    totalLimit += absenceLimit(course);

    if (attendanceStatus(course) !== 'safe') {
      riskyCount += 1;
    }
  }

  return {
    totalHours,
    absentHours,
    totalLimit,
    remaining: Math.max(0, totalLimit - absentHours),
    rate: totalHours > 0 ? ((totalHours - absentHours) / totalHours) * 100 : 0,
    riskyCount,
  };
}

/** Hedef harf notunu yakalamak için final sınavından alınması gereken en düşük not. */
export function requiredFinal(midterm: number, targetMin: number): number {
  const raw =
    (targetMin - midterm * GRADE_WEIGHTS.midterm) / GRADE_WEIGHTS.final;

  return Math.max(0, Math.ceil(raw - 1e-9));
}
