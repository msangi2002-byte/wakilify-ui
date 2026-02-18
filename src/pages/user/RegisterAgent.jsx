import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Building2, ArrowLeft, Check, Loader2, Smartphone, MapPin } from 'lucide-react';
import { useAuthStore, setAuth, getToken, getRefreshToken, getAuthUser } from '@/store/auth.store';
import { refreshTokens } from '@/lib/api/auth';
import { registerAgent, getRegistrationPackages, getAgentMe } from '@/lib/api/agent';
import { checkPaymentStatus } from '@/lib/api/payments';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { ROLES } from '@/types/roles';
import { useGeolocation } from '@/hooks/useGeolocation';
import '@/styles/user-app.css';

const POLL_INTERVAL_MS = 3000;
const formatTzs = (amount) => {
  if (amount == null || amount === '') return '—';
  const n = Number(amount);
  return Number.isNaN(n) ? String(amount) : n.toLocaleString('en-TZ') + ' TZS';
};

export default function RegisterAgent() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { position: geoPosition } = useGeolocation();
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [step, setStep] = useState('packages'); // 'packages' | 'form' | 'paying' | 'success'
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
  const [result, setResult] = useState(null); // { agent, orderId }
  const [polling, setPolling] = useState(false);

  const isAgent = String(user?.role ?? '').toLowerCase() === ROLES.AGENT;

  useEffect(() => {
    getRegistrationPackages()
      .then((list) => setPackages(Array.isArray(list) ? list : []))
      .catch(() => setPackages([]))
      .finally(() => setPackagesLoading(false));
  }, []);

  const startPolling = useCallback(() => {
    setPolling(true);
  }, []);

  useEffect(() => {
    if (!polling || !result?.orderId) return;
    const id = setInterval(async () => {
      try {
        // Trigger payment refresh so backend updates status from HarakaPay (in case webhook delayed)
        const paymentStatus = await checkPaymentStatus(result.orderId).catch(() => null);
        if (paymentStatus?.status === 'SUCCESS') {
          setPolling(false);
          setStep('success');
          const newToken = await refreshTokens();
          const currentUser = getAuthUser() || user;
          if (currentUser) setAuth({ ...currentUser, role: ROLES.AGENT }, getToken(), getRefreshToken());
          navigate('/agent', { replace: true });
          return;
        }
        const agent = await getAgentMe();
        if (agent?.status === 'ACTIVE') {
          setPolling(false);
          setResult((r) => (r ? { ...r, agent } : null));
          setStep('success');
          const newToken = await refreshTokens();
          const currentUser = getAuthUser() || user;
          if (currentUser) setAuth({ ...currentUser, role: ROLES.AGENT }, getToken(), getRefreshToken());
          navigate('/agent', { replace: true });
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [polling, result?.orderId, navigate, user]);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setStep('form');
    setError('');
  };

  const handleBackToPackages = () => {
    setSelectedPackage(null);
    setStep('packages');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nationalId?.trim() || !form.region?.trim() || !form.district?.trim() || !form.paymentPhone?.trim()) {
      setError('National ID, region, district and payment phone are required.');
      return;
    }
    if (!selectedPackage?.id) {
      setError('Please select a package.');
      return;
    }
    setLoading(true);
    try {
      const res = await registerAgent({
        packageId: selectedPackage.id,
        nationalId: form.nationalId.trim(),
        region: form.region.trim(),
        district: form.district.trim(),
        paymentPhone: form.paymentPhone.trim(),
        ...(form.ward?.trim() && { ward: form.ward.trim() }),
        ...(form.street?.trim() && { street: form.street.trim() }),
        ...(geoPosition?.latitude != null && { latitude: geoPosition.latitude }),
        ...(geoPosition?.longitude != null && { longitude: geoPosition.longitude }),
      });
      setResult(res || {});
      if (res?.orderId) {
        setStep('paying');
        startPolling();
      } else {
        setStep('success');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  if (isAgent) {
    return (
      <div className="register-agent-wrap" style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>
        <Link to="/app" className="register-agent-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7c3aed', textDecoration: 'none', marginBottom: 20, fontSize: 14 }}>
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <div className="user-app-card register-agent-card" style={{ padding: 28, borderRadius: 16, boxShadow: '0 4px 24px rgba(124,58,237,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={26} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>You're already an agent</h1>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#65676b' }}>Manage businesses and commissions</p>
            </div>
          </div>
          <p style={{ color: '#65676b', marginBottom: 24, fontSize: 15, lineHeight: 1.5 }}>
            Your account is already registered as an agent. Use the Agent Dashboard to manage businesses and commissions.
          </p>
          <Link to="/agent" className="settings-btn settings-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Building2 size={20} />
            Open Agent Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="register-agent-wrap" style={{ maxWidth: 620, margin: '0 auto', padding: '24px 16px' }}>
      <Link to="/app" className="register-agent-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7c3aed', textDecoration: 'none', marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
        <ArrowLeft size={18} />
        Back to Home
      </Link>

      <div className="user-app-card register-agent-card" style={{ padding: 28, borderRadius: 16, boxShadow: '0 4px 24px rgba(124,58,237,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={26} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Become a Wakilfy Agent</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#65676b' }}>Onboard businesses and earn commissions</p>
          </div>
        </div>

        {step === 'packages' && (
          <>
            <p style={{ color: '#65676b', marginBottom: 24, fontSize: 15, lineHeight: 1.5 }}>
              Choose a package below. You will pay via USSD on your phone and get instant access to the Agent Dashboard.
            </p>
            {packagesLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#7c3aed' }} />
                <span style={{ color: '#65676b' }}>Loading packages…</span>
              </div>
            ) : packages.length === 0 ? (
              <p style={{ color: '#65676b', padding: 24, textAlign: 'center' }}>No packages available. Please try again later.</p>
            ) : (
              <div className="register-agent-packages" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    className="register-agent-package-card"
                    onClick={() => handleSelectPackage(pkg)}
                    style={{
                      textAlign: 'left',
                      padding: 20,
                      borderRadius: 12,
                      border: '2px solid #e4e6eb',
                      background: '#fff',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 17, color: '#1a1a2e' }}>{pkg.name}</span>
                          {pkg.isPopular && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', background: '#f3e8ff', padding: '2px 8px', borderRadius: 6 }}>Popular</span>
                          )}
                        </div>
                        {pkg.description && <p style={{ margin: '8px 0 0', fontSize: 14, color: '#65676b', lineHeight: 1.4 }}>{pkg.description}</p>}
                        {pkg.numberOfBusinesses != null && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7c3aed' }}>Up to {pkg.numberOfBusinesses} businesses</p>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: '#7c3aed', whiteSpace: 'nowrap' }}>{formatTzs(pkg.price)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'form' && selectedPackage && (
          <>
            <div style={{ marginBottom: 20, padding: 12, background: '#f5f3ff', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#5b21b6' }}>{selectedPackage.name}</span>
              <span style={{ fontWeight: 700, color: '#7c3aed' }}>{formatTzs(selectedPackage.price)}</span>
            </div>
            <button type="button" onClick={handleBackToPackages} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 14, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
              ← Change package
            </button>
            <form onSubmit={handleSubmit}>
              <div className="settings-row" style={{ marginBottom: 16 }}>
                <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>National ID *</label>
                <input type="text" className="settings-input" placeholder="e.g. 19901234-12345-6" value={form.nationalId} onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))} required style={{ maxWidth: '100%' }} />
              </div>
              <div className="settings-row" style={{ marginBottom: 16 }}>
                <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Region *</label>
                <input type="text" className="settings-input" placeholder="e.g. Dar es Salaam" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} required style={{ maxWidth: '100%' }} />
              </div>
              <div className="settings-row" style={{ marginBottom: 16 }}>
                <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>District *</label>
                <input type="text" className="settings-input" placeholder="e.g. Temeke" value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} required style={{ maxWidth: '100%' }} />
              </div>
              <div className="settings-row" style={{ marginBottom: 16 }}>
                <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Ward (optional)</label>
                <input type="text" className="settings-input" placeholder="Ward" value={form.ward} onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))} style={{ maxWidth: '100%' }} />
              </div>
              <div className="settings-row" style={{ marginBottom: 16 }}>
                <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Street (optional)</label>
                <input type="text" className="settings-input" placeholder="Street or area" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} style={{ maxWidth: '100%' }} />
              </div>
              <div className="settings-row" style={{ marginBottom: 20 }}>
                <label className="settings-row-title" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Phone for payment *</label>
                <input type="tel" className="settings-input" placeholder="+255712345678" value={form.paymentPhone} onChange={(e) => setForm((f) => ({ ...f, paymentPhone: e.target.value }))} required style={{ maxWidth: '100%' }} />
                <span className="settings-row-desc" style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#65676b' }}>
                  USSD push will be sent to this number to complete payment of {formatTzs(selectedPackage.price)}.
                </span>
              </div>
              {error && <p className="settings-error" style={{ marginBottom: 12 }} role="alert">{error}</p>}
              <div className="settings-section-actions">
                <button type="submit" className="settings-btn settings-btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {loading ? <><Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting…</> : <>Continue to payment</>}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'paying' && result?.orderId && (
          <div className="register-agent-paying" style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={32} style={{ color: '#16a34a' }} />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Check your phone</h2>
            <p style={{ margin: 0, color: '#65676b', fontSize: 15, lineHeight: 1.5 }}>
              A payment request has been sent to <strong>{form.paymentPhone}</strong>. Complete the payment (M-Pesa / Tigo Pesa / Airtel Money) to activate your agent account.
            </p>
            <p style={{ margin: '16px 0 0', fontSize: 14, color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Waiting for payment…
            </p>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: '#65676b' }}>You will be redirected to the Agent Dashboard automatically once payment is confirmed.</p>
          </div>
        )}

        {step === 'success' && !result?.orderId && result?.agent && (
          <div className="register-agent-success" style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #86efac' }}>
            <p style={{ margin: '0 0 8px', color: '#166534', fontWeight: 600 }}>Registration submitted</p>
            <p style={{ margin: 0, color: '#15803d', fontSize: 14 }}>Your agent code is <strong>{result.agent.agentCode}</strong>. Status: {result.agent.status}.</p>
            <p style={{ margin: '12px 0 0', color: '#166534', fontSize: 14 }}>Please complete the registration payment to activate your agent account.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/app" className="settings-btn settings-btn-secondary" style={{ textDecoration: 'none' }}>Back to Home</Link>
              <Link to="/app/settings" className="settings-btn settings-btn-primary" style={{ textDecoration: 'none' }}>Go to Settings</Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .register-agent-package-card:hover { border-color: #7c3aed !important; box-shadow: 0 4px 12px rgba(124,58,237,0.15); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .settings-input { max-width: 100% !important; }
      `}</style>
    </div>
  );
}
