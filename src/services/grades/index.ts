import { localGradesRepository } from './localRepository';
import type { GradesRepository } from './types';

export const grades: GradesRepository = localGradesRepository;

export type {
  GradebookConflictReason,
  GradebookMappingConflict,
  GradebookStore,
  GradesRepository,
  OfferingGradebook,
  StudentGradeView,
  StudentOfferingGrades,
} from './types';
