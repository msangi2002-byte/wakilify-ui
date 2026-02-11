import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Banknote,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Inbox,
} from 'lucide-react';
import {
  getAgentDashboard,
  getAgentCommissions,
  getAgentWithdrawals,
} from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/agent.css';

function formatAmount(n) {
  if (n == null || n === undefined) return '0';
  const num = typeof n === 'number' ? n : parseFloat(n);
  if (Number.isNaN(num)) return '0';
  return new Intl.NumberFormat('en-TZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [commissions, setCommissions] = useState({ content: [] });
  const [withdrawals, setWithdrawals] = useState({ content: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      getAgentDashboard(),
      getAgentCommissions({ page: 0, size: 10 }).then((r) => r || { content: [] }).catch(() => ({ content: [] })),
      getAgentWithdrawals({ page: 0, size: 10 }).then((r) => r || { content: [] }).catch(() => ({ content: [] })),
    ])
      .then(([dash, comm, wdraw]) => {
        if (cancelled) return;
        setDashboard(dash ?? null);
        setCommissions(Array.isArray(comm?.content) ? comm : { content: [] });
        setWithdrawals(Array.isArray(wdraw?.content) ? wdraw : { content: [] });
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load dashboard'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const activityItems = useMemo(() => {
    const items = [];
    const commList = Array.isArray(commissions.content) ? commissions.content : [];
    const wdrawList = Array.isArray(withdrawals.content) ? withdrawals.content : [];
    commList.forEach((c) => {
      items.push({
        id: `comm-${c.id}`,
        type: 'commission',
        title: 'Commission recorded',
        description: c.description || `Commission: ${formatAmount(c.amount)}`,
        amount: c.amount,
        status: c.status,
        createdAt: c.createdAt,
        icon: 'commission',
        statusClass: (c.status || '').toUpperCase() === 'PAID' ? 'success' : 'pending',
      });
    });
    wdrawList.forEach((w) => {
      const status = (w.status || '').toUpperCase();
      items.push({
        id: `wdraw-${w.id}`,
        type: 'withdrawal',
        title: status === 'SUCCESS' || status === 'COMPLETED' ? 'Paid out (Success)' : status === 'PENDING' ? 'Withdrawal pending' : 'Withdrawal',
        description: `Withdrawal ${formatAmount(w.amount)}`,
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt,
        icon: status === 'SUCCESS' || status === 'COMPLETED' ? 'payout' : 'warning',
        statusClass: status === 'SUCCESS' || status === 'COMPLETED' ? 'success' : status === 'PENDING' ? 'warning' : 'pending',
      });
    });
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return items.slice(0, 15);
  }, [commissions.content, withdrawals.content]);

  if (loading && !dashboard) {
    return (
      <div className="agent-loading">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="agent-dashboard">
      <h1 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700 }}>
        Agent Overview
      </h1>
      {error && (
        <div className="agent-card" style={{ marginBottom: 20, borderColor: '#F09068' }}>
          <p style={{ color: '#F09068', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Overview stats */}
      <div className="agent-grid agent-grid-2" style={{ marginBottom: 24 }}>
        <div className="agent-card">
          <div className="agent-stat-value gold">
            {dashboard?.currentBalance != null ? `TZS ${formatAmount(dashboard.currentBalance)}` : '—'}
          </div>
          <div className="agent-stat-label">Available balance</div>
        </div>
        <div className="agent-card">
          <div className="agent-stat-value gold">
            {dashboard?.totalEarnings != null ? `TZS ${formatAmount(dashboard.totalEarnings)}` : '—'}
          </div>
          <div className="agent-stat-label">Total commission earned</div>
        </div>
        <div className="agent-card">
          <div className="agent-stat-value">
            {dashboard?.totalBusinessesActivated ?? 0}
          </div>
          <div className="agent-stat-label">Active businesses</div>
        </div>
        <div className="agent-card">
          <div className="agent-stat-value warning">
            {dashboard?.pendingWithdrawals != null ? `TZS ${formatAmount(dashboard.pendingWithdrawals)}` : '—'}
          </div>
          <div className="agent-stat-label">Pending withdrawals</div>
        </div>
      </div>

      <div className="agent-dashboard-two-col">
        {/* Recent activity */}
        <div className="agent-card">
          <h2 className="agent-card-title">Recent Activity</h2>
          {activityItems.length === 0 ? (
            <p className="agent-empty">No recent activity yet.</p>
          ) : (
            <ul className="agent-activity-list">
              {activityItems.map((item) => (
                <li key={item.id} className="agent-activity-item">
                  <div className={`agent-activity-icon ${item.icon}`}>
                    {item.type === 'commission' ? (
                      <Banknote size={18} />
                    ) : item.statusClass === 'success' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>
                  <div className="agent-activity-text">
                    {item.title}
                    {item.description && (
                      <div className="agent-activity-meta">
                        {item.description}
                        {item.amount != null && (
                          <span className="amount-gold" style={{ marginLeft: 8 }}>
                            TZS {formatAmount(item.amount)}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="agent-activity-meta">{formatDate(item.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Business management & quick actions */}
        <div className="agent-card">
          <h2 className="agent-card-title">Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/agent/requests" className="agent-btn-secondary">
              <Inbox size={20} />
              View business requests
            </Link>
            <Link to="/agent/activate" className="agent-btn-primary">
              <Building2 size={20} />
              Activate Business
            </Link>
            <Link to="/agent/commissions" className="agent-btn-ghost">
              <TrendingUp size={20} />
              View Commissions
            </Link>
            <Link to="/agent/withdrawals" className="agent-btn-ghost">
              <Wallet size={20} />
              Request Withdrawal
            </Link>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #6245A1' }}>
            <div className="agent-stat-value" style={{ fontSize: '1.25rem' }}>
              {dashboard?.totalBusinessesActivated ?? 0} businesses
            </div>
            <div className="agent-stat-label">Under your management</div>
          </div>
        </div>
      </div>
    </div>
  );
}
