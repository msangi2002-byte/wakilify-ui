import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle, Building2, MapPin, Phone } from 'lucide-react';
import { getBusinessMe, updateBusinessMe } from '@/lib/api/business';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

export default function Settings() {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    website: '',
    region: '',
    district: '',
    ward: '',
    street: '',
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    getBusinessMe()
      .then((data) => {
        if (!cancelled && data) {
          setBusiness(data);
          setForm({
            name: data.name || '',
            description: data.description || '',
            category: data.category || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            region: data.region || '',
            district: data.district || '',
            ward: data.ward || '',
            street: data.street || '',
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load business profile'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateBusinessMe(form);
      setBusiness(updated);
      setSuccess('Business profile updated successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update business profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="business-loading">
        <Loader2 size={32} className="icon-spin" />
        <div>Loading business settings...</div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="business-card" style={{ textAlign: 'center', padding: '48px' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="business-main">
      <div className="business-settings">
        <header className="business-settings-header">
          <h1>
            <Building2 size={20} />
            Business Settings
          </h1>
          <p>Manage your business profile and information</p>
        </header>

        {error && (
          <div className="business-settings-alert business-settings-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="business-settings-alert business-settings-alert-success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="business-settings-card">
            <h2 className="business-settings-card-title">Business Information</h2>
            <div className="business-settings-grid">
              <div className="business-settings-field business-settings-grid-full">
                <label className="business-settings-label" htmlFor="name">Business Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  id="name"
                  type="text"
                  className="business-settings-input"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="Enter business name"
                />
              </div>
              <div className="business-settings-field business-settings-grid-full">
                <label className="business-settings-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="business-settings-input"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe your business"
                />
              </div>
              <div className="business-settings-field">
                <label className="business-settings-label" htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  className="business-settings-input"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  placeholder="e.g. Electronics, Fashion"
                />
              </div>
            </div>
          </div>

          <div className="business-settings-card">
            <h2 className="business-settings-card-title"><Phone size={16} /> Contact</h2>
            <div className="business-settings-grid">
              <div className="business-settings-field">
                <label className="business-settings-label" htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  className="business-settings-input"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+255712345678"
                />
              </div>
              <div className="business-settings-field">
                <label className="business-settings-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="business-settings-input"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
              <div className="business-settings-field business-settings-grid-full">
                <label className="business-settings-label" htmlFor="website">Website</label>
                <input
                  id="website"
                  type="url"
                  className="business-settings-input"
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>

          <div className="business-settings-card">
            <h2 className="business-settings-card-title"><MapPin size={16} /> Location</h2>
            <div className="business-settings-grid">
              <div className="business-settings-field">
                <label className="business-settings-label" htmlFor="region">Region</label>
                <input
                  id="region"
                  type="text"
                  className="business-settings-input"
                  value={form.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  placeholder="e.g. Dar es Salaam"
                />
              </div>
              <div className="business-settings-field">
                <label className="business-settings-label" htmlFor="district">District</label>
                <input
                  id="district"
                  type="text"
                  className="business-settings-input"
                  value={form.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder="e.g. Kinondoni"
                />
              </div>
              <div className="business-settings-field">
                <label className="business-settings-label" htmlFor="ward">Ward (optional)</label>
                <input
                  id="ward"
                  type="text"
                  className="business-settings-input"
                  value={form.ward}
                  onChange={(e) => handleChange('ward', e.target.value)}
                  placeholder="Ward name"
                />
              </div>
              <div className="business-settings-field">
                <label className="business-settings-label" htmlFor="street">Street/Area (optional)</label>
                <input
                  id="street"
                  type="text"
                  className="business-settings-input"
                  value={form.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  placeholder="Street or area"
                />
              </div>
            </div>
          </div>

          {business && (
            <div className="business-settings-card">
              <h2 className="business-settings-card-title">Status</h2>
              <div className="business-settings-status-row">
                <div className="business-settings-status-item">
                  <label>Status</label>
                  <span style={{ color: business.status === 'APPROVED' || business.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }}>{business.status || 'PENDING'}</span>
                </div>
                {business.isVerified && (
                  <div className="business-settings-status-item">
                    <label>Verification</label>
                    <span style={{ color: '#22c55e' }}>Verified ✓</span>
                  </div>
                )}
                {business.subscription && (
                  <div className="business-settings-status-item">
                    <label>Subscription</label>
                    <span>{business.subscription.plan || 'NONE'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="business-settings-actions">
            <button type="submit" className="business-btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="icon-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
