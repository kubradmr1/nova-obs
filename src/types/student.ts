export type LetterGrade = 'AA' | 'BA' | 'BB' | 'CB' | 'CC' | 'DC' | 'DD' | 'FD' | 'FF';

export interface LetterScaleEntry {
  letter: LetterGrade;
  min: number;
  points: number;
}

export interface CourseRecord {
  code: string;
  name: string;
  instructor: string;
  credits: number;
  ects: number;
  midterm: number;
  final: number;
  totalHours: number;
  absentHours: number;
  room: string;
  schedule: string;
}

export type AttendanceStatus = 'safe' | 'risk' | 'critical';

export interface StudentProfile {
  name: string;
  identifier: string;
  email: string;
  phone: string;
  faculty: string;
  department: string;
  program: string;
  classYear: string;
  enrolledAt: string;
  advisor: string;
  term: string;
  totalEcts: number;
  completedEcts: number;
  cumulativeGpa: number;
}

export interface UpcomingExam {
  id: string;
  courseCode: string;
  title: string;
  type: 'Sınav' | 'Teslim';
  location: string;
  time: string;
  inDays: number;
}

export interface AbsenceRecord {
  id: string;
  courseCode: string;
  hours: number;
  daysAgo: number;
}

export interface SemesterRecord {
  term: string;
  ects: number;
  gpa: number;
  status: 'completed' | 'ongoing';
}

export type ExamType = 'Vize' | 'Final' | 'Bütünleme';

export interface ExamScheduleEntry {
  id: string;
  courseCode: string;
  courseName: string;
  type: ExamType;
  startsAt: string;
  room: string;
  seat: string;
  durationMinutes: number;
}

export type CourseCategory = 'Zorunlu' | 'Seçmeli';

export interface CurriculumCourse {
  code: string;
  name: string;
  instructor: string;
  credits: number;
  ects: number;
  category: CourseCategory;
  schedule: string;
  room: string;
  quota?: number;
  enrolled?: number;
  description?: string;
}

export type AdvisorApprovalStatus = 'draft' | 'pending' | 'approved';

export interface CourseRegistrationState {
  term: string;
  selectedElectives: string[];
  status: AdvisorApprovalStatus;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

export type FormRequestStatus = 'Hazırlanıyor' | 'Onay bekliyor' | 'Tamamlandı';

export interface StudentFormRequest {
  id: string;
  typeId: string;
  typeLabel: string;
  note: string;
  createdAt: string;
  status: FormRequestStatus;
}
