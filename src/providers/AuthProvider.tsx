import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from '@/context/auth-context';
import { authenticate } from '@/services/authService';
import type { LoginCredentials, Role, SessionUser } from '@/types/auth';

const SESSION_STORAGE_KEY = 'obs.session';

function parseSession(raw: string | null): SessionUser | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionUser>;
    const hasValidRole =
      parsed.role === 'student' || parsed.role === 'academic' || parsed.role === 'admin';

    if (
      !hasValidRole ||
      typeof parsed.name !== 'string' ||
      typeof parsed.identifier !== 'string' ||
      typeof parsed.startedAt !== 'string'
    ) {
      return null;
    }

    return parsed as SessionUser;
  } catch {
    return null;
  }
}

function readStoredSession(): SessionUser | null {
  return (
    parseSession(window.localStorage.getItem(SESSION_STORAGE_KEY)) ??
    parseSession(window.sessionStorage.getItem(SESSION_STORAGE_KEY))
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(readStoredSession);

  const login = useCallback(
    async (role: Role, credentials: LoginCredentials, remember: boolean) => {
      const user = await authenticate(role, credentials);
      const storage = remember ? window.localStorage : window.sessionStorage;

      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      setSession(user);

      return user;
    },
    [],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
