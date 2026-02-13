import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Package, Users, Star, Calendar, Loader2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { getBusinessDashboard, getBusinessOrders, getBusinessProducts } from '@/lib/api/business';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return new Intl.NumberFormat('en-TZ').format(num);
}

function StatCard({ icon: Icon, label, value, subValue, trend, color = '#3b82f6', bgColor = '#eff6ff' }) {
  return (
    <div className="business-card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} style={{ color }} />
            </div>
          <div>
            <div className="business-stat-label">{label}</div>
            <div className="business-stat-value" style={{ color }}>{value}</div>
          </div>
        </div>
      </div>
      {subValue && (
        <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '6px' }}>{subValue}</div>
      )}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.8125rem', color: trend > 0 ? '#22c55e' : trend < 0 ? '#ef4444' : '#6b7280' }}>
          {trend > 0 ? <ArrowUp size={14} /> : trend < 0 ? <ArrowDown size={14} /> : null}
          <span>{Math.abs(trend)}% from last period</span>
        </div>
      )}
    </div>
  );
}

export default function Stats() {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('month'); // day, week, month, year

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      getBusinessDashboard().catch(() => null),
      getBusinessOrders({ page: 0, size: 100 }).catch(() => ({ content: [] })),
      getBusinessProducts({ page: 0, size: 100 }).catch(() => ({ content: [] })),
    ])
      .then(([dashboardData, ordersData, productsData]) => {
        if (!cancelled) {
          setDashboard(dashboardData);
          setOrders(Array.isArray(ordersData?.content) ? ordersData.content : []);
          setProducts(Array.isArray(productsData?.content) ? productsData.content : []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load analytics'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="business-loading">
        <Loader2 size={32} className="icon-spin" />
        <div>Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="business-card" style={{ textAlign: 'center', padding: '48px' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
      </div>
    );
  }

  const stats = dashboard || {};
  
  // Calculate additional metrics
  const completedOrders = stats.completedOrders || 0;
  const activeProducts = stats.activeProducts || 0;
  const totalProducts = stats.totalProducts || 0;
  const todayRevenue = stats.todayRevenue || 0;
  const monthRevenue = stats.monthRevenue || 0;
  const totalRevenue = stats.totalRevenue || 0;
  const averageOrderValue = stats.totalOrders > 0 ? (totalRevenue / stats.totalOrders) : 0;
  const conversionRate = stats.totalViews > 0 ? ((stats.totalOrders / stats.totalViews) * 100) : 0;

  // Order status breakdown
  const orderStatusCounts = {
    pending: orders.filter(o => o.status === 'PENDING').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
  };

  // Top products by orders (if we have order items)
  const productOrders = {};
  orders.forEach(order => {
    if (order.items) {
      order.items.forEach(item => {
        const productId = item.productId || item.product?.id;
        if (productId) {
          productOrders[productId] = (productOrders[productId] || 0) + item.quantity;
        }
      });
    }
  });

  const topProducts = Object.entries(productOrders)
    .map(([productId, count]) => {
      const product = products.find(p => p.id === productId);
      return { product, count };
    })
    .filter(p => p.product)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="business-main" style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="business-dashboard-title" style={{ margin: 0, marginBottom: '4px', fontSize: '1.5rem' }}>
            <TrendingUp size={24} />
            Analytics & Statistics
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Detailed insights into your business performance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['day', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={timeRange === range ? 'business-btn-primary' : 'business-btn-ghost'}
              style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="business-grid business-grid-3" style={{ marginBottom: '20px' }}>
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subValue={`${formatCurrency(monthRevenue)} this month`}
          color="#3b82f6"
          bgColor="#eff6ff"
        />
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          subValue={todayRevenue > 0 ? 'Great start!' : 'No sales today yet'}
          color="#22c55e"
          bgColor="#f0fdf4"
        />
        <StatCard
          icon={DollarSign}
          label="This Month"
          value={formatCurrency(monthRevenue)}
          subValue={`${formatCurrency(averageOrderValue)} avg per order`}
          color="#8b5cf6"
          bgColor="#f5f3ff"
        />
      </div>

      {/* Orders Overview */}
      <div className="business-grid business-grid-4" style={{ marginBottom: '20px' }}>
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={formatNumber(stats.totalOrders || 0)}
          subValue={`${completedOrders} completed`}
          color="#3b82f6"
          bgColor="#eff6ff"
        />
        <StatCard
          icon={ShoppingBag}
          label="Pending Orders"
          value={formatNumber(stats.pendingOrders || 0)}
          subValue="Requires attention"
          color="#f59e0b"
          bgColor="#fffbeb"
        />
        <StatCard
          icon={ShoppingBag}
          label="Completed Orders"
          value={formatNumber(completedOrders)}
          subValue={`${stats.totalOrders > 0 ? Math.round((completedOrders / stats.totalOrders) * 100) : 0}% completion rate`}
          color="#22c55e"
          bgColor="#f0fdf4"
        />
        <StatCard
          icon={DollarSign}
          label="Avg Order Value"
          value={formatCurrency(averageOrderValue)}
          subValue="Per transaction"
          color="#8b5cf6"
          bgColor="#f5f3ff"
        />
      </div>

      {/* Products & Performance */}
      <div className="business-grid business-grid-3" style={{ marginBottom: '20px' }}>
        <StatCard
          icon={Package}
          label="Total Products"
          value={formatNumber(totalProducts)}
          subValue={`${activeProducts} active products`}
          color="#8b5cf6"
          bgColor="#f5f3ff"
        />
        {stats.averageRating > 0 && (
          <StatCard
            icon={Star}
            label="Average Rating"
            value={stats.averageRating.toFixed(1)}
            subValue={`${formatNumber(stats.totalReviews || 0)} reviews`}
            color="#fbbf24"
            bgColor="#fffbeb"
          />
        )}
        {stats.totalViews > 0 && (
          <StatCard
            icon={Users}
            label="Total Views"
            value={formatNumber(stats.totalViews)}
            subValue={`${conversionRate.toFixed(1)}% conversion rate`}
            color="#06b6d4"
            bgColor="#ecfeff"
          />
        )}
      </div>

      {/* Order Status Breakdown */}
      <div className="business-card" style={{ marginBottom: '20px', padding: '16px' }}>
        <h2 className="business-card-title" style={{ fontSize: '1rem', marginBottom: '12px' }}>Order Status Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginTop: '12px' }}>
          {Object.entries(orderStatusCounts).map(([status, count]) => (
            <div key={status} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '6px', textTransform: 'capitalize' }}>
                {status}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                {formatNumber(count)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="business-card" style={{ marginBottom: '20px', padding: '16px' }}>
          <h2 className="business-card-title" style={{ fontSize: '1rem', marginBottom: '12px' }}>Top Selling Products</h2>
          <div style={{ marginTop: '12px' }}>
            {topProducts.map((item, index) => (
              <div
                key={item.product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: index % 2 === 0 ? '#f9fafb' : 'transparent',
                  borderRadius: '8px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6b7280', fontSize: '0.875rem' }}>
                  {index + 1}
                </div>
                {item.product.thumbnail && (
                  <img
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '2px', fontSize: '0.9375rem' }}>{item.product.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    {formatCurrency(item.product.price || 0)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#3b82f6' }}>
                    {formatNumber(item.count)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>units</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Summary */}
      <div className="business-card" style={{ padding: '16px' }}>
        <h2 className="business-card-title" style={{ fontSize: '1rem', marginBottom: '12px' }}>Performance Summary</h2>
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '6px' }}>Order Completion Rate</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
              {stats.totalOrders > 0 ? Math.round((completedOrders / stats.totalOrders) * 100) : 0}%
            </div>
          </div>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '6px' }}>Active Products Rate</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
              {totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0}%
            </div>
          </div>
          {stats.totalViews > 0 && (
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '6px' }}>Conversion Rate</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                {conversionRate.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
