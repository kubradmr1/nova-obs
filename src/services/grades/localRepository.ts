import { ACADEMICIAN_COURSES } from '@/data/academician';
import { COURSES, STUDENT } from '@/data/student';
import { academicRepository, resolveOfferingInModel } from '@/services/academic';
import type { AcademicModel, CourseGrade } from '@/types/academic';
import type { AcademicianCourse, GradeEntry, GradeMap } from '@/types/academician';
import type { CourseRecord } from '@/types/student';
import {
  cloneGradebooks,
  loadGradebooks,
  saveGradebooks,
} from '@/utils/gradebook';
import type {
  GradebookMappingConflict,
  GradebookStore,
  GradesRepository,
  OfferingGradebook,
} from './types';

function normalizeStudentNumber(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeScore(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

function normalizeEntry(entry: GradeEntry | undefined): GradeEntry {
  return {
    midterm: normalizeScore(entry?.midterm ?? null),
    final: normalizeScore(entry?.final ?? null),
  };
}

function hasPublishedGrade(
  entry: GradeEntry | undefined,
): entry is GradeEntry & { midterm: number; final: number } {
  return !!entry && entry.midterm !== null && entry.final !== null;
}

function applyPublishedGrade(course: CourseRecord, entry: GradeEntry | undefined): CourseRecord {
  return hasPublishedGrade(entry)
    ? { ...course, midterm: entry.midterm, final: entry.final }
    : course;
}

function toRosterCourse(course: AcademicianCourse, studentNumber: string): CourseRecord | null {
  const student = course.roster.find((item) => item.number === studentNumber);

  if (!student) {
    return null;
  }

  return {
    code: course.code,
    name: course.name,
    instructor: COURSES.find((item) => item.code === course.code)?.instructor ?? '',
    credits: course.credits,
    ects: course.ects,
    midterm: student.midterm,
    final: student.final,
    totalHours: 0,
    absentHours: 0,
    room: course.room,
    schedule: course.schedule,
  };
}

function mapLegacyGradebook(store: GradebookStore, model: AcademicModel): OfferingGradebook {
  const grades: CourseGrade[] = [];
  const conflicts: GradebookMappingConflict[] = [];
  const courseCodes = Object.keys(store).sort((left, right) => left.localeCompare(right, 'tr'));

  for (const courseCode of courseCodes) {
    const resolution = resolveOfferingInModel(model, courseCode);

    if (resolution.status === 'missing') {
      conflicts.push({ courseCode, reason: 'missing-offering', offeringIds: [] });
      continue;
    }

    if (resolution.status === 'ambiguous') {
      conflicts.push({
        courseCode,
        reason: 'ambiguous-offering',
        offeringIds: resolution.offerings.map((offering) => offering.id),
      });
      continue;
    }

    const gradeMap = store[courseCode] ?? {};
    const studentNumbers = Object.keys(gradeMap).sort((left, right) =>
      left.localeCompare(right, 'tr'),
    );

    for (const studentNumber of studentNumbers) {
      const entry = normalizeEntry(gradeMap[studentNumber]);

      grades.push({
        offeringId: resolution.offering.id,
        studentNumber,
        midterm: entry.midterm,
        final: entry.final,
      });
    }
  }

  return { grades, conflicts };
}

export const localGradesRepository: GradesRepository = {
  loadAcademicianCourses() {
    return ACADEMICIAN_COURSES;
  },

  loadAcademicianGradebooks() {
    return loadGradebooks(ACADEMICIAN_COURSES);
  },

  saveAcademicianCourseGrades(courseCode, grades) {
    const course = ACADEMICIAN_COURSES.find((item) => item.code === courseCode);

    if (!course) {
      return;
    }

    const sanitized: GradeMap = {};

    for (const student of course.roster) {
      sanitized[student.number] = normalizeEntry(grades[student.number]);
    }

    saveGradebooks({
      ...loadGradebooks(ACADEMICIAN_COURSES),
      [courseCode]: sanitized,
    });
  },

  cloneAcademicianGradebooks(store) {
    return cloneGradebooks(store);
  },

  getStudentGradeView(studentNumber) {
    const number = normalizeStudentNumber(studentNumber);

    if (!number) {
      return { studentNumber: '', term: '', courses: [], hasStaticRecord: false };
    }

    const gradebooks = loadGradebooks(ACADEMICIAN_COURSES);

    if (number === STUDENT.identifier) {
      return {
        studentNumber: number,
        term: STUDENT.term,
        hasStaticRecord: true,
        courses: COURSES.map((course) =>
          applyPublishedGrade(course, gradebooks[course.code]?.[number]),
        ),
      };
    }

    const rosterCourses = ACADEMICIAN_COURSES.filter((course) =>
      course.roster.some((student) => student.number === number),
    );
    const courses: CourseRecord[] = [];

    for (const course of rosterCourses) {
      const record = toRosterCourse(course, number);

      if (record) {
        courses.push(applyPublishedGrade(record, gradebooks[course.code]?.[number]));
      }
    }

    return {
      studentNumber: number,
      term: rosterCourses[0]?.term ?? '',
      courses,
      hasStaticRecord: false,
    };
  },

  loadOfferingGradebook() {
    return mapLegacyGradebook(
      loadGradebooks(ACADEMICIAN_COURSES),
      academicRepository.getModel(),
    );
  },

  getStudentOfferingGrades(studentNumber, offeringId) {
    const number = normalizeStudentNumber(studentNumber);

    if (!number) {
      return { studentNumber: '', grades: [], conflicts: [] };
    }

    const model = academicRepository.getModel();
    const legacy = mapLegacyGradebook(loadGradebooks(ACADEMICIAN_COURSES), model);
    const offeringById = new Map(model.offerings.map((offering) => [offering.id, offering]));
    const blockedCodes = new Set(legacy.conflicts.map((conflict) => conflict.courseCode));

    const grades = model.grades.filter((grade) => {
      if (grade.studentNumber !== number) {
        return false;
      }

      if (offeringId && grade.offeringId !== offeringId) {
        return false;
      }

      const courseCode = offeringById.get(grade.offeringId)?.courseCode;
      return !!courseCode && !blockedCodes.has(courseCode);
    });

    const scopedCode = offeringId ? offeringById.get(offeringId)?.courseCode : undefined;
    const relevantCodes = new Set<string>(scopedCode ? [scopedCode] : []);

    if (!offeringId) {
      for (const enrollment of model.enrollments) {
        if (enrollment.studentNumber !== number) {
          continue;
        }

        const courseCode = offeringById.get(enrollment.offeringId)?.courseCode;

        if (courseCode) {
          relevantCodes.add(courseCode);
        }
      }
    }

    return {
      studentNumber: number,
      grades,
      conflicts: legacy.conflicts.filter((conflict) => relevantCodes.has(conflict.courseCode)),
    };
  },
};
