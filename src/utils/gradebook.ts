import type {
  AcademicianCourse,
  GradeEntry,
  GradeMap,
} from '@/types/academician';
import { readJson, writeJson } from '@/utils/storage';

const STORAGE_KEY = 'obs.gradebooks.v1';

export type GradebookStore = Record<string, GradeMap>;

function seedGradebooks(courses: AcademicianCourse[]): GradebookStore {
  return Object.fromEntries(
    courses.map((course) => [
      course.code,
      Object.fromEntries(
        course.roster.map((student) => [
          student.number,
          { midterm: student.midterm, final: student.final },
        ]),
      ),
    ]),
  );
}

function isValidScore(value: unknown): boolean {
  return value === null || (typeof value === 'number' && value >= 0 && value <= 100);
}

function isValidEntry(value: unknown): value is GradeEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Partial<GradeEntry>;
  return isValidScore(entry.midterm) && isValidScore(entry.final);
}

export function loadGradebooks(courses: AcademicianCourse[]): GradebookStore {
  const seed = seedGradebooks(courses);
  const stored = readJson<Record<string, GradeMap>>(STORAGE_KEY);

  if (!stored) {
    return seed;
  }

  const merged: GradebookStore = {};

  for (const course of courses) {
    const baseline = seed[course.code] ?? {};
    const saved = stored[course.code] ?? {};
    const courseMap: GradeMap = {};

    for (const studentNumber of Object.keys(baseline)) {
      const savedEntry = saved[studentNumber];
      courseMap[studentNumber] = isValidEntry(savedEntry)
        ? savedEntry
        : baseline[studentNumber];
    }

    merged[course.code] = courseMap;
  }

  return merged;
}

export function saveGradebooks(store: GradebookStore): void {
  writeJson(STORAGE_KEY, store);
}

export function cloneGradebooks(store: GradebookStore): GradebookStore {
  return Object.fromEntries(
    Object.entries(store).map(([code, map]) => [
      code,
      Object.fromEntries(
        Object.entries(map).map(([number, entry]) => [number, { ...entry }]),
      ),
    ]),
  );
}
