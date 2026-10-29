import { createContext } from 'react';
import type { LoginCredentials, Role, SessionUser } from '@/types/auth';

export interface AuthContextValue {
  session: SessionUser | null;
  login: (role: Role, credentials: LoginCredentials, remember: boolean) => Promise<SessionUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
