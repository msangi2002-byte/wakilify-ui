import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { setAuth } from '@/store/auth.store';

const KEY = 'wakilify_impersonate';

export default function Impersonate() {
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const { accessToken, refreshToken, user } = JSON.parse(raw);
        sessionStorage.removeItem(KEY);
        if (accessToken && user) {
          setAuth(user, accessToken, refreshToken);
        }
      }
    } catch (_) {}
  }, []);

  return <Navigate to="/app" replace />;
}

export function openImpersonateSession(auth) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(auth));
    window.open('/auth/impersonate', '_blank', 'noopener,noreferrer');
  } catch (e) {
    console.error('Impersonate open failed', e);
  }
}
