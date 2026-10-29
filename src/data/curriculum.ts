import { COURSES, STUDENT } from '@/data/student';
import type {
  CourseRegistrationState,
  CurriculumCourse,
} from '@/types/student';

export const REGISTRATION_STORAGE_KEY = 'obs.course.registration.v1';

export const AKTS_TARGET = 30;
export const AKTS_MAX = 40;

export const REQUIRED_CURRICULUM: CurriculumCourse[] = COURSES.map((course) => ({
  code: course.code,
  name: course.name,
  instructor: course.instructor,
  credits: course.credits,
  ects: course.ects,
  category: 'Zorunlu',
  schedule: course.schedule,
  room: course.room,
}));

export const ELECTIVE_CURRICULUM: CurriculumCourse[] = [
  {
    code: 'BM211',
    name: 'Bulut Güvenliği ve Uyumluluk',
    instructor: 'Dr. Öğr. Üyesi Cafer Ahmet Çınar',
    credits: 3,
    ects: 4,
    category: 'Seçmeli',
    schedule: 'Pazartesi 13.30',
    room: 'CLD-02',
    quota: 30,
    enrolled: 18,
    description: 'IAM, şifreleme ve KVKK uyumlu bulut güvenliği temelleri.',
  },
  {
    code: 'BM213',
    name: 'Konteyner Orkestrasyonu',
    instructor: 'Dr. Öğr. Üyesi Mert Aydın',
    credits: 3,
    ects: 4,
    category: 'Seçmeli',
    schedule: 'Salı 15.30',
    room: 'CLD-01',
    quota: 24,
    enrolled: 21,
    description: 'Docker ve Kubernetes ile ölçeklenebilir servis yönetimi.',
  },
  {
    code: 'BM215',
    name: 'Sunucusuz Mimari',
    instructor: 'Dr. Öğr. Üyesi Cafer Ahmet Çınar',
    credits: 2,
    ects: 3,
    category: 'Seçmeli',
    schedule: 'Çarşamba 13.30',
    room: 'CLD-02',
    quota: 28,
    enrolled: 14,
    description: 'FaaS, olay tabanlı tetikleyiciler ve yönetilen servisler.',
  },
  {
    code: 'BM217',
    name: 'Veri Merkezi İşletimi',
    instructor: 'Doç. Dr. Selin Kara',
    credits: 2,
    ects: 3,
    category: 'Seçmeli',
    schedule: 'Perşembe 09.00',
    room: 'B-101',
    quota: 26,
    enrolled: 12,
    description: 'Enerji, soğutma, yedeklilik ve veri merkezi SLA yönetimi.',
  },
  {
    code: 'BM219',
    name: 'Bulut Maliyet Yönetimi',
    instructor: 'Doç. Dr. Okan Yıldız',
    credits: 2,
    ects: 2,
    category: 'Seçmeli',
    schedule: 'Cuma 11.30',
    room: 'A-305',
    quota: 32,
    enrolled: 23,
    description: 'FinOps yaklaşımıyla bulut harcamalarını izleme ve optimize etme.',
  },
  {
    code: 'BM221',
    name: 'Siber Olay Müdahalesi',
    instructor: 'Prof. Dr. Ayşe Kaya',
    credits: 3,
    ects: 4,
    category: 'Seçmeli',
    schedule: 'Cuma 15.30',
    room: 'D-204',
    quota: 24,
    enrolled: 19,
    description: 'Olay tespiti, müdahale adımları ve adli bilişim izleri.',
  },
];

export const TERM_CURRICULUM: CurriculumCourse[] = [
  ...REQUIRED_CURRICULUM,
  ...ELECTIVE_CURRICULUM,
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(11, 15, 0, 0);
  return date.toISOString();
}

export const SEED_REGISTRATION: CourseRegistrationState = {
  term: STUDENT.term,
  selectedElectives: ['BM211', 'BM219'],
  status: 'approved',
  updatedAt: daysAgo(2),
  submittedAt: daysAgo(3),
  approvedAt: daysAgo(2),
};

export function summarizeSelection(selectedElectives: string[]) {
  const selected = [
    ...REQUIRED_CURRICULUM,
    ...ELECTIVE_CURRICULUM.filter((course) => selectedElectives.includes(course.code)),
  ];

  return {
    courses: selected,
    credits: selected.reduce((total, course) => total + course.credits, 0),
    ects: selected.reduce((total, course) => total + course.ects, 0),
    electiveCount: selected.length - REQUIRED_CURRICULUM.length,
  };
}
