import { useState } from 'react';
import { Building2, UserPlus } from 'lucide-react';
import { activateBusiness } from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/agent.css';

export default function Requests() {
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
    <div className="agent-requests agent-requests--centered">
      <div className="agent-requests-inner">
        <h1 className="agent-requests-title">
          <UserPlus size={28} />
          Add user (no account)
        </h1>
        <p className="agent-requests-desc">
          Register a new business owner who does not have an account. Enter their details; they will pay the activation fee to complete. Users who already have an account use the app and pay via USSD.
        </p>
        <div className="agent-card agent-requests-card">
          <form onSubmit={handleSubmit} className="agent-requests-form">
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
                placeholder="+255712345678 (for 10,000 TZS activation fee)"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                required
              />
              <span className="agent-stat-label">Owner will pay 10,000 TZS to this number to complete activation.</span>
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
              <p className="agent-requests-message agent-requests-message--error" role="alert">{error}</p>
            )}
            {success && (
              <p className="agent-requests-message agent-requests-message--success" role="status">{success}</p>
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
    </div>
  );
}
