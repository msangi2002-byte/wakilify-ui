import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp, resendOtp } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const RESEND_COOLDOWN_SEC = 60;

export default function Otp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const phone = location.state?.phone || '';

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  const handleResend = async () => {
    if (!phone || resendCooldown > 0 || resendLoading) return;
    setError('');
    setSuccessMsg('');
    setResendLoading(true);
    try {
      const res = await resendOtp(phone);
      if (res?.success === true) {
        setSuccessMsg(res?.message || 'Code sent. Check your phone.');
        setResendCooldown(RESEND_COOLDOWN_SEC);
      } else {
        setError(res?.message || getApiErrorMessage({ response: { data: res } }, 'Failed to resend code.'));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resend code.'));
    } finally {
      setResendLoading(false);
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
      {successMsg && <div className="auth-success" role="status">{successMsg}</div>}
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
        Didn’t get the code?{' '}
        <button
          type="button"
          className="auth-link-button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
        >
          {resendLoading ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
        {' · '}
        <Link to="/auth/register">Register again</Link>
        {' · '}
        <Link to="/auth/login">Log in</Link>
      </p>
    </div>
  );
}
