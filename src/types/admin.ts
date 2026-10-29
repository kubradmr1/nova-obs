export interface RegisteredStudent {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  faculty: string;
  department: string;
  classYear: string;
  email: string;
  phone: string;
  enrolledAt: string;
}

export interface RegisteredAcademician {
  id: string;
  email: string;
  title: string;
  firstName: string;
  lastName: string;
  faculty: string;
  department: string;
  office: string;
  phone: string;
}

export interface DefinedCourse {
  id: string;
  code: string;
  name: string;
  faculty: string;
  department: string;
  instructor: string;
  credits: number;
  ects: number;
  term: string;
  quota: number;
}

export type AnnouncementCategory = 'Akademik' | 'Sınav' | 'Duyuru' | 'Etkinlik';

export type AnnouncementAudience = 'Tümü' | 'Öğrenciler' | 'Akademisyenler';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  audience: AnnouncementAudience;
  pinned: boolean;
  createdAt: string;
  author: string;
}
