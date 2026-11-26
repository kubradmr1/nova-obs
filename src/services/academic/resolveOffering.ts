import type { AcademicModel } from '@/types/academic';
import type { OfferingFilter, OfferingResolution } from './types';

export function resolveOfferingInModel(
  model: AcademicModel,
  courseCode: string,
  filter?: OfferingFilter,
): OfferingResolution {
  const code = courseCode.trim();
  const matches = model.offerings.filter(
    (offering) =>
      offering.courseCode === code &&
      (!filter?.termId || offering.termId === filter.termId) &&
      (!filter?.section || offering.section === filter.section),
  );

  if (matches.length === 0) {
    return { status: 'missing', courseCode: code };
  }

  if (matches.length === 1) {
    return { status: 'found', offering: matches[0] };
  }

  return { status: 'ambiguous', courseCode: code, offerings: matches };
}
