import type { AcademicianProfile } from '@/types/academician';
import type { SessionUser } from '@/types/auth';

export const ACADEMICIANS: AcademicianProfile[] = [
  {
    id: 'cafer',
    name: 'Dr. Öğr. Üyesi Cafer Ahmet Çınar',
    title: 'Dr. Öğr. Üyesi',
    email: 'cafer.cinar@uni.edu.tr',
    faculty: 'Meslek Yüksekokulu',
    department: 'Bulut Bilişim Operatörlüğü',
    office: 'V-204',
    officeHours: 'Salı 14.00 – 16.00',
  },
  {
    id: 'mert',
    name: 'Dr. Öğr. Üyesi Mert Aydın',
    title: 'Dr. Öğr. Üyesi',
    email: 'mert.aydin@uni.edu.tr',
    faculty: 'Mühendislik Fakültesi',
    department: 'Bilgisayar Mühendisliği',
    office: 'D-310',
    officeHours: 'Salı 14.00 – 16.00',
  },
  {
    id: 'selin',
    name: 'Doç. Dr. Selin Kara',
    title: 'Doç. Dr.',
    email: 'selin.kara@uni.edu.tr',
    faculty: 'Mühendislik Fakültesi',
    department: 'Bilgisayar Mühendisliği',
    office: 'D-306',
    officeHours: 'Çarşamba 10.00 – 12.00',
  },
  {
    id: 'can',
    name: 'Dr. Öğr. Üyesi Can Demir',
    title: 'Dr. Öğr. Üyesi',
    email: 'can.demir@uni.edu.tr',
    faculty: 'Mühendislik Fakültesi',
    department: 'Bilgisayar Mühendisliği',
    office: 'D-318',
    officeHours: 'Perşembe 13.00 – 15.00',
  },
  {
    id: 'ayse',
    name: 'Prof. Dr. Ayşe Kaya',
    title: 'Prof. Dr.',
    email: 'ayse.kaya@uni.edu.tr',
    faculty: 'Mühendislik Fakültesi',
    department: 'Bilgisayar Mühendisliği',
    office: 'D-302',
    officeHours: 'Cuma 11.00 – 12.00',
  },
  {
    id: 'deniz',
    name: 'Dr. Öğr. Üyesi Deniz Arslan',
    title: 'Dr. Öğr. Üyesi',
    email: 'deniz.arslan@uni.edu.tr',
    faculty: 'Mühendislik Fakültesi',
    department: 'Yazılım Mühendisliği',
    office: 'B-214',
    officeHours: 'Salı 09.00 – 11.00',
  },
  {
    id: 'okan',
    name: 'Doç. Dr. Okan Yıldız',
    title: 'Doç. Dr.',
    email: 'okan.yildiz@uni.edu.tr',
    faculty: 'Fen-Edebiyat Fakültesi',
    department: 'Matematik',
    office: 'A-308',
    officeHours: 'Pazartesi 15.00 – 17.00',
  },
  {
    id: 'laura',
    name: 'Öğr. Gör. Laura Blake',
    title: 'Öğr. Gör.',
    email: 'laura.blake@uni.edu.tr',
    faculty: 'Yabancı Diller Yüksekokulu',
    department: 'Teknik İngilizce',
    office: 'Y-104',
    officeHours: 'Perşembe 10.00 – 12.00',
  },
];

export const DEFAULT_ACADEMICIAN_ID = 'mert';

export function findAcademicianById(id: string): AcademicianProfile | undefined {
  return ACADEMICIANS.find((profile) => profile.id === id);
}

export function findAcademicianByName(name: string): AcademicianProfile | undefined {
  return ACADEMICIANS.find((profile) => profile.name === name);
}

export function findAcademicianByEmail(email: string): AcademicianProfile | undefined {
  return ACADEMICIANS.find(
    (profile) => profile.email.toLowerCase() === email.trim().toLowerCase(),
  );
}

export function getAcademicianIdForSession(session: SessionUser): string {
  return (
    findAcademicianByEmail(session.identifier)?.id ??
    findAcademicianByName(session.name)?.id ??
    DEFAULT_ACADEMICIAN_ID
  );
}
