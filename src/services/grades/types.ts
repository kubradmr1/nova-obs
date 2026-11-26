import type { AcademicianCourse, GradeMap } from '@/types/academician';
import type { CourseGrade } from '@/types/academic';
import type { CourseRecord } from '@/types/student';

export type GradebookStore = Record<string, GradeMap>;

export type GradebookConflictReason = 'missing-offering' | 'ambiguous-offering';

export interface GradebookMappingConflict {
  courseCode: string;
  reason: GradebookConflictReason;
  offeringIds: string[];
}

export interface OfferingGradebook {
  grades: CourseGrade[];
  conflicts: GradebookMappingConflict[];
}

export interface StudentOfferingGrades {
  studentNumber: string;
  grades: CourseGrade[];
  conflicts: GradebookMappingConflict[];
}

export interface StudentGradeView {
  studentNumber: string;
  term: string;
  courses: CourseRecord[];
  /**
   * Statik müfredat, geçmiş dönemler ve kümülatif GANO yalnızca asıl demo
   * öğrencisi için tanımlıdır; başka numaralara gösterilmemelidir.
   */
  hasStaticRecord: boolean;
}

export interface GradesRepository {
  loadAcademicianCourses(): AcademicianCourse[];
  loadAcademicianGradebooks(): GradebookStore;
  saveAcademicianCourseGrades(courseCode: string, grades: GradeMap): void;
  cloneAcademicianGradebooks(store: GradebookStore): GradebookStore;
  getStudentGradeView(studentNumber: string | null | undefined): StudentGradeView;
  loadOfferingGradebook(): OfferingGradebook;
  getStudentOfferingGrades(
    studentNumber: string | null | undefined,
    offeringId?: string,
  ): StudentOfferingGrades;
}
