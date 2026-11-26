import type { AcademicModel, Enrollment } from '@/types/academic';
import { buildLegacyAcademicModel } from './legacyAdapter';
import { resolveOfferingInModel } from './resolveOffering';
import type {
  AcademicRepository,
  EnrollmentFilter,
  OfferingResolution,
} from './types';

function currentModel(): AcademicModel {
  return buildLegacyAcademicModel();
}

function filterEnrollments(model: AcademicModel, filter?: EnrollmentFilter): Enrollment[] {
  const studentNumber = filter?.studentNumber?.trim();
  const termOfferingIds = filter?.termId
    ? new Set(
        model.offerings
          .filter((offering) => offering.termId === filter.termId)
          .map((offering) => offering.id),
      )
    : null;

  return model.enrollments.filter(
    (enrollment) =>
      (!studentNumber || enrollment.studentNumber === studentNumber) &&
      (!filter?.offeringId || enrollment.offeringId === filter.offeringId) &&
      (!termOfferingIds || termOfferingIds.has(enrollment.offeringId)),
  );
}

export const localAcademicRepository: AcademicRepository = {
  getModel() {
    return currentModel();
  },

  listTerms() {
    return currentModel().terms;
  },

  getTerm(termId) {
    return currentModel().terms.find((term) => term.id === termId) ?? null;
  },

  listCatalogCourses() {
    return currentModel().catalog;
  },

  getCatalogCourse(code) {
    const normalized = code.trim();
    return currentModel().catalog.find((course) => course.code === normalized) ?? null;
  },

  listOfferings(termId) {
    const { offerings } = currentModel();
    return termId ? offerings.filter((offering) => offering.termId === termId) : offerings;
  },

  getOffering(offeringId) {
    return currentModel().offerings.find((offering) => offering.id === offeringId) ?? null;
  },

  getOfferingsByCode(courseCode) {
    const normalized = courseCode.trim();
    return currentModel().offerings.filter((offering) => offering.courseCode === normalized);
  },

  resolveOffering(courseCode, filter): OfferingResolution {
    return resolveOfferingInModel(currentModel(), courseCode, filter);
  },

  listEnrollments(filter) {
    return filterEnrollments(currentModel(), filter);
  },

  getStudentEnrollments(studentNumber) {
    const normalized = studentNumber.trim();
    return normalized ? filterEnrollments(currentModel(), { studentNumber: normalized }) : [];
  },
};
