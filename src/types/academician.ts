export interface AcademicianProfile {
  id: string;
  name: string;
  title: string;
  email: string;
  faculty: string;
  department: string;
  office: string;
  officeHours: string;
}

export interface RosterStudent {
  number: string;
  name: string;
  midterm: number;
  final: number;
}

export interface AcademicianCourse {
  code: string;
  name: string;
  term: string;
  schedule: string;
  room: string;
  credits: number;
  ects: number;
  roster: RosterStudent[];
}

export interface GradeEntry {
  midterm: number | null;
  final: number | null;
}

export type GradeMap = Record<string, GradeEntry>;
