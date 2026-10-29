import type { StudentFormRequest } from '@/types/student';

export const FORM_REQUESTS_STORAGE_KEY = 'obs.student.forms.v1';

export interface StudentFormType {
  id: string;
  label: string;
  description: string;
  processingTime: string;
}

export const STUDENT_FORM_TYPES: StudentFormType[] = [
  {
    id: 'ogrenci-belgesi',
    label: 'Öğrenci Belgesi',
    description: 'Kayıt durumunu ve program bilgini gösteren resmî belge.',
    processingTime: '1 iş günü',
  },
  {
    id: 'transkript',
    label: 'Transkript Talebi',
    description: 'Onaylı not dökümün ve AKTS özeti.',
    processingTime: '2 iş günü',
  },
  {
    id: 'staj-basvuru',
    label: 'Staj Başvuru Formu',
    description: 'Bulut bilişim alanındaki staj başvuruları için zorunlu form.',
    processingTime: '3 iş günü',
  },
  {
    id: 'bulut-lab-erisim',
    label: 'Bulut Laboratuvarı Erişim Formu',
    description: 'Sanal makine, konteyner ve depolama kotası tanımlama talebi.',
    processingTime: '1 iş günü',
  },
  {
    id: 'ders-muafiyet',
    label: 'Ders Muafiyet Dilekçesi',
    description: 'Daha önce alınan dersler için muafiyet başvurusu.',
    processingTime: '5 iş günü',
  },
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 30, 0, 0);
  return date.toISOString();
}

export const SEED_FORM_REQUESTS: StudentFormRequest[] = [
  {
    id: 'form-seed-1',
    typeId: 'ogrenci-belgesi',
    typeLabel: 'Öğrenci Belgesi',
    note: 'Banka hesabı açılışı için öğrenci belgesi talep ediyorum.',
    createdAt: daysAgo(4),
    status: 'Tamamlandı',
  },
];
