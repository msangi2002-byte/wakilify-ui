import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/utils/apiError';

export default function Otp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');

  const phone = location.state?.phone || '';

  useEffect(() => {
    if (!phone && location.state?.from !== 'register') {
      navigate('/auth/register', { replace: true });
    }
  }, [phone, location.state?.from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const otpTrim = (otp || '').trim().replace(/\D/g, '');
    if (!phone) {
      setError('Phone number is missing. Please register again.');
      return;
    }
    if (otpTrim.length < 4) {
      setError('Please enter a valid OTP code.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp({ phone, otp: otpTrim });
      const ok = res?.success === true && res?.data?.verified === true;
      if (ok) {
        navigate('/auth/login', { state: { verified: true }, replace: true });
      } else {
        setError(res?.message || getApiErrorMessage({ response: { data: res } }, 'Verification failed. Please check the code and try again.'));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verification failed. Please check the code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (!phone) {
    return (
      <div className="auth-form">
        <p className="auth-link-row">No phone number found. <Link to="/auth/register">Register again</Link></p>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Verify your phone</h2>
      <p className="auth-disclaimer" style={{ marginTop: 0, marginBottom: '1rem' }}>
        We sent a code to <strong>{phone}</strong>. Enter it below.
      </p>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="otp">OTP Code</label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="e.g. 123456"
            value={otp}
            onChange={(e) => {
              setError('');
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 8));
            }}
            autoComplete="one-time-code"
            autoFocus
          />
        </div>
        <button type="submit" className="auth-btn-primary" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>
      <p className="auth-link-row">
        Didn’t get the code? <Link to="/auth/register">Register again</Link> or <Link to="/auth/login">Log in</Link>
      </p>
    </div>
  );
}
