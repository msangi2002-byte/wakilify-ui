import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, UserPlus, Package, AlertTriangle, CheckCircle, Inbox, RefreshCw, Clock } from 'lucide-react';
import { activateBusiness, getAgentBusinessRequests } from '@/lib/api/agent';
import { getFeeAmounts } from '@/lib/api/config';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useGeolocation } from '@/hooks/useGeolocation';
import '@/styles/agent.css';

function formatTzs(amount) {
  if (amount == null || amount === '') return '—';
  const n = Number(amount);
  return Number.isNaN(n) ? String(amount) : n.toLocaleString('en-TZ') + ' TZS';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function Requests() {
  const { position: geoPosition } = useGeolocation(); // background: capture location for map
  const [businessActivationAmount, setBusinessActivationAmount] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [incomingLoading, setIncomingLoading] = useState(true);
  const [incomingTotal, setIncomingTotal] = useState(0);

  const loadIncomingRequests = () => {
    setIncomingLoading(true);
    getAgentBusinessRequests({ page: 0, size: 20 })
      .then((res) => {
        const content = Array.isArray(res?.content) ? res.content : [];
        setIncomingRequests(content);
        setIncomingTotal(res?.totalElements ?? content.length);
      })
      .catch(() => {
        setIncomingRequests([]);
        setIncomingTotal(0);
      })
      .finally(() => setIncomingLoading(false));
  };

  useEffect(() => {
    getFeeAmounts()
      .then((fees) => setBusinessActivationAmount(fees?.businessActivationAmount ?? 10000))
      .catch(() => setBusinessActivationAmount(10000));
  }, []);

  useEffect(() => {
    loadIncomingRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!businessName.trim() || !ownerName.trim() || !ownerPhone.trim() || !category.trim() || !region.trim() || !district.trim() || !paymentPhone.trim()) {
      setError('Business name, owner name, owner phone, category, region, district and payment phone are required.');
      return;
    }
    if (!ownerPassword || ownerPassword.length < 6) {
      setError('Owner password is required (min 6 characters) so they can log in after payment.');
      return;
    }
    if (ownerPassword !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }
    setLoading(true);
    try {
      await activateBusiness({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail.trim() || undefined,
        ownerPassword: ownerPassword,
        category: category.trim(),
        region: region.trim(),
        district: district.trim(),
        paymentPhone: paymentPhone.trim(),
        ...(ward.trim() && { ward: ward.trim() }),
        ...(street.trim() && { street: street.trim() }),
        ...(description.trim() && { description: description.trim() }),
        ...(geoPosition?.latitude != null && { latitude: geoPosition.latitude }),
        ...(geoPosition?.longitude != null && { longitude: geoPosition.longitude }),
      });
      setSuccess('Business activation initiated. Give the owner their email/phone and password so they can log in after payment, then go to the business dashboard.');
      setBusinessName('');
      setOwnerName('');
      setOwnerPhone('');
      setOwnerEmail('');
      setOwnerPassword('');
      setConfirmPassword('');
      setCategory('');
      setRegion('');
      setDistrict('');
      setPaymentPhone('');
      setWard('');
      setStreet('');
      setDescription('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Activation failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agent-dashboard agent-dashboard-cards agent-requests-page">
      <h1 className="agent-dashboard-title">Business Requests</h1>

      <div className="agent-dashboard-card agent-dashboard-card-incoming">
        <div className="agent-dashboard-card-activate-header">
          <h2 className="agent-dashboard-card-heading">
            <Inbox size={20} />
            Incoming requests (people who chose you)
          </h2>
          <button
            type="button"
            className="agent-btn-ghost"
            onClick={loadIncomingRequests}
            disabled={incomingLoading}
          >
            <RefreshCw size={18} style={{ animation: incomingLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
        <p className="agent-dashboard-card-desc">
          Users with an account who requested to become a business and selected you as their agent. After they complete payment, the system creates their business automatically.
        </p>
        {incomingLoading ? (
          <div className="agent-loading">Loading…</div>
        ) : incomingRequests.length === 0 ? (
          <p className="agent-empty">No incoming requests yet. Share your agent code so users can select you when they request to become a business.</p>
        ) : (
          <ul className="agent-requests-list">
            {incomingRequests.map((req) => {
              const status = (req.status || 'PENDING').toUpperCase();
              const isPending = status === 'PENDING';
              return (
                <li key={req.id} className="agent-request-card">
                  <div className="agent-request-header">
                    <Building2 className="agent-request-icon" size={20} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="agent-request-name">{req.businessName || 'Unnamed'}</div>
                      {(req.userName || req.userPhone) && (
                        <div className="agent-request-meta">
                          {req.userName && <span>{req.userName}</span>}
                          {req.userPhone && <span>{req.userName ? ` · ${req.userPhone}` : req.userPhone}</span>}
                        </div>
                      )}
                    </div>
                    <span
                      className={`agent-request-status ${isPending ? 'agent-request-status-pending' : 'agent-request-status-approved'}`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="agent-request-details">
                    {req.category && <div className="agent-request-row"><strong>Category:</strong> {req.category}</div>}
                    {(req.region || req.district) && (
                      <div className="agent-request-row">
                        <strong>Location:</strong> {[req.region, req.district].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {req.createdAt && (
                      <div className="agent-request-row">
                        <strong>Requested:</strong>{' '}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {isPending ? <Clock size={14} /> : <CheckCircle size={14} />}
                          {formatDate(req.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {incomingTotal > incomingRequests.length && (
          <p className="agent-stat-label" style={{ marginTop: 12, marginBottom: 0 }}>
            Showing {incomingRequests.length} of {incomingTotal}
          </p>
        )}
      </div>

      <div className="agent-dashboard-card agent-dashboard-card-requests">
        <h2 className="agent-dashboard-card-heading">
          <UserPlus size={20} />
          Add user (no account)
        </h2>
        <p className="agent-dashboard-card-desc">
          Register a new business owner who does not have an account. Enter their details; they will pay the activation fee to complete. Users who already have an account use the app and pay via USSD.
        </p>
        <form onSubmit={handleSubmit} className="agent-requests-form agent-requests-form-cols">
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="businessName">Business name *</label>
              <input
                id="businessName"
                type="text"
                className="agent-input"
                placeholder="e.g. Mama Ntilie Food"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="ownerName">Owner name *</label>
              <input
                id="ownerName"
                type="text"
                className="agent-input"
                placeholder="e.g. John Mwangi"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="ownerPhone">Owner phone *</label>
              <input
                id="ownerPhone"
                type="tel"
                className="agent-input"
                placeholder="+255787654321"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                required
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="ownerEmail">Owner email (optional)</label>
              <input
                id="ownerEmail"
                type="email"
                className="agent-input"
                placeholder="owner@example.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                autoComplete="off"
              />
              <span className="agent-stat-label">Owner can log in with phone or email after payment.</span>
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="ownerPassword">Owner password *</label>
              <input
                id="ownerPassword"
                type="password"
                className="agent-input"
                placeholder="Min 6 characters"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
              <span className="agent-stat-label">They will use this to log in after payment and access the business dashboard.</span>
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="confirmPassword">Confirm password *</label>
              <input
                id="confirmPassword"
                type="password"
                className="agent-input"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="category">Category *</label>
              <input
                id="category"
                type="text"
                className="agent-input"
                placeholder="e.g. Food & Beverage"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="region">Region *</label>
              <input
                id="region"
                type="text"
                className="agent-input"
                placeholder="e.g. Dar es Salaam"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                required
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="district">District *</label>
              <input
                id="district"
                type="text"
                className="agent-input"
                placeholder="e.g. Temeke"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="paymentPhone">Payment phone *</label>
              <input
                id="paymentPhone"
                type="tel"
                className="agent-input"
                placeholder={`+255712345678 (for ${businessActivationAmount != null ? formatTzs(businessActivationAmount) : '—'} activation fee)`}
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                required
              />
              <span className="agent-stat-label">Owner will pay {formatTzs(businessActivationAmount)} to this number to complete activation.</span>
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="ward">Ward (optional)</label>
              <input
                id="ward"
                type="text"
                className="agent-input"
                placeholder="Ward"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="street">Street (optional)</label>
              <input
                id="street"
                type="text"
                className="agent-input"
                placeholder="Street or area"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
            <div className="agent-form-field agent-form-field-full">
              <label className="agent-label" htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                className="agent-input"
                placeholder="Business description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ resize: 'vertical', minHeight: 60 }}
              />
            </div>
            {error && (
              <div className="agent-dashboard-card-alert agent-dashboard-card-alert-error" role="alert">
                <AlertTriangle size={18} />
                <div>
                  <p style={{ margin: 0 }}>{error}</p>
                  {(error.toLowerCase().includes('package limit') || error.toLowerCase().includes('upgrade') || error.toLowerCase().includes('purchase a package')) && (
                    <Link to="/agent" className="agent-dashboard-action-link agent-dashboard-action-secondary" style={{ marginTop: 8, display: 'inline-flex' }}>
                      <Package size={16} />
                      Upgrade Package
                    </Link>
                  )}
                </div>
              </div>
            )}
            {success && (
              <div className="agent-dashboard-card-alert agent-dashboard-card-alert-success" role="status">
                <CheckCircle size={18} />
                {success}
              </div>
            )}
            <button
              type="submit"
              className="agent-btn-primary agent-requests-submit"
              disabled={loading}
            >
              <Building2 size={20} />
              {loading ? 'Submitting…' : 'Add user & initiate activation'}
            </button>
          </form>
      </div>
    </div>
  );
}
