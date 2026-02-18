import { useState, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  RefreshCw,
  DollarSign,
  Database,
  Server,
  Trash2,
  AlertTriangle,
  Shield,
  Info,
  Zap,
} from 'lucide-react';
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminSystemInfo,
  clearAdminCache,
} from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const TABS = [
  { id: 'general', label: 'General', icon: DollarSign, description: 'Fees & amounts' },
  { id: 'cache', label: 'Cache & performance', icon: Zap, description: 'Clear caches' },
  { id: 'system', label: 'System info', icon: Server, description: 'App & caches status' },
  { id: 'maintenance', label: 'Maintenance', icon: Trash2, description: 'Cache & cleanup' },
];

const adminCardStyle = { marginBottom: '32px' };
const sectionCardStyle = {
  padding: '24px',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '24px',
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    agentRegisterAmount: '',
    toBeBusinessAmount: '',
    adsPricePerPerson: '',
  });
  const [systemInfo, setSystemInfo] = useState(null);
  const [systemInfoLoading, setSystemInfoLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const settings = await getAdminSettings();
      setForm({
        agentRegisterAmount: settings?.agentRegisterAmount != null ? String(settings.agentRegisterAmount) : '20000',
        toBeBusinessAmount: settings?.toBeBusinessAmount != null ? String(settings.toBeBusinessAmount) : '10000',
        adsPricePerPerson: settings?.adsPricePerPerson != null ? String(settings.adsPricePerPerson) : '2',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSystemInfo = useCallback(async () => {
    setSystemInfoLoading(true);
    try {
      const info = await getAdminSystemInfo();
      setSystemInfo(info);
    } catch (err) {
      setSystemInfo(null);
    } finally {
      setSystemInfoLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (activeTab === 'system' || activeTab === 'cache' || activeTab === 'maintenance') {
      loadSystemInfo();
    }
  }, [activeTab, loadSystemInfo]);

  const showMessage = (msg, isError = false) => {
    setError(isError ? msg : '');
    setSuccess(isError ? '' : msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const agentNum = parseFloat(form.agentRegisterAmount);
    const businessNum = parseFloat(form.toBeBusinessAmount);
    const adsNum = parseFloat(form.adsPricePerPerson);
    if (Number.isNaN(agentNum) || agentNum < 0) {
      setError('Agent register amount must be a non-negative number.');
      return;
    }
    if (Number.isNaN(businessNum) || businessNum < 0) {
      setError('Business activation amount must be a non-negative number.');
      return;
    }
    if (Number.isNaN(adsNum) || adsNum < 0) {
      setError('Ads price per person must be a non-negative number.');
      return;
    }
    setSaving(true);
    try {
      await updateAdminSettings({
        agentRegisterAmount: agentNum,
        toBeBusinessAmount: businessNum,
        adsPricePerPerson: adsNum,
      });
      showMessage('Settings saved. Fees and ads pricing updated.');
      loadSettings();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async (cacheKey) => {
    setClearingCache(cacheKey);
    setError('');
    setSuccess('');
    try {
      const result = await clearAdminCache({ cache: cacheKey });
      showMessage(result?.entriesRemoved != null
        ? `Cache "${cacheKey}" cleared (${result.entriesRemoved} entries).`
        : 'Cache cleared.');
      loadSystemInfo();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to clear cache'));
    } finally {
      setClearingCache(null);
    }
  };

  const inputStyle = {
    width: '100%',
    maxWidth: 280,
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
  };

  return (
    <div>
      <div className="admin-card" style={adminCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              System settings
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Control fees, caches, and system-wide behaviour
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

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={activeTab === id ? 'admin-btn-primary' : 'admin-btn-ghost'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
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

        {/* Tab: General */}
        {activeTab === 'general' && (
          <div style={sectionCardStyle}>
            <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={20} style={{ color: '#7c3aed' }} />
              Fees & amounts (TZS)
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, margin: '0 0 20px 0' }}>
              These amounts are used for agent registration, business activation, and ads pricing.
            </p>
            <form onSubmit={handleSubmit}>
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
                  style={inputStyle}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, marginLeft: 8 }}>Amount users pay to register as an agent.</span>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, marginBottom: 8 }}>
                  Business activation amount (TZS)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.toBeBusinessAmount}
                  onChange={(e) => setForm((f) => ({ ...f, toBeBusinessAmount: e.target.value }))}
                  placeholder="e.g. 10000"
                  style={inputStyle}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, marginLeft: 8 }}>Amount to activate a business.</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, marginBottom: 8 }}>
                  Ads price per person (TZS)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.adsPricePerPerson}
                  onChange={(e) => setForm((f) => ({ ...f, adsPricePerPerson: e.target.value }))}
                  placeholder="e.g. 2"
                  style={inputStyle}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 13, marginLeft: 8 }}>Price per person for ads.</span>
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
            </form>
          </div>
        )}

        {/* Tab: Cache & performance */}
        {activeTab === 'cache' && (
          <div style={sectionCardStyle}>
            <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} style={{ color: '#7c3aed' }} />
              Cache & performance
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, margin: '0 0 20px 0' }}>
              Clear in-memory caches to free memory or force fresh data. Use after major data changes if needed.
            </p>
            {systemInfoLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)' }}>
                <Loader2 size={20} className="admin-icon-spin" /> Loading cache status…
              </div>
            ) : systemInfo?.caches && typeof systemInfo.caches === 'object' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.entries(systemInfo.caches).map(([key, meta]) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{key}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginTop: 4 }}>
                        {meta?.description || 'Application cache'} · entries: {meta?.size ?? '—'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleClearCache(key)}
                      disabled={clearingCache === key}
                      className="admin-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      {clearingCache === key ? <Loader2 size={16} className="admin-icon-spin" /> : <RefreshCw size={16} />}
                      {clearingCache === key ? 'Clearing…' : 'Clear'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>No cache info available.</p>
            )}
          </div>
        )}

        {/* Tab: System info */}
        {activeTab === 'system' && (
          <div style={sectionCardStyle}>
            <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={20} style={{ color: '#7c3aed' }} />
              System info
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, margin: '0 0 20px 0' }}>
              Application and cache status. Use this to verify environment and cache sizes.
            </p>
            {systemInfoLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)' }}>
                <Loader2 size={20} className="admin-icon-spin" /> Loading…
              </div>
            ) : systemInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Info size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>App</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{systemInfo.appName || '—'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>v{systemInfo.version ?? '—'}</span>
                </div>
                {systemInfo.caches && typeof systemInfo.caches === 'object' && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Caches</div>
                    <ul style={{ margin: 0, paddingLeft: 20, color: 'rgba(255,255,255,0.85)' }}>
                      {Object.entries(systemInfo.caches).map(([k, v]) => (
                        <li key={k}>{k}: {v?.size ?? 0} entries {v?.description ? `(${v.description})` : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Could not load system info.</p>
            )}
          </div>
        )}

        {/* Tab: Maintenance */}
        {activeTab === 'maintenance' && (
          <div style={sectionCardStyle}>
            <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={20} style={{ color: '#f59e0b' }} />
              Maintenance & cleanup
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, margin: '0 0 20px 0' }}>
              Clear caches and run cleanup. Use after fixing bugs or when you need fresh data from external services.
            </p>
            <div style={{
              padding: 16,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 8,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>Clear geocode cache</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  Clears the in-memory cache for reverse geocoding (lat/lng → country). New lookups will call the external service again.
                </div>
                <button
                  type="button"
                  onClick={() => handleClearCache('geocode')}
                  disabled={clearingCache === 'geocode'}
                  className="admin-btn-secondary"
                  style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {clearingCache === 'geocode' ? <Loader2 size={16} className="admin-icon-spin" /> : <Trash2 size={16} />}
                  {clearingCache === 'geocode' ? 'Clearing…' : 'Clear geocode cache'}
                </button>
              </div>
            </div>
            {systemInfo?.caches && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                Current geocode cache size: {systemInfo.caches?.geocode?.size ?? 0} entries
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
