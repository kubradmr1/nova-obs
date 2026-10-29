import { getRole } from '@/config/roles';
import type { LoginCredentials, Role, SessionUser } from '@/types/auth';

const REQUEST_DELAY_MS = 900;

export async function authenticate(
  role: Role,
  credentials: LoginCredentials,
): Promise<SessionUser> {
  await new Promise((resolve) => window.setTimeout(resolve, REQUEST_DELAY_MS));

  const definition = getRole(role);
  const identifier = credentials.identifier.trim();

  if (!identifier || credentials.password.length < 6) {
    throw new Error('Giriş bilgileri geçersiz.');
  }

  const isDemoAccount =
    identifier.toLowerCase() === definition.demo.identifier.toLowerCase() &&
    credentials.password === definition.demo.password;

  return {
    role,
    identifier,
    name: isDemoAccount ? definition.demoName : identifier,
    startedAt: new Date().toISOString(),
  };
}
