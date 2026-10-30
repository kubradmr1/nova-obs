import type { Role } from '@/types/auth';
import type { MessageKey } from '@/i18n/messages';

export const ROLE_HOME: Record<Role, string> = {
  student: '/panel',
  academic: '/hoca',
  admin: '/yonetim',
};

export const ROLE_LABEL_KEY: Record<Role, MessageKey> = {
  student: 'role.student.label',
  academic: 'role.academic.label',
  admin: 'role.admin.label',
};

export interface RoleAccessRule {
  prefix: string;
  role: Role;
  label: string;
}

/**
 * Sayfa erişim matrisi. Menüler ve rota korumaları bu tek kaynaktan beslenir.
 * AWS/Supabase tarafındaki politika katmanı da aynı rolleri kullanır.
 */
export const ROLE_ACCESS: readonly RoleAccessRule[] = [
  { prefix: '/panel', role: 'student', label: 'Öğrenci paneli' },
  { prefix: '/hoca', role: 'academic', label: 'Akademisyen paneli' },
  { prefix: '/yonetim', role: 'admin', label: 'Yönetim paneli' },
];

export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function roleCanAccess(role: Role, pathname: string): boolean {
  const path = normalizePath(pathname);

  if (path === '/' || path === '/yetkisiz') {
    return true;
  }

  const matchingRule = ROLE_ACCESS.filter(
    (rule) => path === rule.prefix || path.startsWith(`${rule.prefix}/`),
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];

  return matchingRule ? matchingRule.role === role : true;
}

export function requiredRoleForPath(pathname: string): Role | null {
  const path = normalizePath(pathname);
  const rule = ROLE_ACCESS.find(
    (candidate) => path === candidate.prefix || path.startsWith(`${candidate.prefix}/`),
  );

  return rule?.role ?? null;
}
