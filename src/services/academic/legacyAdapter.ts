import { ACADEMICIAN_COURSES } from '@/data/academician';
import {
  ACADEMICIANS_STORAGE_KEY,
  COURSES_STORAGE_KEY,
  SEED_ACADEMICIANS,
  SEED_COURSES,
  TERM_OPTIONS,
} from '@/data/admin';
import { ACADEMICIANS } from '@/data/academicians';
import {
  ELECTIVE_CURRICULUM,
  REGISTRATION_STORAGE_KEY,
  REQUIRED_CURRICULUM,
  SEED_REGISTRATION,
} from '@/data/curriculum';
import { ACADEMIC_HISTORY, COURSES, STUDENT } from '@/data/student';
import type {
  AcademicModel,
  AcademicTerm,
  CatalogCourse,
  CourseGrade,
  CourseOffering,
  Enrollment,
  EnrollmentSource,
  EnrollmentStatus,
  LegacyConflict,
  TermStatus,
} from '@/types/academic';
import type { DefinedCourse, RegisteredAcademician } from '@/types/admin';
import type { CourseRegistrationState } from '@/types/student';
import { loadGradebooks } from '@/utils/gradebook';
import { readCollection, readJson } from '@/utils/storage';

const TERM_PATTERN = /^(\d{4})[–-](\d{4})\s+(Güz|Bahar|Yaz)$/;
const SEASON_SEQUENCE: Record<string, number> = { Güz: 0, Bahar: 1, Yaz: 2 };
const SEASON_SLUG: Record<string, string> = { Güz: 'guz', Bahar: 'bahar', Yaz: 'yaz' };
const TR_SLUG_CHARS: Record<string, string> = {
  ş: 's',
  ğ: 'g',
  ü: 'u',
  ö: 'o',
  ç: 'c',
  ı: 'i',
};

interface TermDescriptor {
  label: string;
  id: string;
  sequence: number;
}

function describeTerm(label: string): TermDescriptor {
  const match = label.match(TERM_PATTERN);

  if (match) {
    const season = match[3];
    return {
      label,
      id: `${match[1]}-${match[2]}-${SEASON_SLUG[season]}`,
      sequence: Number(match[1]) * 4 + SEASON_SEQUENCE[season],
    };
  }

  const slug = label
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[şğüöçı–—]/g, (char) => TR_SLUG_CHARS[char] ?? '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return { label, id: slug || 'term', sequence: Number.MAX_SAFE_INTEGER };
}

function resolveTermStatus(label: string): TermStatus {
  if (label === STUDENT.term) {
    return 'active';
  }

  const semester = ACADEMIC_HISTORY.find((entry) => entry.term === label);

  if (semester?.status === 'completed') {
    return 'closed';
  }

  if (semester?.status === 'ongoing') {
    return 'active';
  }

  return 'planned';
}

function collectTermLabels(
  definedCourses: DefinedCourse[],
  registration: CourseRegistrationState,
): string[] {
  return Array.from(
    new Set([
      ...ACADEMIC_HISTORY.map((semester) => semester.term),
      ...TERM_OPTIONS,
      STUDENT.term,
      ...ACADEMICIAN_COURSES.map((course) => course.term),
      ...definedCourses.map((course) => course.term),
      registration.term,
    ]),
  );
}

function buildTermTable(labels: string[]): {
  terms: AcademicTerm[];
  idByLabel: Map<string, string>;
} {
  const descriptors = labels.map(describeTerm).sort((left, right) =>
    left.sequence === right.sequence
      ? left.label.localeCompare(right.label, 'tr')
      : left.sequence - right.sequence,
  );

  const usedIds = new Set<string>();
  const idByLabel = new Map<string, string>();
  const terms: AcademicTerm[] = [];

  for (const descriptor of descriptors) {
    let id = descriptor.id;
    let suffix = 2;

    while (usedIds.has(id)) {
      id = `${descriptor.id}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(id);
    idByLabel.set(descriptor.label, id);
    terms.push({
      id,
      label: descriptor.label,
      sequence: descriptor.sequence,
      status: resolveTermStatus(descriptor.label),
    });
  }

  return { terms, idByLabel };
}

function primaryByCode<T extends { code: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();

  for (const item of items) {
    if (!map.has(item.code)) {
      map.set(item.code, item);
    }
  }

  return map;
}

function buildCatalog(definedCourses: DefinedCourse[]): CatalogCourse[] {
  const requiredCodes = new Set(REQUIRED_CURRICULUM.map((course) => course.code));
  const catalog = new Map<string, CatalogCourse>();

  const register = (course: CatalogCourse) => {
    if (!catalog.has(course.code)) {
      catalog.set(course.code, course);
    }
  };

  for (const course of COURSES) {
    register({
      code: course.code,
      name: course.name,
      defaultCredits: course.credits,
      defaultEcts: course.ects,
      category: requiredCodes.has(course.code) ? 'Zorunlu' : undefined,
    });
  }

  for (const course of ACADEMICIAN_COURSES) {
    register({
      code: course.code,
      name: course.name,
      defaultCredits: course.credits,
      defaultEcts: course.ects,
    });
  }

  for (const course of definedCourses) {
    register({
      code: course.code,
      name: course.name,
      faculty: course.faculty,
      department: course.department,
      defaultCredits: course.credits,
      defaultEcts: course.ects,
    });
  }

  for (const course of ELECTIVE_CURRICULUM) {
    register({
      code: course.code,
      name: course.name,
      defaultCredits: course.credits,
      defaultEcts: course.ects,
      category: course.category,
    });
  }

  return [...catalog.values()].sort((left, right) =>
    left.code.localeCompare(right.code, 'tr'),
  );
}

function buildInstructorIndex(registered: RegisteredAcademician[]): Map<string, string> {
  const index = new Map<string, string>();

  for (const profile of ACADEMICIANS) {
    index.set(profile.name, profile.id);
  }

  for (const profile of registered) {
    index.set(`${profile.title} ${profile.firstName} ${profile.lastName}`, profile.id);
  }

  return index;
}

function buildOfferings(
  definedCourses: DefinedCourse[],
  idByLabel: Map<string, string>,
  catalog: CatalogCourse[],
  registered: RegisteredAcademician[],
): CourseOffering[] {
  const instructorIndex = buildInstructorIndex(registered);
  const studentCourses = primaryByCode(COURSES);
  const academicianCourses = primaryByCode(ACADEMICIAN_COURSES);
  const definedCoursesByCode = primaryByCode(definedCourses);
  const electives = primaryByCode(ELECTIVE_CURRICULUM);
  const offerings: CourseOffering[] = [];

  for (const catalogCourse of catalog) {
    const { code } = catalogCourse;
    const academicianCourse = academicianCourses.get(code);
    const studentCourse = studentCourses.get(code);
    const definedCourse = definedCoursesByCode.get(code);
    const elective = electives.get(code);

    let termLabel = STUDENT.term;
    let instructorName = '';
    let schedule = '';
    let room = '';
    let credits = catalogCourse.defaultCredits;
    let ects = catalogCourse.defaultEcts;
    let quota: number | null = null;

    if (academicianCourse) {
      termLabel = academicianCourse.term;
      instructorName = studentCourse?.instructor ?? '';
      schedule = academicianCourse.schedule;
      room = academicianCourse.room;
      credits = academicianCourse.credits;
      ects = academicianCourse.ects;
    } else if (studentCourse) {
      instructorName = studentCourse.instructor;
      schedule = studentCourse.schedule;
      room = studentCourse.room;
      credits = studentCourse.credits;
      ects = studentCourse.ects;
    } else if (definedCourse) {
      termLabel = definedCourse.term;
      instructorName = definedCourse.instructor;
      credits = definedCourse.credits;
      ects = definedCourse.ects;
      quota = definedCourse.quota;
    } else if (elective) {
      instructorName = elective.instructor;
      schedule = elective.schedule;
      room = elective.room;
      credits = elective.credits;
      ects = elective.ects;
      quota = elective.quota ?? null;
    }

    const termId = idByLabel.get(termLabel) ?? termLabel;
    const section = '01';

    offerings.push({
      id: `${termId}:${code}:${section}`,
      termId,
      courseCode: code,
      section,
      instructorId: instructorName ? instructorIndex.get(instructorName) : undefined,
      instructorName,
      schedule,
      room,
      credits,
      ects,
      quota,
      status: 'open',
    });
  }

  return offerings.sort((left, right) => left.courseCode.localeCompare(right.courseCode, 'tr'));
}

function buildEnrollments(
  offerings: CourseOffering[],
  registration: CourseRegistrationState,
): Enrollment[] {
  const offeringByCode = new Map<string, CourseOffering>();

  for (const offering of offerings) {
    offeringByCode.set(offering.courseCode, offering);
  }

  const enrollments = new Map<string, Enrollment>();

  const add = (
    studentNumber: string,
    courseCode: string,
    status: EnrollmentStatus,
    source: EnrollmentSource,
    dates: { registeredAt?: string; approvedAt?: string } = {},
  ) => {
    const offering = offeringByCode.get(courseCode);

    if (!offering) {
      return;
    }

    const id = `${offering.id}:${studentNumber}`;

    if (enrollments.has(id)) {
      return;
    }

    enrollments.set(id, {
      id,
      studentNumber,
      offeringId: offering.id,
      status,
      source,
      registeredAt: dates.registeredAt,
      approvedAt: dates.approvedAt,
    });
  };

  for (const course of ACADEMICIAN_COURSES) {
    for (const student of course.roster) {
      add(student.number, course.code, 'approved', 'roster');
    }
  }

  for (const course of COURSES) {
    add(STUDENT.identifier, course.code, 'approved', 'record');
  }

  const registrationDates = {
    registeredAt: registration.submittedAt ?? registration.updatedAt,
    approvedAt: registration.status === 'approved' ? registration.approvedAt : undefined,
  };

  for (const code of registration.selectedElectives) {
    add(STUDENT.identifier, code, registration.status, 'registration', registrationDates);
  }

  return [...enrollments.values()].sort((left, right) =>
    left.studentNumber === right.studentNumber
      ? left.offeringId.localeCompare(right.offeringId, 'tr')
      : left.studentNumber.localeCompare(right.studentNumber, 'tr'),
  );
}

function buildGrades(offerings: CourseOffering[]): CourseGrade[] {
  const offeringByCode = new Map<string, CourseOffering>();

  for (const offering of offerings) {
    offeringByCode.set(offering.courseCode, offering);
  }

  const gradebooks = loadGradebooks(ACADEMICIAN_COURSES);
  const grades = new Map<string, CourseGrade>();

  const add = (
    courseCode: string,
    studentNumber: string,
    midterm: number | null,
    final: number | null,
  ) => {
    const offering = offeringByCode.get(courseCode);

    if (!offering) {
      return;
    }

    const id = `${offering.id}:${studentNumber}`;

    if (grades.has(id)) {
      return;
    }

    grades.set(id, { offeringId: offering.id, studentNumber, midterm, final });
  };

  for (const course of ACADEMICIAN_COURSES) {
    const gradeMap = gradebooks[course.code] ?? {};

    for (const student of course.roster) {
      const entry = gradeMap[student.number];

      add(
        course.code,
        student.number,
        entry ? entry.midterm : student.midterm,
        entry ? entry.final : student.final,
      );
    }
  }

  for (const course of COURSES) {
    add(course.code, STUDENT.identifier, course.midterm, course.final);
  }

  return [...grades.values()].sort((left, right) =>
    left.studentNumber === right.studentNumber
      ? left.offeringId.localeCompare(right.offeringId, 'tr')
      : left.studentNumber.localeCompare(right.studentNumber, 'tr'),
  );
}

export function buildLegacyAcademicModel(): AcademicModel {
  const definedCourses = readCollection<DefinedCourse>(COURSES_STORAGE_KEY, SEED_COURSES);
  const registration =
    readJson<CourseRegistrationState>(REGISTRATION_STORAGE_KEY) ?? SEED_REGISTRATION;
  const registered = readCollection<RegisteredAcademician>(
    ACADEMICIANS_STORAGE_KEY,
    SEED_ACADEMICIANS,
  );

  const { terms, idByLabel } = buildTermTable(collectTermLabels(definedCourses, registration));
  const catalog = buildCatalog(definedCourses);
  const offerings = buildOfferings(definedCourses, idByLabel, catalog, registered);
  const enrollments = buildEnrollments(offerings, registration);
  const grades = buildGrades(offerings);

  return { terms, catalog, offerings, enrollments, grades };
}

export function describeLegacyConflicts(): LegacyConflict[] {
  const model = buildLegacyAcademicModel();
  const conflicts: LegacyConflict[] = [];

  const currentSemester = ACADEMIC_HISTORY.find(
    (semester) => semester.term === STUDENT.term && semester.status === 'ongoing',
  );

  if (currentSemester) {
    const courseEcts = COURSES.reduce((total, course) => total + course.ects, 0);

    if (currentSemester.ects !== courseEcts) {
      conflicts.push({
        code: 'C7',
        severity: 'warning',
        message: `${STUDENT.term} için ACADEMIC_HISTORY ${currentSemester.ects} AKTS, COURSES toplamı ${courseEcts} AKTS.`,
      });
    }
  }

  const completed = ACADEMIC_HISTORY.filter((semester) => semester.status === 'completed');
  const completedEcts = completed.reduce((total, semester) => total + semester.ects, 0);

  if (completedEcts > 0) {
    const weightedGpa = completed.reduce(
      (total, semester) => total + semester.gpa * semester.ects,
      0,
    );
    const derivedGpa = weightedGpa / completedEcts;

    if (Math.abs(derivedGpa - STUDENT.cumulativeGpa) > 0.005) {
      conflicts.push({
        code: 'C8',
        severity: 'warning',
        message: `Tamamlanan dönemlerin AKTS ağırlıklı GANO ortalaması ${derivedGpa.toFixed(2)}, STUDENT.cumulativeGpa ${STUDENT.cumulativeGpa.toFixed(2)}.`,
      });
    }
  }

  const registration =
    readJson<CourseRegistrationState>(REGISTRATION_STORAGE_KEY) ?? SEED_REGISTRATION;
  const rawRegistration = registration as unknown as Record<string, unknown>;

  if (typeof rawRegistration.studentNumber !== 'string') {
    conflicts.push({
      code: 'C9',
      severity: 'warning',
      message:
        'obs.course.registration.v1 öğrenci numarası taşımıyor; kayıt durumu tüm oturumlarda ortak görünür.',
    });
  }

  const seenIdentities = new Map<
    string,
    { source: string; name: string; credits: number; ects: number }
  >();
  const sources = [
    { source: 'COURSES', courses: COURSES },
    { source: 'ACADEMICIAN_COURSES', courses: ACADEMICIAN_COURSES },
    { source: 'obs.admin.courses.v1', courses: readCollection<DefinedCourse>(COURSES_STORAGE_KEY, SEED_COURSES) },
    { source: 'ELECTIVE_CURRICULUM', courses: ELECTIVE_CURRICULUM },
  ];

  for (const { source, courses } of sources) {
    for (const course of courses) {
      const existing = seenIdentities.get(course.code);

      if (!existing) {
        seenIdentities.set(course.code, {
          source,
          name: course.name,
          credits: course.credits,
          ects: course.ects,
        });
        continue;
      }

      if (
        existing.name !== course.name ||
        existing.credits !== course.credits ||
        existing.ects !== course.ects
      ) {
        conflicts.push({
          code: 'D1',
          severity: 'warning',
          message: `${course.code} birden fazla kaynakta farklı tanımlı: ${existing.source} ile ${source}.`,
        });
      }
    }
  }

  const offeringCodes = new Set(model.offerings.map((offering) => offering.courseCode));
  const unoffered = registration.selectedElectives.filter((code) => !offeringCodes.has(code));

  if (unoffered.length > 0) {
    conflicts.push({
      code: 'R1',
      severity: 'warning',
      message: `Kayıtta seçili olup açılımı bulunmayan dersler: ${unoffered.join(', ')}.`,
    });
  }

  const termIds = new Set(model.terms.map((term) => term.id));
  const dangling = model.offerings.filter((offering) => !termIds.has(offering.termId));

  if (dangling.length > 0) {
    conflicts.push({
      code: 'M1',
      severity: 'error',
      message: `${dangling.length} ders açılımı tanımsız bir döneme bağlı.`,
    });
  }

  const unidentified = model.offerings.filter((offering) => !offering.instructorId).length;

  if (unidentified > 0) {
    conflicts.push({
      code: 'C5',
      severity: 'info',
      message: `${unidentified} ders açılımında eğitmen kimliği eşlenemedi; yalnızca ad veya boş değer taşınıyor.`,
    });
  }

  return conflicts;
}
