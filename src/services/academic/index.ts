import { localAcademicRepository } from './localRepository';
import type { AcademicRepository } from './types';

export const academicRepository: AcademicRepository = localAcademicRepository;

export { resolveOfferingInModel } from './resolveOffering';

export type {
  AcademicRepository,
  EnrollmentFilter,
  OfferingFilter,
  OfferingResolution,
} from './types';
