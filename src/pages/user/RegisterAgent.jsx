import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Building2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { registerAgent } from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { ROLES } from '@/types/roles';
import '@/styles/user-app.css';

export default function RegisterAgent() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    nationalId: '',
    region: '',
    district: '',
    ward: '',
    street: '',
    paymentPhone: user?.phone ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const isAgent = String(user?.role ?? '').toLowerCase() === ROLES.AGENT;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    if (!form.nationalId?.trim() || !form.region?.trim() || !form.district?.trim() || !form.paymentPhone?.trim()) {
      setError('National ID, region, district and payment phone are required.');
      return;
    }
    setLoading(true);
    try {
      const agent = await registerAgent({
        nationalId: form.nationalId.trim(),
        region: form.region.trim(),
        district: form.district.trim(),
        paymentPhone: form.paymentPhone.trim(),
        ...(form.ward?.trim() && { ward: form.ward.trim() }),
        ...(form.street?.trim() && { street: form.street.trim() }),
      });
      setSuccess(agent);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  if (isAgent) {
    return (
      <div className="user-app-card" style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
        <h1 className="register-agent-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Sparkles size={28} style={{ color: '#7c3aed' }} />
          You're already an agent
        </h1>
        <p style={{ color: '#65676b', marginBottom: 20 }}>
          Your account is already registered as an agent. Use the Agent Dashboard to manage businesses and commissions.
        </p>
        <Link to="/agent" className="settings-btn settings-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <Building2 size={20} />
          Open Agent Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="register-agent-page" style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px 24px' }}>
      <Link to="/app" className="register-agent-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7c3aed', textDecoration: 'none', marginBottom: 20, fontSize: 14 }}>
        <ArrowLeft size={18} />
        Back to Home
      </Link>
      <div className="user-app-card" style={{ padding: 24 }}>
        <h1 className="register-agent-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Sparkles size={28} style={{ color: '#7c3aed' }} />
          Register as agent
        </h1>
        <p style={{ color: '#65676b', marginBottom: 24, fontSize: 14 }}>
          Become a Wakilfy agent to onboard businesses and earn commissions. Registration fee: 20,000 TZS. You will receive payment instructions after submitting this form.
        </p>

        {success ? (
          <div className="register-agent-success" style={{ padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #86efac' }}>
            <p style={{ margin: '0 0 8px', color: '#166534', fontWeight: 600 }}>Registration submitted</p>
            <p style={{ margin: 0, color: '#15803d', fontSize: 14 }}>
              Your agent code is <strong>{success.agentCode}</strong>. Status: {success.status}.
            </p>
            <p style={{ margin: '12px 0 0', color: '#166534', fontSize: 14 }}>
              Please complete the registration payment (20,000 TZS) to activate your agent account. You will receive payment details via the phone number you provided.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/app" className="settings-btn settings-btn-secondary" style={{ textDecoration: 'none' }}>
                Back to Home
              </Link>
              <Link to="/app/settings" className="settings-btn settings-btn-primary" style={{ textDecoration: 'none' }}>
                Go to Settings
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="settings-row" style={{ marginBottom: 16 }}>
              <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                National ID *
              </label>
              <input
                type="text"
                className="settings-input"
                placeholder="e.g. 19901234-12345-6"
                value={form.nationalId}
                onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
                required
              />
            </div>
            <div className="settings-row" style={{ marginBottom: 16 }}>
              <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Region *
              </label>
              <input
                type="text"
                className="settings-input"
                placeholder="e.g. Dar es Salaam"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                required
              />
            </div>
            <div className="settings-row" style={{ marginBottom: 16 }}>
              <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                District *
              </label>
              <input
                type="text"
                className="settings-input"
                placeholder="e.g. Temeke"
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                required
              />
            </div>
            <div className="settings-row" style={{ marginBottom: 16 }}>
              <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Ward (optional)
              </label>
              <input
                type="text"
                className="settings-input"
                placeholder="Ward"
                value={form.ward}
                onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))}
              />
            </div>
            <div className="settings-row" style={{ marginBottom: 16 }}>
              <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Street (optional)
              </label>
              <input
                type="text"
                className="settings-input"
                placeholder="Street or area"
                value={form.street}
                onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              />
            </div>
            <div className="settings-row" style={{ marginBottom: 20 }}>
              <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Phone for payment *
              </label>
              <input
                type="tel"
                className="settings-input"
                placeholder="+255712345678"
                value={form.paymentPhone}
                onChange={(e) => setForm((f) => ({ ...f, paymentPhone: e.target.value }))}
                required
              />
              <span className="settings-row-desc" style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#65676b' }}>
                You will receive payment instructions on this number (20,000 TZS registration fee).
              </span>
            </div>
            {error && (
              <p className="settings-error" style={{ marginBottom: 12 }} role="alert">{error}</p>
            )}
            <div className="settings-section-actions">
              <button
                type="submit"
                className="settings-btn settings-btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit registration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
