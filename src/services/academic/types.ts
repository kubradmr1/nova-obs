import type {
  AcademicModel,
  AcademicTerm,
  CatalogCourse,
  CourseOffering,
  Enrollment,
} from '@/types/academic';

export interface OfferingFilter {
  termId?: string;
  section?: string;
}

export type OfferingResolution =
  | { status: 'found'; offering: CourseOffering }
  | { status: 'missing'; courseCode: string }
  | { status: 'ambiguous'; courseCode: string; offerings: CourseOffering[] };

export interface EnrollmentFilter {
  studentNumber?: string;
  offeringId?: string;
  termId?: string;
}

export interface AcademicRepository {
  getModel(): AcademicModel;
  listTerms(): AcademicTerm[];
  getTerm(termId: string): AcademicTerm | null;
  listCatalogCourses(): CatalogCourse[];
  getCatalogCourse(code: string): CatalogCourse | null;
  listOfferings(termId?: string): CourseOffering[];
  getOffering(offeringId: string): CourseOffering | null;
  getOfferingsByCode(courseCode: string): CourseOffering[];
  resolveOffering(courseCode: string, filter?: OfferingFilter): OfferingResolution;
  listEnrollments(filter?: EnrollmentFilter): Enrollment[];
  getStudentEnrollments(studentNumber: string): Enrollment[];
}
