import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { ROLES } from '@/types/roles';

export function RoleGuard({ children, allowedRoles = [] }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const hasRole = allowedRoles.includes(user.role);
  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
