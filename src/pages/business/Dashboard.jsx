import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, TrendingUp, DollarSign, Plus, Star, X } from 'lucide-react';
import { getBusinessDashboard, getBusinessMe } from '@/lib/api/business';
import { getMe, rateAgent } from '@/lib/api/users';
import { setAuth, getToken } from '@/store/auth.store';
import PromoteModal from '@/components/business/PromoteModal';
import { getApiErrorMessage } from '@/lib/utils/apiError';

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPromoteBusiness, setShowPromoteBusiness] = useState(false);
  const [showRateAgent, setShowRateAgent] = useState(false);
  const [rateAgentPayload, setRateAgentPayload] = useState(null);
  const [rateRating, setRateRating] = useState(0);
  const [rateComment, setRateComment] = useState('');
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([getBusinessDashboard(), getBusinessMe()])
      .then(([dashData, bizData]) => {
        if (!cancelled) {
          setDashboard(dashData ?? null);
          setBusiness(bizData ?? null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load dashboard'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // First-time: when dashboard is ready, check if user should rate their registration agent (GET /me)
  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled || !me?.shouldRateAgent || !me?.rateAgentId) return;
        setRateAgentPayload({
          agentId: me.rateAgentId,
          agentName: me.rateAgentName || 'Your agent',
        });
        setShowRateAgent(true);
        setRateRating(0);
        setRateComment('');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [loading]);

  const handleSubmitRate = async (e) => {
    e.preventDefault();
    if (!rateAgentPayload || rateRating < 1 || rateRating > 5) return;
    setRateLoading(true);
    try {
      await rateAgent(rateAgentPayload.agentId, rateRating, rateComment.trim() || undefined);
      const token = getToken();
      const updated = await getMe();
      if (updated && token) setAuth(updated, token);
      setShowRateAgent(false);
      setRateAgentPayload(null);
      setRateRating(0);
      setRateComment('');
    } catch (_) {}
    finally {
      setRateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="business-loading">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="business-empty">
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  const stats = dashboard || {
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    activeProducts: 0,
    completedOrders: 0,
    todayRevenue: 0,
    monthRevenue: 0,
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>
          Business Dashboard
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Welcome back! Here's an overview of your business performance.
        </p>
      </div>

      <div className="business-grid business-grid-2" style={{ marginBottom: '32px' }}>
        <div className="business-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={24} color="#3b82f6" />
              </div>
              <div>
                <div className="business-stat-label">Total Revenue</div>
                <div className="business-stat-value primary">{formatCurrency(stats.totalRevenue)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="business-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={24} color="#22c55e" />
              </div>
              <div>
                <div className="business-stat-label">Total Orders</div>
                <div className="business-stat-value success">{stats.totalOrders || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="business-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} color="#f59e0b" />
              </div>
              <div>
                <div className="business-stat-label">Pending Orders</div>
                <div className="business-stat-value warning">{stats.pendingOrders || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="business-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={24} color="#8b5cf6" />
              </div>
              <div>
                <div className="business-stat-label">Total Products</div>
                <div className="business-stat-value" style={{ color: '#8b5cf6' }}>{stats.totalProducts || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="business-card">
        <div className="business-card-title">Quick Actions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <Link to="/business/products/new" className="business-btn-primary">
            <Plus size={20} />
            Post New Product
          </Link>
          {business?.id && (
            <button
              type="button"
              className="business-btn-secondary"
              onClick={() => setShowPromoteBusiness(true)}
            >
              <TrendingUp size={20} />
              Promote My Business
            </button>
          )}
          <Link to="/business/products" className="business-btn-secondary">
            <Package size={20} />
            Manage Products
          </Link>
          <Link to="/business/orders" className="business-btn-ghost">
            <ShoppingBag size={20} />
            View Orders
          </Link>
          <Link to="/business/stats" className="business-btn-ghost">
            <TrendingUp size={20} />
            View Analytics
          </Link>
        </div>
      </div>

      {showPromoteBusiness && business?.id && (
        <PromoteModal
          type="BUSINESS"
          targetId={business.id}
          title={business.name || 'Biashara yangu'}
          onClose={() => setShowPromoteBusiness(false)}
          onSuccess={() => {}}
        />
      )}

      {showRateAgent && rateAgentPayload && (
        <div
          className="business-rate-agent-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="business-rate-agent-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="business-rate-agent-modal"
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 400,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 id="business-rate-agent-title" style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>
                Rate your registration agent
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowRateAgent(false);
                  setRateAgentPayload(null);
                  setRateRating(0);
                  setRateComment('');
                }}
                aria-label="Close"
                style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmitRate}>
              <p style={{ marginBottom: 12, color: '#6b7280', fontSize: 14 }}>
                How was your experience with <strong style={{ color: '#111827' }}>{rateAgentPayload.agentName}</strong>?
              </p>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRateRating(n)}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star size={28} fill={rateRating >= n ? '#f59e0b' : 'none'} stroke="#f59e0b" />
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Comment (optional)
                </label>
                <textarea
                  placeholder="Share your experience…"
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 10,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    color: '#111827',
                    backgroundColor: '#fff',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRateAgent(false);
                    setRateAgentPayload(null);
                    setRateRating(0);
                    setRateComment('');
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={rateRating < 1 || rateLoading}
                  className="business-btn-primary"
                  style={{ padding: '10px 20px', fontSize: 14 }}
                >
                  {rateLoading ? 'Submitting…' : 'Submit rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
