import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

/**
 * Wraps /app routes. If user has not completed onboarding and is not on /app/onboarding,
 * redirect to onboarding. Otherwise render outlet.
 */
export function OnboardingGuard() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isOnOnboarding = location.pathname === '/app/onboarding';

  if (isOnOnboarding) {
    return <Outlet />;
  }

  if (user && user.onboardingCompleted === false) {
    return <Navigate to="/app/onboarding" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
