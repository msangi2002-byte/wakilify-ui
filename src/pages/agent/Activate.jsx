import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { activateBusiness } from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/agent.css';

export default function Activate() {
  const location = useLocation();
  const fromRequest = location.state?.fromRequest;
  const [businessName, setBusinessName] = useState(fromRequest?.businessName ?? '');
  const [ownerName, setOwnerName] = useState(fromRequest?.ownerName ?? '');
  const [ownerPhone, setOwnerPhone] = useState(fromRequest?.ownerPhone ?? '');
  const [ownerEmail, setOwnerEmail] = useState(fromRequest?.ownerEmail ?? '');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [category, setCategory] = useState(fromRequest?.category ?? '');
  const [region, setRegion] = useState(fromRequest?.region ?? '');
  const [district, setDistrict] = useState(fromRequest?.district ?? '');
  const [paymentPhone, setPaymentPhone] = useState(fromRequest?.paymentPhone ?? '');
  const [ward, setWard] = useState(fromRequest?.ward ?? '');
  const [street, setStreet] = useState(fromRequest?.street ?? '');
  const [description, setDescription] = useState(fromRequest?.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (fromRequest) {
      if (fromRequest.businessName) setBusinessName(fromRequest.businessName);
      if (fromRequest.ownerName) setOwnerName(fromRequest.ownerName);
      if (fromRequest.ownerPhone) setOwnerPhone(fromRequest.ownerPhone);
      if (fromRequest.ownerEmail) setOwnerEmail(fromRequest.ownerEmail);
      if (fromRequest.category) setCategory(fromRequest.category);
      if (fromRequest.region) setRegion(fromRequest.region);
      if (fromRequest.district) setDistrict(fromRequest.district);
      if (fromRequest.paymentPhone) setPaymentPhone(fromRequest.paymentPhone);
      if (fromRequest.ward) setWard(fromRequest.ward);
      if (fromRequest.street) setStreet(fromRequest.street);
      if (fromRequest.description) setDescription(fromRequest.description);
    }
  }, [fromRequest]);

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
        ownerPassword,
        category: category.trim(),
        region: region.trim(),
        district: district.trim(),
        paymentPhone: paymentPhone.trim(),
        ...(ward.trim() && { ward: ward.trim() }),
        ...(street.trim() && { street: street.trim() }),
        ...(description.trim() && { description: description.trim() }),
      });
      setSuccess('Business activation initiated. Give the owner their email/phone and password to log in after payment and access the business dashboard.');
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
    <div className="agent-activate agent-activate--centered">
      <div className="agent-activate-inner">
        <h1 className="agent-activate-title">
          <Building2 size={28} />
          Activate Business
        </h1>
        <p className="agent-activate-desc">
          Review and activate a new business. The owner will complete payment to confirm activation; you will earn commission once payment is confirmed.
        </p>
        <div className="agent-card agent-activate-card">
          <form onSubmit={handleSubmit} className="agent-activate-form">
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
                placeholder="+255712345678 (for activation fee)"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                required
              />
              <span className="agent-stat-label">Owner will pay 10,000 TZS activation fee to this number.</span>
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
            <div className="agent-form-field">
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
              <p className="agent-activate-message agent-activate-message--error" role="alert">{error}</p>
            )}
            {success && (
              <p className="agent-activate-message agent-activate-message--success" role="status">{success}</p>
            )}
            <button
              type="submit"
              className="agent-btn-primary agent-activate-submit"
              disabled={loading}
            >
              <Building2 size={20} />
              {loading ? 'Submitting…' : 'Activate Business'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
