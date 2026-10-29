import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementCategory,
  DefinedCourse,
  RegisteredAcademician,
  RegisteredStudent,
} from '@/types/admin';

export const STUDENTS_STORAGE_KEY = 'obs.admin.students.v1';
export const ACADEMICIANS_STORAGE_KEY = 'obs.admin.academicians.v1';
export const COURSES_STORAGE_KEY = 'obs.admin.courses.v1';
export const ANNOUNCEMENTS_STORAGE_KEY = 'obs.admin.announcements.v1';

export const FACULTIES = [
  {
    name: 'Mühendislik Fakültesi',
    departments: [
      'Bilgisayar Mühendisliği',
      'Yazılım Mühendisliği',
      'Elektrik-Elektronik Mühendisliği',
      'Endüstri Mühendisliği',
    ],
  },
  {
    name: 'Fen-Edebiyat Fakültesi',
    departments: ['Matematik', 'Fizik', 'Kimya', 'İngiliz Dili ve Edebiyatı'],
  },
  {
    name: 'İktisadi ve İdari Bilimler Fakültesi',
    departments: ['İşletme', 'Ekonomi', 'Yönetim Bilişim Sistemleri'],
  },
  {
    name: 'Eğitim Fakültesi',
    departments: ['Bilgisayar ve Öğretim Teknolojileri', 'Rehberlik ve Psikolojik Danışmanlık'],
  },
  {
    name: 'Meslek Yüksekokulu',
    departments: ['Bulut Bilişim Operatörlüğü', 'Bilgisayar Programcılığı', 'Elektrik Enerjisi'],
  },
] as const;

export const CLASS_YEARS = ['Hazırlık', '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf'];

export const ACADEMIC_TITLES = [
  'Prof. Dr.',
  'Doç. Dr.',
  'Dr. Öğr. Üyesi',
  'Öğr. Gör.',
  'Araş. Gör.',
];

export const TERM_OPTIONS = ['2026–2027 Güz', '2026–2027 Bahar'];

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  'Akademik',
  'Sınav',
  'Duyuru',
  'Etkinlik',
];

export const ANNOUNCEMENT_AUDIENCES: AnnouncementAudience[] = [
  'Tümü',
  'Öğrenciler',
  'Akademisyenler',
];

export function departmentsFor(faculty: string): readonly string[] {
  return FACULTIES.find((item) => item.name === faculty)?.departments ?? [];
}

export const SEED_STUDENTS: RegisteredStudent[] = [
  {
    id: 'seed-student-1',
    studentNumber: '2025001501',
    firstName: 'Zeynep',
    lastName: 'Kaya',
    faculty: 'Meslek Yüksekokulu',
    department: 'Bulut Bilişim Operatörlüğü',
    classYear: '1. Sınıf',
    email: 'zeynep.kaya@ogr.uni.edu.tr',
    phone: '0532 000 00 01',
    enrolledAt: '2025',
  },
  {
    id: 'seed-student-2',
    studentNumber: '2025001488',
    firstName: 'Emre',
    lastName: 'Aydın',
    faculty: 'Mühendislik Fakültesi',
    department: 'Yazılım Mühendisliği',
    classYear: '1. Sınıf',
    email: 'emre.aydin@ogr.uni.edu.tr',
    phone: '0532 000 00 02',
    enrolledAt: '2025',
  },
  {
    id: 'seed-student-3',
    studentNumber: '2024001310',
    firstName: 'Selin',
    lastName: 'Öztürk',
    faculty: 'Mühendislik Fakültesi',
    department: 'Elektrik-Elektronik Mühendisliği',
    classYear: '2. Sınıf',
    email: 'selin.ozturk@ogr.uni.edu.tr',
    phone: '0532 000 00 03',
    enrolledAt: '2024',
  },
];

export const SEED_ACADEMICIANS: RegisteredAcademician[] = [
  {
    id: 'seed-academician-1',
    title: 'Dr. Öğr. Üyesi',
    firstName: 'Burak',
    lastName: 'Şen',
    email: 'burak.sen@uni.edu.tr',
    faculty: 'Mühendislik Fakültesi',
    department: 'Bilgisayar Mühendisliği',
    office: 'D-312',
    phone: '0312 000 00 21',
  },
  {
    id: 'seed-academician-2',
    title: 'Doç. Dr.',
    firstName: 'Ece',
    lastName: 'Yalçın',
    email: 'ece.yalcin@uni.edu.tr',
    faculty: 'Fen-Edebiyat Fakültesi',
    department: 'Matematik',
    office: 'A-306',
    phone: '0312 000 00 22',
  },
];

export const SEED_COURSES: DefinedCourse[] = [
  {
    id: 'seed-course-1',
    code: 'BM101',
    name: 'Programlamaya Giriş',
    faculty: 'Mühendislik Fakültesi',
    department: 'Bilgisayar Mühendisliği',
    instructor: 'Dr. Öğr. Üyesi Burak Şen',
    credits: 3,
    ects: 5,
    term: '2026–2027 Güz',
    quota: 60,
  },
  {
    id: 'seed-course-2',
    code: 'MAT101',
    name: 'Matematik I',
    faculty: 'Fen-Edebiyat Fakültesi',
    department: 'Matematik',
    instructor: 'Doç. Dr. Ece Yalçın',
    credits: 4,
    ects: 6,
    term: '2026–2027 Güz',
    quota: 70,
  },
];

function daysAgo(days: number, hour = 10): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const SEED_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'seed-announcement-1',
    title: 'Vize haftası takvimi yayımlandı',
    body: '2026–2027 Güz dönemi ara sınav takvimi öğrenci paneline işlendi. Sınav salonu bilgileri ders sayfalarından takip edilebilir. Mazeret sınavı başvuruları vize haftasını takip eden 5 iş günü içinde yapılacaktır.',
    category: 'Sınav',
    audience: 'Öğrenciler',
    pinned: true,
    createdAt: daysAgo(2),
    author: 'Öğrenci İşleri',
  },
  {
    id: 'seed-announcement-2',
    title: 'Bahar dönemi ders kayıtları 2 Şubat’ta başlıyor',
    body: 'Bahar dönemi ders kayıt işlemleri 2 Şubat 2027 tarihinde başlayacak. Danışman onayları 12 Şubat’a kadar tamamlanmalıdır. Kayıt süreciyle ilgili ayrıntılı kılavuz sistem duyurularında paylaşılacaktır.',
    category: 'Akademik',
    audience: 'Tümü',
    pinned: false,
    createdAt: daysAgo(5),
    author: 'Akademik Takvim Ofisi',
  },
  {
    id: 'seed-announcement-3',
    title: 'Kütüphane çalışma saatleri güncellendi',
    body: 'Merkez kütüphane final dönemi boyunca hafta içi 08.00–24.00, hafta sonu 10.00–22.00 saatleri arasında hizmet verecektir. Grup çalışma odaları için online rezervasyon sistemi aktif.',
    category: 'Duyuru',
    audience: 'Tümü',
    pinned: false,
    createdAt: daysAgo(8),
    author: 'Kütüphane Müdürlüğü',
  },
];
