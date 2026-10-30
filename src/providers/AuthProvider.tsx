import type { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthStatus } from '@/context/auth-context';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { authenticate } from '@/services/authService';
import type {
  LoginCredentials,
  Role,
  SessionUser,
} from '@/types/auth';
import type { ProfileRecord } from '@/types/supabase';
import { authErrorMessage, LocalizedError } from '@/utils/authErrors';

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

function mapRole(role: ProfileRecord['role']): Role {
  if (role === 'academician') {
    return 'academic';
  }

  if (role === 'admin') {
    return 'admin';
  }

  return 'student';
}

function toSessionUser(profile: ProfileRecord): SessionUser {
  const role = mapRole(profile.role);
  const identifier =
    role === 'student' ? profile.student_number || profile.email : profile.email;

  return {
    role,
    name: profile.full_name || profile.email,
    identifier,
    startedAt: new Date().toISOString(),
    provider: 'supabase',
    profileId: profile.id,
    email: profile.email,
    academicianKey:
      role === 'academic' ? profile.academician_key ?? profile.email : undefined,
  };
}

async function fetchOrCreateProfile(user: User): Promise<ProfileRecord | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Profil okunamadı:', error.message);
    return null;
  }

  if (data) {
    return data as ProfileRecord;
  }

  const email = user.email?.toLowerCase() ?? '';

  if (!email) {
    return null;
  }

  const metadataName =
    typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
  const fallbackName =
    metadataName || email.split('@')[0]?.replace(/[._-]+/g, ' ') || email;

  // Trigger henüz çalışmadıysa (şema kurulumu eksikse) öğrenci profilini
  // kendi oturumu için oluşturmayı dene. RLS yalnızca 'student' rolüne izin verir.
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: user.id, email, full_name: fallbackName })
    .select('*')
    .single();

  if (insertError) {
    console.error('Profil oluşturulamadı:', insertError.message);
    return null;
  }

  return created as ProfileRecord;
}

async function resolveSupabaseSession(user: User): Promise<SessionUser | null> {
  const profile = await fetchOrCreateProfile(user);
  return profile ? toSessionUser(profile) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(() =>
    isSupabaseConfigured ? null : readStoredSession(),
  );
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? 'loading' : 'ready',
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;

    const applySession = async (authSession: Session | null) => {
      if (!isActive) {
        return;
      }

      if (!authSession?.user) {
        setSession(null);
        setStatus('ready');
        return;
      }

      const resolved = await resolveSupabaseSession(authSession.user);

      if (!isActive) {
        return;
      }

      setSession(resolved);
      setStatus('ready');
    };

    void supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      // Supabase çağrılarını callback içinde beklemek kilitlenmeye yol açabilir.
      window.setTimeout(() => {
        void applySession(authSession);
      }, 0);
    });

    return () => {
      isActive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (role: Role, credentials: LoginCredentials, remember: boolean) => {
      const user: SessionUser = {
        ...(await authenticate(role, credentials)),
        provider: 'demo',
      };
      const storage = remember ? window.localStorage : window.sessionStorage;

      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      setSession(user);

      return user;
    },
    [],
  );

  const sendOtp = useCallback(async (email: string) => {
    if (!supabase) {
      throw new LocalizedError('auth.error.supabaseRequired');
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      throw new LocalizedError(authErrorMessage(error.message));
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    if (!supabase) {
      throw new LocalizedError('auth.error.supabaseRequired');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });

    if (error) {
      throw new LocalizedError(authErrorMessage(error.message));
    }

    if (!data.session?.user) {
      throw new LocalizedError('auth.error.sessionFailed');
    }

    const resolved = await resolveSupabaseSession(data.session.user);

    if (!resolved) {
      throw new LocalizedError('auth.error.profileMissing');
    }

    setSession(resolved);
    setStatus('ready');

    return resolved;
  }, []);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      status,
      isSupabaseMode: isSupabaseConfigured,
      login,
      sendOtp,
      verifyOtp,
      logout,
    }),
    [session, status, login, sendOtp, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
