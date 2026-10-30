import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/auth';

interface RequireRoleProps {
  role: Role;
  children: ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { session, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return null;
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (session.role !== role) {
    const params = new URLSearchParams({
      need: role,
      from: location.pathname,
    });

    return <Navigate to={`/yetkisiz?${params.toString()}`} replace />;
  }

  return <>{children}</>;
}
