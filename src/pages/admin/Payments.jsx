import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard as CreditCardIcon,
  Search,
  Filter,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  RefreshCw,
  X,
  Eye,
  Activity,
  DollarSign,
} from 'lucide-react';
import { getAdminPayments, getAdminChartData } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const PAYMENT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
];

const PAYMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'AGENT_REGISTRATION', label: 'Agent Registration' },
  { value: 'BUSINESS_ACTIVATION', label: 'Business Activation' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'PROMOTION', label: 'Promotion/Boost' },
  { value: 'ORDER', label: 'Order' },
  { value: 'AGENT_PACKAGE', label: 'Agent Package' },
  { value: 'COIN_PURCHASE', label: 'Coin Purchase' },
];

const DATE_PRESETS = [
  { id: 'all', label: 'All Time', getRange: () => ({ start: '', end: '' }) },
  {
    id: 'today',
    label: 'Today',
    getRange: () => {
      const d = new Date().toISOString().slice(0, 10);
      return { start: d, end: d };
    },
  },
  {
    id: '7d',
    label: 'Last 7 days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    },
  },
  {
    id: '30d',
    label: 'Last 30 days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
    },
  },
  {
    id: 'month',
    label: 'This month',
    getRange: () => {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
      const end = d.toISOString().slice(0, 10);
      return { start, end };
    },
  },
];

const CHART_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#6366f1', '#22c55e', '#10b981', '#fbbf24', '#ef4444', '#94a3b8'];

export default function Payments() {
  const [mainTab, setMainTab] = useState('overview'); // overview | transactions | analytics | bytype | bystatus
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [analyticsSize] = useState(200); // larger for analytics aggregation
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  const effectiveSize = mainTab === 'analytics' || mainTab === 'bytype' || mainTab === 'bystatus' ? analyticsSize : size;

  const loadPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size: effectiveSize,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(userIdFilter && { userId: userIdFilter }),
        ...(startDate && { startDate: new Date(startDate).toISOString() }),
        ...(endDate && { endDate: new Date(endDate + 'T23:59:59').toISOString() }),
      };
      const response = await getAdminPayments(params);
      setPayments(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load payments'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, effectiveSize, statusFilter, typeFilter, userIdFilter, startDate, endDate]);

  const loadChartData = useCallback(async () => {
    setChartLoading(true);
    try {
      const data = await getAdminChartData(30);
      setChartData(data);
    } catch {
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (mainTab === 'overview' || mainTab === 'analytics') loadChartData();
  }, [mainTab, loadChartData]);

  const handleFilter = (e) => {
    e?.preventDefault();
    setPage(0);
    loadPayments();
  };

  const applyDatePreset = (preset) => {
    const { start, end } = preset.getRange();
    setStartDate(start);
    setEndDate(end);
    setPage(0);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setUserIdFilter('');
    setTransactionSearch('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const getStatusBadgeColor = (status) => {
    const map = {
      SUCCESS: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
      PENDING: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
      PROCESSING: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
      FAILED: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
      CANCELLED: { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' },
      REFUNDED: { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' },
    };
    return map[status] || { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
  };

  const getTypeBadgeColor = (type) => {
    const map = {
      AGENT_REGISTRATION: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
      BUSINESS_ACTIVATION: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
      SUBSCRIPTION: { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' },
      PROMOTION: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
      ORDER: { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' },
      AGENT_PACKAGE: { bg: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9' },
      COIN_PURCHASE: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' },
    };
    return map[type] || { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
  };

  const formatAmount = (amount) => {
    if (amount == null) return '0';
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const filteredBySearch = transactionSearch
    ? payments.filter((p) => (p.transactionId || p.id || '').toLowerCase().includes(transactionSearch.toLowerCase()))
    : payments;

  const totalAmount = payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const successCount = payments.filter((p) => p.status === 'SUCCESS').length;
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
  const failedCount = payments.filter((p) => p.status === 'FAILED').length;

  const byTypeData = Object.entries(
    payments.reduce((acc, p) => {
      const t = p.type || 'OTHER';
      acc[t] = { ...(acc[t] || { type: t, count: 0, amount: 0 }), count: acc[t]?.count + 1 || 1, amount: (acc[t]?.amount || 0) + (parseFloat(p.amount) || 0) };
      return acc;
    }, {})
  ).map(([, v]) => ({ name: (v.type || '').replace(/_/g, ' '), count: v.count, amount: v.amount }));

  const byStatusData = Object.entries(
    payments.reduce((acc, p) => {
      const s = p.status || 'UNKNOWN';
      acc[s] = { ...(acc[s] || { status: s, count: 0, amount: 0 }), count: acc[s]?.count + 1 || 1, amount: (acc[s]?.amount || 0) + (parseFloat(p.amount) || 0) };
      return acc;
    }, {})
  ).map(([, v]) => ({ name: v.status, count: v.count, amount: v.amount }));

  const revenueChartData = (chartData?.revenueByDay || []).map((d) => ({ date: d.date, value: Number(d.value || 0) }));

  const handleExportCSV = () => {
    const data = filteredBySearch;
    if (!data.length) return;
    const headers = ['Transaction ID', 'User ID', 'Type', 'Amount', 'Status', 'Method', 'Phone', 'Created', 'Paid At'];
    const rows = data.map((p) => [
      p.transactionId || p.id || '',
      p.userId || '',
      p.type || '',
      p.amount ?? '',
      p.status || '',
      (p.method || '').replace('_', ' '),
      p.paymentPhone || '',
      formatDate(p.createdAt),
      formatDate(p.paidAt),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'transactions', label: 'Transactions', icon: CreditCardIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'bytype', label: 'By Type', icon: PieChartIcon },
    { id: 'bystatus', label: 'By Status', icon: TrendingUp },
  ];

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>Payments Control Center</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>Monitor, analyze, and control all payment transactions across the platform</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { loadPayments(true); if (mainTab === 'overview' || mainTab === 'analytics') loadChartData(); }}
              disabled={refreshing}
              className="admin-btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={18} className={refreshing ? 'admin-icon-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button type="button" onClick={handleExportCSV} disabled={!payments.length} className="admin-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Download size={18} />
              Export CSV
            </button>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <CreditCardIcon size={28} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMainTab(id)}
              className={mainTab === id ? 'admin-btn-primary' : 'admin-btn-ghost'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Date:</span>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyDatePreset(p)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: startDate === p.getRange().start ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {mainTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <DollarSign size={20} color="#10b981" />
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Revenue (filtered)</span>
                </div>
                <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 700 }}>{formatAmount(totalAmount)}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 12, padding: 20 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 8 }}>Successful</div>
                <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 700 }}>{successCount}</div>
              </div>
              <div style={{ background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: 12, padding: 20 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 8 }}>Pending</div>
                <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 700 }}>{pendingCount}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 12, padding: 20 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 8 }}>Failed</div>
                <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 700 }}>{failedCount}</div>
              </div>
              <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: 12, padding: 20 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 8 }}>Total records</div>
                <div style={{ color: '#a78bfa', fontSize: '1.5rem', fontWeight: 700 }}>{totalElements}</div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
              <h3 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '1rem' }}>Revenue Trend (Last 30 days)</h3>
              {chartLoading ? (
                <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading chart...</div>
              ) : revenueChartData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }} formatter={(v) => [formatAmount(v), 'Revenue']} />
                    <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="url(#revenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>No chart data</div>
              )}
            </div>
          </>
        )}

        {mainTab === 'transactions' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                <input
                  type="text"
                  placeholder="Search by Transaction ID..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: 'rgba(124, 58, 237, 0.2)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  borderRadius: 8,
                  color: '#7c3aed',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <Filter size={16} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button type="button" onClick={clearFilters} className="admin-btn-ghost" style={{ padding: '10px 16px' }}>
                Clear all
              </button>
            </div>
            {showFilters && (
              <form onSubmit={handleFilter} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24, padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 6 }}>Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input" style={{ width: '100%' }}>
                    {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 6 }}>Type</label>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-input" style={{ width: '100%' }}>
                    {PAYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 6 }}>User ID</label>
                  <input type="text" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} placeholder="User ID" className="admin-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 6 }}>From</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="admin-input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 6 }}>To</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="admin-input" style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <button type="submit" className="admin-btn-primary">Apply</button>
                </div>
              </form>
            )}
          </>
        )}

        {mainTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ color: '#fff', margin: '0 0 16px 0' }}>By Payment Type</h4>
              {byTypeData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={byTypeData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {byTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }} formatter={(v, n) => [v + ' payments', n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>No data</div>
              )}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ color: '#fff', margin: '0 0 16px 0' }}>By Status</h4>
              {byStatusData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={byStatusData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {byStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }} formatter={(v, n) => [v + ' payments', n]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>No data</div>
              )}
            </div>
          </div>
        )}

        {mainTab === 'bytype' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            {byTypeData.length ? byTypeData.map((t, i) => (
              <div key={t.name} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: CHART_COLORS[i % CHART_COLORS.length], fontWeight: 600, marginBottom: 8 }}>{t.name}</div>
                <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>{t.count}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{formatAmount(t.amount)} total</div>
              </div>
            )) : (
              <div style={{ color: 'rgba(255,255,255,0.5)', padding: 24 }}>No data</div>
            )}
          </div>
        )}

        {mainTab === 'bystatus' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            {byStatusData.length ? byStatusData.map((s, i) => {
              const c = getStatusBadgeColor(s.name);
              return (
                <div key={s.name} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20, border: `1px solid ${c.color}33` }}>
                  <div style={{ color: c.color, fontWeight: 600, marginBottom: 8 }}>{s.name}</div>
                  <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>{s.count}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{formatAmount(s.amount)} total</div>
                </div>
              );
            }) : (
              <div style={{ color: 'rgba(255,255,255,0.5)', padding: 24 }}>No data</div>
            )}
          </div>
        )}
      </div>

      {mainTab === 'transactions' && (
        <div className="admin-card">
          {error && (
            <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', marginBottom: 16 }}>{error}</div>
          )}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.7)' }}>Loading payments...</div>
          ) : filteredBySearch.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.7)' }}>No payments found</div>
          ) : (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  Showing {filteredBySearch.length} of {totalElements} payments
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Transaction ID</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>User</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Method</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Phone</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Created</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBySearch.map((payment) => {
                      const sc = getStatusBadgeColor(payment.status);
                      const tc = getTypeBadgeColor(payment.type);
                      return (
                        <tr
                          key={payment.id}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                          onClick={() => setDetailModal(payment)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: 12 }}>
                            <code style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem' }}>
                              {payment.transactionId || payment.id?.substring(0, 8) || 'N/A'}
                            </code>
                          </td>
                          <td style={{ padding: 12, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                            {payment.userId ? <span style={{ background: 'rgba(124,58,237,0.2)', color: '#7c3aed', padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem' }}>{String(payment.userId).substring(0, 8)}...</span> : 'N/A'}
                          </td>
                          <td style={{ padding: 12 }}>
                            <span style={{ background: tc.bg, color: tc.color, padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>{payment.type?.replace(/_/g, ' ') || 'N/A'}</span>
                          </td>
                          <td style={{ padding: 12, color: '#10b981', fontWeight: 600 }}>{formatAmount(payment.amount)}</td>
                          <td style={{ padding: 12 }}>
                            <span style={{ background: sc.bg, color: sc.color, padding: '4px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>{payment.status || 'N/A'}</span>
                          </td>
                          <td style={{ padding: 12, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{(payment.method || '').replace('_', ' ')}</td>
                          <td style={{ padding: 12, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{payment.paymentPhone || 'N/A'}</td>
                          <td style={{ padding: 12, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{formatDate(payment.createdAt)}</td>
                          <td style={{ padding: 12 }}>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setDetailModal(payment); }} className="admin-btn-ghost" style={{ padding: '6px 10px' }}>
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {mainTab === 'transactions' && totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Page {page + 1} of {totalPages} ({totalElements} total)</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="admin-btn-ghost">Previous</button>
                    <button type="button" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="admin-btn-ghost">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {detailModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setDetailModal(null)}
        >
          <div
            className="admin-card"
            style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailModal(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Payment Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Transaction ID</span>
                <code style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{detailModal.transactionId || detailModal.id || 'N/A'}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Amount</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{formatAmount(detailModal.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Type</span>
                <span style={{ color: getTypeBadgeColor(detailModal.type).color }}>{detailModal.type?.replace(/_/g, ' ') || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Status</span>
                <span style={{ color: getStatusBadgeColor(detailModal.status).color }}>{detailModal.status || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Method</span>
                <span style={{ color: '#fff' }}>{(detailModal.method || '').replace(/_/g, ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Phone</span>
                <span style={{ color: '#fff' }}>{detailModal.paymentPhone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>User ID</span>
                <span style={{ color: '#fff', fontSize: '0.85rem' }}>{detailModal.userId || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Created</span>
                <span style={{ color: '#fff' }}>{formatDate(detailModal.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Paid At</span>
                <span style={{ color: '#fff' }}>{formatDate(detailModal.paidAt) || '-'}</span>
              </div>
              {detailModal.description && (
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Description</span>
                  <span style={{ color: '#fff', fontSize: '0.9rem' }}>{detailModal.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
