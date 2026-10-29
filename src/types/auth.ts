import type { LucideIcon } from 'lucide-react';

export type Role = 'student' | 'academic' | 'admin';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface SessionUser {
  role: Role;
  name: string;
  identifier: string;
  startedAt: string;
}

export interface RoleDefinition {
  id: Role;
  label: string;
  tabLabel: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  description: string;
  icon: LucideIcon;
  demo: LoginCredentials;
  demoName: string;
}
