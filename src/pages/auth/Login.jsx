import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants/brand';
import { login as loginApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/utils/apiError';

function formatEmailOrPhone(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 9) {
    if (digits.startsWith('255')) return `+${digits}`;
    if (digits.startsWith('0')) return `+255${digits.slice(1)}`;
    return `+255${digits}`;
  }
  return trimmed;
}

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ emailOrPhone: '', password: '' });

  const update = (name, value) => {
    setError('');
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const emailOrPhone = formatEmailOrPhone(form.emailOrPhone);
    if (!emailOrPhone) {
      setError('Email or phone is required.');
      return;
    }
    if (!(form.password || '').trim()) {
      setError('Password is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginApi({ emailOrPhone, password: form.password.trim() });
      const ok = res?.success === true && res?.data?.accessToken != null && res?.data?.user != null;
      if (ok) {
        navigate('/app', { replace: true });
      } else {
        setError(res?.message || getApiErrorMessage({ response: { data: res } }, 'Login failed. Please check your email/phone and password.'));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please check your email/phone and password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Log in to {APP_NAME}</h2>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="emailOrPhone">Email or Phone</label>
          <input
            id="emailOrPhone"
            type="text"
            inputMode="email"
            placeholder="Email or phone (e.g. +255712345678)"
            value={form.emailOrPhone}
            onChange={(e) => update('emailOrPhone', e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>
      <p className="auth-link-row">
        Don&apos;t have an account? <Link to="/auth/register">Sign up</Link>
      </p>
    </div>
  );
}
