import { BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import type { Role, RoleDefinition } from '@/types/auth';

export const ROLES: readonly RoleDefinition[] = [
  {
    id: 'student',
    label: 'Öğrenci Girişi',
    tabLabel: 'Öğrenci',
    identifierLabel: 'Öğrenci Numarası',
    identifierPlaceholder: '2024001234',
    description: 'Bulut Bilişim Operatörlüğü derslerini, notlarını ve danışmanını takip et.',
    icon: GraduationCap,
    demo: { identifier: '2024001234', password: 'obs2026' },
    demoName: 'Elif Yılmaz',
  },
  {
    id: 'academic',
    label: 'Akademisyen Girişi',
    tabLabel: 'Akademisyen',
    identifierLabel: 'Kurumsal E-posta',
    identifierPlaceholder: 'ad.soyad@uni.edu.tr',
    description: 'Derslerini, yoklamayı ve öğrenci not girişlerini yönet.',
    icon: BookOpen,
    demo: { identifier: 'mert.aydin@uni.edu.tr', password: 'akademi2026' },
    demoName: 'Dr. Öğr. Üyesi Mert Aydın',
  },
  {
    id: 'admin',
    label: 'Yönetici Girişi',
    tabLabel: 'Yönetici',
    identifierLabel: 'Kullanıcı Adı',
    identifierPlaceholder: 'yonetici',
    description: 'Kullanıcıları, akademik takvimi ve sistem ayarlarını yönet.',
    icon: ShieldCheck,
    demo: { identifier: 'yonetici', password: 'admin2026' },
    demoName: 'Sistem Yöneticisi',
  },
];

export function getRole(role: Role): RoleDefinition {
  return ROLES.find((definition) => definition.id === role) ?? ROLES[0];
}

export function getHomePath(role: Role): string {
  switch (role) {
    case 'student':
      return '/panel';
    case 'academic':
      return '/hoca';
    case 'admin':
      return '/yonetim';
  }
}
