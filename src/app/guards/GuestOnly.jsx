import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

export function GuestOnly({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
