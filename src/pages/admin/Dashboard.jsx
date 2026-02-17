import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ShoppingBag,
  DollarSign,
  UserCheck,
  AlertTriangle,
  Wallet,
  Package,
  Megaphone,
  Image,
  Video,
  FileText,
  Activity,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAdminDashboard, getAdminChartData, getMediaStats, getTransactionReports, getAnalytics, getAdminAuditLogs } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

function formatNumber(n) {
  if (n == null) return '0';
  return new Intl.NumberFormat('en-TZ').format(n);
}

function formatCurrency(n) {
  if (n == null) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRelativeTime(ms) {
  if (ms < 60000) return 'Just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)} min ago`;
  return `${Math.floor(ms / 3600000)} hr ago`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [mediaStats, setMediaStats] = useState(null);
  const [transactionReports, setTransactionReports] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false, abortRef = { current: false }) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const [dash, charts, media, txn, anl, auditRes] = await Promise.all([
        getAdminDashboard(),
        getAdminChartData(30).catch(() => null),
        getMediaStats().catch(() => null),
        getTransactionReports().catch(() => null),
        getAnalytics().catch(() => null),
        getAdminAuditLogs({ page: 0, size: 8 }).catch(() => ({ content: [] })),
      ]);
      if (abortRef.current) return;
      setData(dash);
      setChartData(charts);
      setMediaStats(media);
      setTransactionReports(txn);
      setAnalytics(anl);
      setLastUpdated(Date.now());
      setRecentActivity(auditRes?.content || []);
    } catch (err) {
      if (!abortRef.current) setError(getApiErrorMessage(err, 'Failed to load dashboard'));
    } finally {
      if (!abortRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const abortRef = { current: false };
    fetchData(false, abortRef);
    return () => { abortRef.current = true; };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-skeleton" style={{ height: 28, width: 220, marginBottom: 8 }} />
          <div className="admin-skeleton" style={{ height: 18, width: 320 }} />
        </div>
        <div className="admin-grid admin-grid-4" style={{ marginBottom: '24px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="admin-card">
              <div className="admin-skeleton" style={{ height: 40, width: 40, borderRadius: 10, marginBottom: 16 }} />
              <div className="admin-skeleton" style={{ height: 32, width: '80%', marginBottom: 8 }} />
              <div className="admin-skeleton" style={{ height: 16, width: '60%' }} />
            </div>
          ))}
        </div>
        <div className="admin-grid admin-grid-2">
          <div className="admin-card">
            <div className="admin-skeleton" style={{ height: 24, width: 140, marginBottom: 16 }} />
            <div className="admin-skeleton" style={{ height: 56, marginBottom: 12 }} />
            <div className="admin-skeleton" style={{ height: 56 }} />
          </div>
          <div className="admin-card">
            <div className="admin-skeleton" style={{ height: 24, width: 120, marginBottom: 16 }} />
            <div className="admin-skeleton" style={{ height: 44, marginBottom: 12 }} />
            <div className="admin-skeleton" style={{ height: 44, marginBottom: 12 }} />
            <div className="admin-skeleton" style={{ height: 44 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{
        padding: '24px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        color: '#ef4444',
      }}>
        {error}
      </div>
    );
  }

  const d = data || {};
  const stats = [
    { label: 'Total Users', value: formatNumber(d.totalUsers), icon: Users, color: 'primary', sub: d.newUsersToday != null ? `${formatNumber(d.newUsersToday)} today` : null },
    { label: 'Businesses', value: formatNumber(d.totalBusinesses), icon: Building2, color: 'secondary', sub: d.pendingBusinesses != null ? `${formatNumber(d.pendingBusinesses)} pending` : null },
    { label: 'Agents', value: formatNumber(d.totalAgents), icon: UserCheck, color: 'info', sub: d.pendingAgents != null ? `${formatNumber(d.pendingAgents)} pending` : null },
    { label: 'Orders', value: formatNumber(d.totalOrders), icon: ShoppingBag, color: 'success', sub: d.completedOrders != null ? `${formatNumber(d.completedOrders)} completed` : null },
    { label: 'Revenue', value: formatCurrency(d.totalRevenue), icon: DollarSign, color: 'success', sub: d.revenueThisMonth != null ? `${formatCurrency(d.revenueThisMonth)} this month` : null },
  ];

  const pendingReports = d.pendingReports ?? 0;
  const pendingWithdrawals = d.pendingWithdrawals ?? 0;

  return (
    <div className="admin-dashboard">
      <header className="admin-command-hero">
        <div>
          <h1 className="admin-command-title">Command Center</h1>
          <p className="admin-command-subtitle">
            Monitor and control platform-wide activity, revenue, and operations at scale.
          </p>
        </div>
        <div className="admin-command-meta">
          {lastUpdated != null && (
            <span className="admin-command-updated" title="Data refresh time">
              Updated {formatRelativeTime(Date.now() - lastUpdated)}
            </span>
          )}
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => fetchData(true, { current: false })}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw size={16} className={refreshing ? 'admin-icon-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <span className="admin-command-kbd" title="Quick search">⌘K to search</span>
        </div>
      </header>

      <div className="admin-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="admin-stat-card">
              <div className="admin-stat-card-icon">
                <Icon size={22} />
              </div>
              <div className="admin-stat-card-body">
                <div className={`admin-stat-value ${stat.color}`}>{stat.value}</div>
                <div className="admin-stat-label">{stat.label}</div>
                {stat.sub && <div className="admin-stat-sub">{stat.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-grid admin-grid-2">
        <div className="admin-card">
          <h2 className="admin-card-title">Pending Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingReports > 0 && (
              <Link
                to="/admin/reports?status=PENDING"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  textDecoration: 'none',
                  color: '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertTriangle size={24} color="#fbbf24" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{pendingReports} Reports</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Awaiting review</div>
                  </div>
                </div>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Review →</span>
              </Link>
            )}
            <Link
              to="/admin/reports?type=POST&status=PENDING"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'rgba(124, 58, 237, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                textDecoration: 'none',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={24} color="#7c3aed" />
                <div>
                  <div style={{ fontWeight: 600 }}>Moderation Queue</div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Reported posts</div>
                </div>
              </div>
              <span style={{ color: '#7c3aed', fontWeight: 600 }}>Review →</span>
            </Link>
            {pendingWithdrawals > 0 && (
              <Link
                to="/admin/withdrawals"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                  textDecoration: 'none',
                  color: '#fff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Wallet size={24} color="#fbbf24" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{pendingWithdrawals} Withdrawals</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Pending approval</div>
                  </div>
                </div>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>Process →</span>
              </Link>
            )}
            {pendingReports === 0 && pendingWithdrawals === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', padding: '16px' }}>
                No pending actions
              </div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="admin-card-title">Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/admin/users" className="admin-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              <Users size={18} />
              View All Users
            </Link>
            <Link to="/admin/businesses" className="admin-btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              <Building2 size={18} />
              Manage Businesses
            </Link>
            <Link to="/admin/agents" className="admin-btn-ghost" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              <UserCheck size={18} />
              Manage Agents
            </Link>
            <Link to="/admin/payments" className="admin-btn-ghost" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              <DollarSign size={18} />
              Payments
            </Link>
            <Link to="/admin/map" className="admin-btn-ghost" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              Map View
            </Link>
            <Link to="/admin/settings" className="admin-btn-ghost" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
              System Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 className="admin-card-title" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
            <Activity size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Recent Activity
          </h2>
          <Link to="/admin/audit-logs" className="admin-activity-view-all">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', margin: 0 }}>No recent activity</p>
        ) : (
          <ul className="admin-activity-list">
            {recentActivity.map((log) => (
              <li key={log.id} className="admin-activity-item">
                <span className="admin-activity-action">{log.action || 'Action'}</span>
                {log.entityType && <span className="admin-activity-entity">{log.entityType}</span>}
                {log.user?.name && <span className="admin-activity-user">{log.user.name}</span>}
                <span className="admin-activity-time">
                  {log.createdAt ? formatRelativeTime(Date.now() - new Date(log.createdAt).getTime()) : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {chartData && (chartData.revenueByDay?.length > 0 || chartData.usersByDay?.length > 0) && (
        <div className="admin-grid admin-grid-2" style={{ marginTop: '32px' }}>
          {chartData.revenueByDay?.length > 0 && (
            <div className="admin-card">
              <h2 className="admin-card-title">Revenue (Last 30 Days)</h2>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.revenueByDay}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={11} tickFormatter={(v) => v?.slice(5) || v} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickFormatter={(v) => v >= 1000 ? (v / 1000) + 'k' : v} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="value" stroke="#7c3aed" fillOpacity={1} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {chartData.usersByDay?.length > 0 && (
            <div className="admin-card">
              <h2 className="admin-card-title">New Users (Last 30 Days)</h2>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.usersByDay}>
                    <defs>
                      <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={11} tickFormatter={(v) => v?.slice(5) || v} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="count" stroke="#22c55e" fillOpacity={1} fill="url(#usersGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {(analytics || transactionReports || mediaStats) && (
        <div className="admin-grid admin-grid-3" style={{ marginTop: '32px' }}>
          {analytics && (
            <div className="admin-card">
              <h2 className="admin-card-title">Analytics</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(124,58,237,0.1)', borderRadius: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Daily Active Users</span>
                  <span style={{ fontWeight: 700, color: '#7c3aed' }}>{formatNumber(analytics.dailyActiveUsers)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(124,58,237,0.1)', borderRadius: '8px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>Monthly Active Users</span>
                  <span style={{ fontWeight: 700, color: '#7c3aed' }}>{formatNumber(analytics.monthlyActiveUsers)}</span>
                </div>
              </div>
            </div>
          )}
          {transactionReports && (
            <div className="admin-card">
              <h2 className="admin-card-title">Transaction Reports</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>Today</span>
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>{formatCurrency(transactionReports.dailyRevenue)} ({formatNumber(transactionReports.dailyTransactionCount)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>This Week</span>
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>{formatCurrency(transactionReports.weeklyRevenue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>This Month</span>
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>{formatCurrency(transactionReports.monthlyRevenue)}</span>
                </div>
              </div>
            </div>
          )}
          {mediaStats && (
            <div className="admin-card">
              <h2 className="admin-card-title">Media Stats</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(124,58,237,0.1)', borderRadius: '8px' }}>
                  <Image size={24} color="#7c3aed" />
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>Images</div>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{formatNumber(mediaStats.totalImages)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(124,58,237,0.1)', borderRadius: '8px' }}>
                  <Video size={24} color="#d946ef" />
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>Videos</div>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{formatNumber(mediaStats.totalVideos)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {(d.usersByRole || d.ordersByStatus) && (
        <div className="admin-grid admin-grid-2" style={{ marginTop: '32px' }}>
          {d.usersByRole && Object.keys(d.usersByRole).length > 0 && (
            <div className="admin-card">
              <h2 className="admin-card-title">Users by Role</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(d.usersByRole).map(([role, count]) => (
                  <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{role}</span>
                    <span style={{ fontWeight: 600, color: '#7c3aed' }}>{formatNumber(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {d.ordersByStatus && Object.keys(d.ordersByStatus).length > 0 && (
            <div className="admin-card">
              <h2 className="admin-card-title">Orders by Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(d.ordersByStatus).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>{status}</span>
                    <span style={{ fontWeight: 600, color: '#7c3aed' }}>{formatNumber(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
