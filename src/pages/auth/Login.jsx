import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME, LOGO_PNG, LOGO_ICON } from '@/lib/constants/brand';
import { login as loginApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { getSavedAccounts, addSavedAccount } from '@/lib/utils/savedAccounts';

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

function isPhoneLike(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('+') || /^\d{9,}$/.test(trimmed.replace(/\D/g, ''));
}

function isNotVerifiedResponse(res) {
  const msg = (res?.message || res?.error || '').toLowerCase();
  return /verif|verified|verify/.test(msg) || res?.data?.verified === false;
}

function isNotVerifiedError(err) {
  const data = err?.response?.data;
  const msg = (data?.message || data?.error || '').toLowerCase();
  return /verif|verified|verify/.test(msg);
}

export default function Login() {
  const navigate = useNavigate();
  const [logoSrc, setLogoSrc] = useState(LOGO_PNG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notVerifiedPhone, setNotVerifiedPhone] = useState(null);
  const [form, setForm] = useState({ emailOrPhone: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, []);

  const update = (name, value) => {
    setError('');
    setNotVerifiedPhone(null);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectSavedAccount = (account) => {
    setError('');
    setForm((prev) => ({ ...prev, emailOrPhone: account.emailOrPhone }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotVerifiedPhone(null);
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
        const user = res?.data?.user;
        if (rememberMe && user) {
          addSavedAccount({
            id: user.id,
            name: user.name,
            profilePic: user.profilePic,
            emailOrPhone,
          });
        }
        const needsOnboarding = user && user.onboardingCompleted === false;
        navigate(needsOnboarding ? '/app/onboarding' : '/app', { replace: true });
      } else if (isNotVerifiedResponse(res)) {
        setError('Your account is not verified. Please verify your phone.');
        setNotVerifiedPhone(isPhoneLike(emailOrPhone) ? emailOrPhone : null);
      } else {
        setError(res?.message || getApiErrorMessage({ response: { data: res } }, 'Login failed. Please check your email/phone and password.'));
      }
    } catch (err) {
      if (isNotVerifiedError(err)) {
        setError('Your account is not verified. Please verify your phone.');
        const emailOrPhoneRaw = form.emailOrPhone?.trim();
        setNotVerifiedPhone(isPhoneLike(emailOrPhoneRaw) ? formatEmailOrPhone(emailOrPhoneRaw) : null);
      } else {
        setError(getApiErrorMessage(err, 'Login failed. Please check your email/phone and password.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form auth-form-login">
      <div className="auth-login-mobile-header">
        <img src={logoSrc} alt="" onError={() => setLogoSrc(LOGO_ICON)} />
        <h1>Log in to {APP_NAME}</h1>
      </div>
      <h2 className="auth-login-desktop-title">Log in to {APP_NAME}</h2>
      <p className="auth-form-hint">
        {savedAccounts.length > 0 ? 'Choose a saved account or enter your details below.' : 'Enter your email or phone and password to continue.'}
      </p>

      {savedAccounts.length > 0 && (
        <div className="auth-saved-accounts">
          <span className="auth-saved-label">Saved accounts</span>
          <div className="auth-saved-list">
            {savedAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                className="auth-saved-item"
                onClick={() => selectSavedAccount(acc)}
                aria-label={`Log in as ${acc.name}`}
              >
                <div className="auth-saved-avatar">
                  {acc.profilePic ? (
                    <img src={acc.profilePic} alt="" />
                  ) : (
                    <span>{acc.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  )}
                </div>
                <span className="auth-saved-name">{acc.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="auth-error" role="alert">
          {error}
          {notVerifiedPhone != null && (
            <div style={{ marginTop: '0.75rem' }}>
              <Link to="/auth/otp" state={{ phone: notVerifiedPhone }} className="auth-error-verify-link">
                Verify phone now
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate translate="no">
        <div className="auth-field">
          <label htmlFor="emailOrPhone">Email or phone</label>
          <input
            id="emailOrPhone"
            type="text"
            inputMode="text"
            placeholder="Email or phone"
            value={form.emailOrPhone}
            onChange={(e) => update('emailOrPhone', e.target.value)}
            autoComplete="username"
            spellCheck={false}
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
        <label className="auth-checkbox-row">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Save account for next time</span>
        </label>
        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="auth-link-row">
        Don&apos;t have an account? <Link to="/auth/register">Sign up</Link>
        {notVerifiedPhone != null && (
          <>
            {' · '}
            <Link to="/auth/otp" state={{ phone: notVerifiedPhone }}>Verify phone</Link>
          </>
        )}
      </p>
    </div>
  );
}
