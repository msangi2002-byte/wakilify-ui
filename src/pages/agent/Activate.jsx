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
    setLoading(true);
    try {
      await activateBusiness({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        category: category.trim(),
        region: region.trim(),
        district: district.trim(),
        paymentPhone: paymentPhone.trim(),
        ...(ward.trim() && { ward: ward.trim() }),
        ...(street.trim() && { street: street.trim() }),
        ...(description.trim() && { description: description.trim() }),
      });
      setSuccess('Business activation initiated. Awaiting payment confirmation.');
      setBusinessName('');
      setOwnerName('');
      setOwnerPhone('');
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
    <div className="agent-activate">
      <h1 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700 }}>
        Activate Business
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
        Review and activate a new business. The owner will complete payment to confirm activation; you will earn commission once payment is confirmed.
      </p>
      <div className="agent-card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="businessName">
              Business name *
            </label>
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
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="ownerName">
              Owner name *
            </label>
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
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="ownerPhone">
              Owner phone *
            </label>
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
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="category">
              Category *
            </label>
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
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="region">
              Region *
            </label>
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
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="district">
              District *
            </label>
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
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="paymentPhone">
              Payment phone *
            </label>
            <input
              id="paymentPhone"
              type="tel"
              className="agent-input"
              placeholder="+255712345678 (for activation fee)"
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              required
            />
            <span className="agent-stat-label" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              Owner will pay 10,000 TZS activation fee to this number.
            </span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="ward">
              Ward (optional)
            </label>
            <input
              id="ward"
              type="text"
              className="agent-input"
              placeholder="Ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="street">
              Street (optional)
            </label>
            <input
              id="street"
              type="text"
              className="agent-input"
              placeholder="Street or area"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="agent-label" htmlFor="description">
              Description (optional)
            </label>
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
            <p style={{ color: '#F09068', marginBottom: 12, fontSize: '0.9rem' }}>{error}</p>
          )}
          {success && (
            <p style={{ color: '#38B068', marginBottom: 12, fontSize: '0.9rem' }}>{success}</p>
          )}
          <button
            type="submit"
            className="agent-btn-primary"
            disabled={loading}
          >
            <Building2 size={20} />
            {loading ? 'Submitting…' : 'Activate Business'}
          </button>
        </form>
      </div>
    </div>
  );
}
