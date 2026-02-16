import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';
import { getAdminSettings, updateAdminSettings } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    agentRegisterAmount: '',
    businessActivationAmount: '',
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const settings = await getAdminSettings();
      setForm({
        agentRegisterAmount: settings?.agentRegisterAmount != null ? String(settings.agentRegisterAmount) : '20000',
        businessActivationAmount: settings?.businessActivationAmount != null ? String(settings.businessActivationAmount) : '10000',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const agentNum = parseFloat(form.agentRegisterAmount);
    const businessNum = parseFloat(form.businessActivationAmount);
    if (Number.isNaN(agentNum) || agentNum < 0) {
      setError('Agent register amount must be a non-negative number.');
      return;
    }
    if (Number.isNaN(businessNum) || businessNum < 0) {
      setError('Business activation amount must be a non-negative number.');
      return;
    }
    setSaving(true);
    try {
      await updateAdminSettings({
        agentRegisterAmount: agentNum,
        businessActivationAmount: businessNum,
      });
      setSuccess('Settings saved. Agent registration and business activation amounts are updated.');
      loadSettings();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <Loader2 size={32} className="admin-icon-spin" style={{ color: '#7c3aed' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Admin Settings
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Configure system-wide amounts for agent registration and business activation.
            </p>
          </div>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'rgba(124, 58, 237, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed',
          }}>
            <SettingsIcon size={28} />
          </div>
        </div>

        {error && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 8,
            color: '#fca5a5',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 8,
            color: '#6ee7b7',
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset className="admin-settings-fieldset" style={{
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}>
            <legend style={{
              color: '#fff',
              fontWeight: 600,
              fontSize: '1rem',
              padding: '0 8px',
            }}>
              Setup amounts (TZS)
            </legend>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, margin: '0 0 20px 0' }}>
              These amounts are shown on the agent registration and business activation flows and are used when creating payments.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, marginBottom: 8 }}>
                Agent register amount (TZS)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.agentRegisterAmount}
                onChange={(e) => setForm((f) => ({ ...f, agentRegisterAmount: e.target.value }))}
                placeholder="e.g. 20000"
                style={{
                  width: '100%',
                  maxWidth: 280,
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 16,
                }}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, marginLeft: 8 }}>Amount users pay to register as an agent.</span>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, marginBottom: 8 }}>
                Business activation amount (TZS)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.businessActivationAmount}
                onChange={(e) => setForm((f) => ({ ...f, businessActivationAmount: e.target.value }))}
                placeholder="e.g. 10000"
                style={{
                  width: '100%',
                  maxWidth: 280,
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 16,
                }}
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, marginLeft: 8 }}>Amount to be paid to activate a business.</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {saving ? <Loader2 size={20} className="admin-icon-spin" /> : <Save size={20} />}
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
