import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, TrendingUp, DollarSign, Plus } from 'lucide-react';
import { getBusinessDashboard } from '@/lib/api/business';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getBusinessDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load dashboard'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
    productsCount: 0,
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
                <div className="business-stat-value" style={{ color: '#8b5cf6' }}>{stats.productsCount || 0}</div>
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
    </div>
  );
}
