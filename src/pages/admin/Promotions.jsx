import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone as MegaphoneIcon,
  TrendingUp,
  Eye,
  MousePointer,
  Target,
  Pause,
  Play,
  XCircle,
  Filter,
  User,
  Zap,
  CheckCircle,
} from 'lucide-react';
import {
  getAdminPromotions,
  getAdminPromotionsStats,
  adminPausePromotion,
  adminResumePromotion,
  adminApprovePromotion,
  adminRejectPromotion,
} from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { showAdminToast } from '@/lib/adminToast';

const OBJECTIVE_LABELS = {
  AWARENESS: 'Awareness',
  TRAFFIC: 'Traffic',
  ENGAGEMENT: 'Engagement',
  MESSAGES: 'Messages',
  LEADS: 'Leads',
  CONVERSIONS: 'Conversions',
};

const TYPE_LABELS = {
  POST: 'Post',
  PRODUCT: 'Product',
  BUSINESS: 'Business',
};

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
    PENDING: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
    PENDING_APPROVAL: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
    PAUSED: { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' },
    COMPLETED: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
    CANCELLED: { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' },
    REJECTED: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
  };
  const s = styles[status] || styles.PENDING;
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: s.bg,
        color: s.color,
      }}
    >
      {status}
    </span>
  );
}

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size: 20,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      };
      const res = await getAdminPromotions(params);
      setPromotions(res?.content || []);
      setTotalPages(res?.totalPages || 0);
      setTotalElements(res?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load promotions'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const s = await getAdminPromotionsStats();
      setStats(s);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handlePause = async (id) => {
    try {
      await adminPausePromotion(id);
      showAdminToast('Promotion paused', 'success');
      loadPromotions();
      loadStats();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to pause'));
    }
  };

  const handleResume = async (id) => {
    try {
      await adminResumePromotion(id);
      showAdminToast('Promotion resumed', 'success');
      loadPromotions();
      loadStats();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resume'));
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminApprovePromotion(id);
      showAdminToast('Promotion approved', 'success');
      loadPromotions();
      loadStats();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to approve'));
    }
  };

  const handleReject = async (id, reason = '') => {
    if (!window.confirm('Reject this promotion? User will be notified.')) return;
    try {
      await adminRejectPromotion(id, reason);
      showAdminToast('Promotion rejected', 'success');
      loadPromotions();
      loadStats();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reject'));
    }
  };

  const formatAmount = (v) => {
    if (v == null) return '—';
    return `TZS ${Number(v).toLocaleString()}`;
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
  const formatPct = (n) => (n != null ? `${Number(n).toFixed(2)}%` : '—');

  return (
    <div className="admin-promotions-page">
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Promotions & Ads
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Meta-style logic: Campaign → Ad Set → Ad. Objectives, targeting, auction, learning phase.
            </p>
          </div>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(124, 58, 237, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
            }}
          >
            <MegaphoneIcon size={28} />
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {!statsLoading && stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Total', value: stats.total, icon: MegaphoneIcon },
            { label: 'Active', value: stats.active, icon: Zap, color: '#10b981' },
            { label: 'Pending', value: stats.pending, icon: Target, color: '#fbbf24' },
            { label: 'Awaiting approval', value: stats.pendingApproval ?? 0, icon: CheckCircle, color: '#f59e0b' },
            { label: 'Paused', value: stats.paused, icon: Pause, color: '#6b7280' },
            { label: 'Completed', value: stats.completed, icon: TrendingUp, color: '#3b82f6' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="admin-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: color ? `${color}22` : 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color || '#7c3aed' }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{value ?? 0}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Filter size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
          <select
            className="admin-input"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            style={{ width: 'auto', minWidth: 130 }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            className="admin-input"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            style={{ width: 'auto', minWidth: 120 }}
          >
            <option value="">All types</option>
            <option value="POST">Post</option>
            <option value="PRODUCT">Product</option>
            <option value="BUSINESS">Business</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#ef4444', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="admin-card">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff' }}>All Promotions</h3>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Loading...</div>
        ) : promotions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            No promotions found. Users create promotions from the app to boost posts, products & businesses.
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Objective</th>
                    <th>Status</th>
                    <th>Budget / Spent</th>
                    <th><Eye size={14} /> Imp</th>
                    <th><MousePointer size={14} /> Clicks</th>
                    <th>CTR</th>
                    <th>Learning</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div>
                          <strong style={{ color: '#f8fafc' }}>{p.title}</strong>
                          {p.description && (
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        {p.userName && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} />
                            {p.userName}
                          </span>
                        )}
                      </td>
                      <td>{TYPE_LABELS[p.type] || p.type}</td>
                      <td>{p.objective ? OBJECTIVE_LABELS[p.objective] || p.objective : '—'}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <div>{formatAmount(p.budget)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Spent: {formatAmount(p.spentAmount)}</div>
                      </td>
                      <td>{p.impressions?.toLocaleString() ?? '—'}</td>
                      <td>{p.clicks?.toLocaleString() ?? '—'}</td>
                      <td>{formatPct(p.ctr)}</td>
                      <td>
                        {p.isInLearningPhase ? (
                          <span style={{ color: '#fbbf24', fontSize: '0.8rem' }}>
                            <Zap size={12} /> {(p.learningPhaseConversions || 0)}/50
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {p.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              type="button"
                              className="admin-btn-ghost"
                              style={{ padding: '6px 10px', fontSize: '0.8rem', marginRight: 4, color: '#10b981' }}
                              onClick={() => handleApprove(p.id)}
                              title="Approve (policy check passed)"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                          </>
                        )}
                        {p.status === 'ACTIVE' && (
                          <button
                            type="button"
                            className="admin-btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', marginRight: 4 }}
                            onClick={() => handlePause(p.id)}
                            title="Pause"
                          >
                            <Pause size={14} /> Pause
                          </button>
                        )}
                        {p.status === 'PAUSED' && (
                          <button
                            type="button"
                            className="admin-btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', marginRight: 4 }}
                            onClick={() => handleResume(p.id)}
                            title="Resume"
                          >
                            <Play size={14} /> Resume
                          </button>
                        )}
                        {(p.status === 'PENDING' || p.status === 'PENDING_APPROVAL' || p.status === 'ACTIVE') && (
                          <button
                            type="button"
                            className="admin-btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--admin-error)' }}
                            onClick={() => handleReject(p.id)}
                            title="Reject"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                  Page {page + 1} of {totalPages} • {totalElements} total
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="admin-btn-ghost"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="admin-btn-ghost"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
