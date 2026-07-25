import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects to /login when there's no valid session (checked against GET /auth/me).
 * Pass `roles` to additionally require the current user to have at least one of them
 * (e.g. SUPER_ADMIN/ADMIN-only screens) — redirects to /dashboard otherwise.
 */
export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: string[];
}) {
  const { status, currentUser } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="page-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.some((role) => currentUser?.roles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
