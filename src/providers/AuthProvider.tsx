import type { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthStatus } from '@/context/auth-context';
import {
  isAuthConfigured,
  isDemoAuthEnabled,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';
import { authenticate } from '@/services/authService';
import type {
  LoginCredentials,
  Role,
  SessionUser,
} from '@/types/auth';
import type { ProfileRecord } from '@/types/supabase';
import { authErrorMessage, LocalizedError } from '@/utils/authErrors';

// Önceki sürümlerde demo oturumu kalıcı saklanıyordu; artık yalnızca bellekte
// tutulduğu için eski anahtar açılışta temizlenir.
const LEGACY_SESSION_STORAGE_KEY = 'obs.session';

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

async function fetchProfile(user: User): Promise<ProfileRecord> {
  if (!supabase) {
    throw new LocalizedError('auth.error.supabaseRequired');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Profil okunamadı:', error.message);
    throw new LocalizedError('auth.error.profileLoadFailed');
  }

  if (!data) {
    throw new LocalizedError('auth.error.profileMissing');
  }

  return data as ProfileRecord;
}

async function resolveSupabaseSession(user: User): Promise<SessionUser> {
  const profile = await fetchProfile(user);
  return toSessionUser(profile);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? 'loading' : 'ready',
  );

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);

    const client = supabase;

    if (!client) {
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

      try {
        const resolved = await resolveSupabaseSession(authSession.user);

        if (!isActive) {
          return;
        }

        setSession(resolved);
      } catch (error) {
        // Profil bulunamazsa istemci tarafında profil/rol oluşturulmaz.
        console.error('Supabase oturumu profil ile eşleştirilemedi:', error);

        if (!isActive) {
          return;
        }

        setSession(null);
        void client.auth.signOut();
      } finally {
        if (isActive) {
          setStatus('ready');
        }
      }
    };

    void client.auth.getSession().then(({ data }) => {
      void applySession(data.session);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, authSession) => {
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
    async (role: Role, credentials: LoginCredentials) => {
      if (!isDemoAuthEnabled) {
        throw new LocalizedError('auth.error.demoDisabled');
      }

      const user: SessionUser = {
        ...(await authenticate(role, credentials)),
        provider: 'demo',
      };

      // Demo oturumu yalnızca bellekte tutulur; sayfa yenilendiğinde sona erer.
      setSession(user);

      return user;
    },
    [],
  );

  const sendOtp = useCallback(async (email: string) => {
    if (!supabase) {
      throw new LocalizedError('auth.error.supabaseRequired');
    }

    // Üniversite hesapları yalnızca yönetici tarafından önceden oluşturulur.
    // OTP yalnızca mevcut hesaplara gönderilir; dizin dışı adresler hesap açamaz.
    // Not: Sunucuda da Supabase Auth signup kapatılmalıdır; bu istemci bayrağı
    // doğrudan Auth API çağrılarını tek başına engellemez.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
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

    try {
      const resolved = await resolveSupabaseSession(data.session.user);

      setSession(resolved);
      setStatus('ready');

      return resolved;
    } catch (error) {
      // Profil yoksa veya okunamazsa oturum kapatılır; profil/rol istemciden atanmaz.
      await supabase.auth.signOut();
      setSession(null);

      if (error instanceof LocalizedError) {
        throw error;
      }

      throw new LocalizedError('auth.error.profileLoadFailed');
    }
  }, []);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      status,
      isSupabaseMode: isSupabaseConfigured,
      isDemoMode: isDemoAuthEnabled,
      isAuthConfigured,
      login,
      sendOtp,
      verifyOtp,
      logout,
    }),
    [session, status, login, sendOtp, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
