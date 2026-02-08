import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { APP_NAME, LOGO_PNG, LOGO_ICON } from '@/lib/constants/brand';

export default function AuthLayout() {
  const [logoSrc, setLogoSrc] = useState(LOGO_PNG);

  return (
    <div className="auth-split">
      <aside className="auth-brand">
        <img
          src={logoSrc}
          alt={APP_NAME}
          className="auth-brand-logo"
          onError={() => setLogoSrc(LOGO_ICON)}
        />
        <h1>{APP_NAME}</h1>
        <p className="auth-brand-tagline">Connect. Trade. Earn.</p>
      </aside>
      <main className="auth-form-panel">
        <Outlet />
      </main>
    </div>
  );
}
