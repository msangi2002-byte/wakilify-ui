import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 80 + i).reverse();

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value?.trim() || '');
}

function formatPhone(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.startsWith('255')) return `+${digits}`;
  if (digits.startsWith('0')) return `+255${digits.slice(1)}`;
  return `+255${digits}`;
}

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    day: '',
    month: '',
    year: '',
    gender: 'female',
  });

  const update = (name, value) => {
    setError('');
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { firstName, surname, email, phone, password } = form;
    const name = `${(firstName || '').trim()} ${(surname || '').trim()}`.trim();
    const emailTrim = (email || '').trim();
    const phoneFormatted = formatPhone((phone || '').trim());
    if (!name) {
      setError('Name is required.');
      return;
    }
    if (!emailTrim && !phoneFormatted) {
      setError('Email or phone is required.');
      return;
    }
    if (emailTrim && !isEmail(emailTrim)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!(password || '').trim()) {
      setError('Password is required.');
      return;
    }
    const payload = {
      name,
      password: password.trim(),
      role: 'USER',
      email: emailTrim || undefined,
      phone: phoneFormatted || undefined,
    };
    setLoading(true);
    try {
      const res = await registerApi(payload);
      const ok = res?.success === true;
      if (ok) {
        if (payload.phone) {
          navigate('/auth/otp', { state: { phone: payload.phone, from: 'register' } });
        } else {
          navigate('/auth/login', { state: { registered: true } });
        }
      } else {
        setError(res?.message || getApiErrorMessage({ response: { data: res } }, 'Registration failed. Please try again.'));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Create an account</h2>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field-row">
          <div className="auth-field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="surname">Surname</label>
            <input
              id="surname"
              type="text"
              placeholder="Surname"
              value={form.surname}
              onChange={(e) => update('surname', e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="e.g. 0712345678 or +255712345678"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            autoComplete="tel"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">New Password</label>
          <input
            id="password"
            type="password"
            placeholder="New Password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="auth-field">
          <label>Date of Birth</label>
          <div className="auth-dob-row">
            <select
              aria-label="Day"
              value={form.day}
              onChange={(e) => update('day', e.target.value)}
            >
              <option value="">Day</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              aria-label="Month"
              value={form.month}
              onChange={(e) => update('month', e.target.value)}
            >
              <option value="">Month</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              aria-label="Year"
              value={form.year}
              onChange={(e) => update('year', e.target.value)}
            >
              <option value="">Year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="auth-field">
          <label>Gender</label>
          <div className="auth-radio-group">
            <label>
              <input
                type="radio"
                name="gender"
                value="female"
                checked={form.gender === 'female'}
                onChange={(e) => update('gender', e.target.value)}
              />
              Female
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="male"
                checked={form.gender === 'male'}
                onChange={(e) => update('gender', e.target.value)}
              />
              Male
            </label>
          </div>
        </div>

        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Signing up…' : 'Sign Up'}
        </button>
      </form>
      <p className="auth-disclaimer">
        By signing up, you agree to our Terms of Service and Privacy Policy. We may send you account-related messages.
      </p>
      <p className="auth-link-row">
        Already have an account? <Link to="/auth/login">Log in</Link>
      </p>
    </div>
  );
}
