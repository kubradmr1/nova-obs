import type { CourseCategory } from '@/types/student';

export type TermStatus = 'planned' | 'active' | 'closed';

export interface AcademicTerm {
  /** Deterministik kimlik, örn. "2026-2027-guz". */
  id: string;
  /** Eski verilerdeki etiketle birebir aynı, örn. "2026–2027 Güz". */
  label: string;
  sequence: number;
  status: TermStatus;
}

export interface CatalogCourse {
  code: string;
  name: string;
  faculty?: string;
  department?: string;
  defaultCredits: number;
  defaultEcts: number;
  category?: CourseCategory;
}

export type OfferingStatus = 'open' | 'closed';

export interface CourseOffering {
  /** Dönem + ders kodu + şube, örn. "2026-2027-guz:BM201:01". */
  id: string;
  termId: string;
  courseCode: string;
  section: string;
  instructorId?: string;
  instructorName: string;
  schedule: string;
  room: string;
  credits: number;
  ects: number;
  quota: number | null;
  status: OfferingStatus;
}

export type EnrollmentStatus = 'draft' | 'pending' | 'approved';

export type EnrollmentSource = 'record' | 'roster' | 'registration' | 'admin';

export interface Enrollment {
  id: string;
  studentNumber: string;
  offeringId: string;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  /** Tarih yalnızca kaynak veride varsa taşınır; uydurulmaz. */
  registeredAt?: string;
  approvedAt?: string;
}

export interface CourseGrade {
  offeringId: string;
  studentNumber: string;
  midterm: number | null;
  final: number | null;
}

export interface AcademicModel {
  terms: AcademicTerm[];
  catalog: CatalogCourse[];
  offerings: CourseOffering[];
  enrollments: Enrollment[];
  grades: CourseGrade[];
}

export type ConflictSeverity = 'info' | 'warning' | 'error';

export interface LegacyConflict {
  code: string;
  severity: ConflictSeverity;
  message: string;
}
