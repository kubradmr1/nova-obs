import { createContext } from 'react';
import type { LoginCredentials, Role, SessionUser } from '@/types/auth';

export type AuthStatus = 'loading' | 'ready';

export interface AuthContextValue {
  session: SessionUser | null;
  status: AuthStatus;
  isSupabaseMode: boolean;
  login: (role: Role, credentials: LoginCredentials, remember: boolean) => Promise<SessionUser>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
