import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle, Building2, MapPin, Phone, Mail, Globe, Camera, Image as ImageIcon, X } from 'lucide-react';
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
    <div className="business-main" style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="business-dashboard-title" style={{ margin: 0, marginBottom: '4px', fontSize: '1.5rem' }}>
          <Building2 size={24} />
          Business Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          Manage your business profile and information
        </p>
      </div>

      {error && (
        <div className="business-card" style={{ marginBottom: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="business-card" style={{ marginBottom: '24px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#22c55e' }}>
            <CheckCircle size={20} />
            <p style={{ margin: 0, fontWeight: 500 }}>{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Business Information */}
        <div className="business-card" style={{ marginBottom: '16px' }}>
          <h2 className="business-card-title">Business Information</h2>
          
          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="name">
              Business Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="name"
              type="text"
              className="agent-input"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="Enter business name"
            />
          </div>

          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="agent-input"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your business"
              rows={4}
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </div>

          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              type="text"
              className="agent-input"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="e.g., Electronics, Fashion, Food"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="business-card" style={{ marginBottom: '16px' }}>
          <h2 className="business-card-title">Contact Information</h2>
          
          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="phone">
              <Phone size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className="agent-input"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+255712345678"
            />
          </div>

          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="email">
              <Mail size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="agent-input"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="business@example.com"
            />
          </div>

          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="website">
              <Globe size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Website
            </label>
            <input
              id="website"
              type="url"
              className="agent-input"
              value={form.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.example.com"
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="business-card" style={{ marginBottom: '16px' }}>
          <h2 className="business-card-title">
            <MapPin size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Location
          </h2>
          
          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="region">
              Region
            </label>
            <input
              id="region"
              type="text"
              className="agent-input"
              value={form.region}
              onChange={(e) => handleChange('region', e.target.value)}
              placeholder="e.g., Dar es Salaam"
            />
          </div>

          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="district">
              District
            </label>
            <input
              id="district"
              type="text"
              className="agent-input"
              value={form.district}
              onChange={(e) => handleChange('district', e.target.value)}
              placeholder="e.g., Kinondoni"
            />
          </div>

          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="ward">
              Ward (optional)
            </label>
            <input
              id="ward"
              type="text"
              className="agent-input"
              value={form.ward}
              onChange={(e) => handleChange('ward', e.target.value)}
              placeholder="Ward name"
            />
          </div>

          <div className="agent-form-field" style={{ marginBottom: '16px' }}>
            <label className="agent-label" htmlFor="street">
              Street/Area (optional)
            </label>
            <input
              id="street"
              type="text"
              className="agent-input"
              value={form.street}
              onChange={(e) => handleChange('street', e.target.value)}
              placeholder="Street name or area"
            />
          </div>
        </div>

        {/* Business Status Info */}
        {business && (
          <div className="business-card" style={{ marginBottom: '16px' }}>
            <h2 className="business-card-title">Business Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                <div style={{ fontWeight: 600, color: business.status === 'APPROVED' || business.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }}>
                  {business.status || 'PENDING'}
                </div>
              </div>
              {business.isVerified && (
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Verification</div>
                  <div style={{ fontWeight: 600, color: '#22c55e' }}>Verified ✓</div>
                </div>
              )}
              {business.subscription && (
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>Subscription</div>
                  <div style={{ fontWeight: 600 }}>
                    {business.subscription.plan || 'NONE'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="business-btn-primary"
            disabled={saving}
            style={{ minWidth: '150px' }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="icon-spin" style={{ marginRight: '8px' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} style={{ marginRight: '8px' }} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
