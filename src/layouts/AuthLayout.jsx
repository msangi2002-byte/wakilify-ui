import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-split">
      <aside className="auth-brand">
        <img
          src="/wakify-icon.svg"
          alt="Wakilify"
          className="auth-brand-logo"
        />
        <h1>Wakilify</h1>
        <p className="auth-brand-tagline">Connect. Trade. Earn.</p>
      </aside>
      <main className="auth-form-panel">
        <Outlet />
      </main>
    </div>
  );
}
