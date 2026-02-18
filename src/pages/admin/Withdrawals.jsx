import { useState, useEffect, useCallback } from 'react';
import {
  Wallet as WalletIcon,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  Phone,
  RefreshCw,
  Eye,
  Activity,
  List,
  X,
  User,
} from 'lucide-react';
import { getAdminWithdrawals, processWithdrawal } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';


export default function Withdrawals() {
  const [mainTab, setMainTab] = useState('overview');
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const loadWithdrawals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    setSuccess('');
    try {
      const params = { page, size };
      const response = await getAdminWithdrawals(params);
      setWithdrawals(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load withdrawals'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, size]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleProcess = async (withdrawalId, approve, transactionId = null) => {
    setProcessingId(withdrawalId);
    setError('');
    setSuccess('');
    try {
      await processWithdrawal(withdrawalId, approve, approve ? 'Processed' : 'Rejected', transactionId);
      setSuccess(approve ? 'Withdrawal approved' : 'Withdrawal rejected');
      setDetailModal(null);
      loadWithdrawals(true);
    } catch (err) {
      setError(getApiErrorMessage(err, approve ? 'Failed to approve' : 'Failed to reject'));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    const map = {
      PENDING: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' },
      COMPLETED: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
      PROCESSING: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
      REJECTED: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
      FAILED: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
    };
    return map[status] || { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
  };

  const formatAmount = (amount) => {
    if (amount == null) return '0';
    return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const filteredList = searchTerm
    ? withdrawals.filter(
        (w) =>
          (w.agent?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (w.agent?.agentCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(w.amount || '').includes(searchTerm) ||
          (w.paymentPhone || '').includes(searchTerm)
      )
    : withdrawals;

  const totalPendingAmount = withdrawals.reduce((s, w) => s + (parseFloat(w.amount) || 0), 0);
  const pendingCount = withdrawals.length;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'list', label: 'Withdrawals List', icon: List },
  ];

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>Withdrawals Control Center</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>Review, approve, or reject agent withdrawal requests</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => loadWithdrawals(true)}
              disabled={refreshing}
              className="admin-btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={18} className={refreshing ? 'admin-icon-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <WalletIcon size={28} />
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

        {error && (
          <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', marginBottom: 16 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22c55e', marginBottom: 16 }}>
            {success}
          </div>
        )}

        {mainTab === 'overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <WalletIcon size={20} color="#fbbf24" />
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Pending Requests</span>
                </div>
                <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 700 }}>{totalElements}</div>
              </div>
              <div style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <DollarSign size={20} color="#a78bfa" />
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Total Pending Amount</span>
                </div>
                <div style={{ color: '#a78bfa', fontSize: '1.5rem', fontWeight: 700 }}>{formatAmount(totalPendingAmount)}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 12, padding: 20 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: 8 }}>On this page</div>
                <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 700 }}>{withdrawals.length}</div>
              </div>
            </div>
            {withdrawals.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '1rem' }}>Latest pending</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {withdrawals.slice(0, 5).map((w) => (
                    <div
                      key={w.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                      onClick={() => setDetailModal(w)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 500 }}>{w.agent?.name || 'Unknown'}</div>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{w.agent?.agentCode || ''} · {w.paymentPhone || 'N/A'}</div>
                        </div>
                      </div>
                      <div style={{ color: '#10b981', fontWeight: 600 }}>{formatAmount(w.amount)}</div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setDetailModal(w); }} className="admin-btn-ghost" style={{ padding: '6px 12px' }}>
                        <Eye size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {mainTab === 'list' && (
          <>
            <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
                <input
                  type="text"
                  placeholder="Search by agent name, code, amount, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            </div>
          </>
        )}
      </div>

      {mainTab === 'list' && (
        <div className="admin-card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.7)' }}>Loading withdrawals...</div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.7)' }}>No withdrawals found</div>
          ) : (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  {searchTerm ? `Showing ${filteredList.length} of ${totalElements}` : `Total: ${totalElements} withdrawals`}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Agent</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Phone</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Requested</th>
                      <th style={{ padding: 12, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((withdrawal) => {
                      const statusStyle = getStatusBadgeColor(withdrawal.status);
                      return (
                        <tr
                          key={withdrawal.id}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                          onClick={() => setDetailModal(withdrawal)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: 16, color: '#fff', fontWeight: 500 }}>{withdrawal.agent?.name || 'Unknown Agent'}</td>
                          <td style={{ padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600 }}>
                              <DollarSign size={16} />
                              {formatAmount(withdrawal.amount)}
                            </div>
                          </td>
                          <td style={{ padding: 16, color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Phone size={14} />
                              {withdrawal.paymentPhone || withdrawal.phone || 'N/A'}
                            </span>
                          </td>
                          <td style={{ padding: 16 }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                              {withdrawal.status || 'UNKNOWN'}
                            </span>
                          </td>
                          <td style={{ padding: 16, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{formatDate(withdrawal.createdAt)}</td>
                          <td style={{ padding: 16, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            {withdrawal.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleProcess(withdrawal.id, true)}
                                  disabled={processingId === withdrawal.id}
                                  className="admin-btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <CheckCircle size={14} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleProcess(withdrawal.id, false)}
                                  disabled={processingId === withdrawal.id}
                                  className="admin-btn-ghost"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <XCircle size={14} />
                                  Reject
                                </button>
                              </div>
                            )}
                            {(withdrawal.status === 'COMPLETED' || withdrawal.status === 'REJECTED' || withdrawal.status === 'PROCESSING' || withdrawal.status === 'FAILED') && (
                              <button type="button" onClick={() => setDetailModal(withdrawal)} className="admin-btn-ghost" style={{ padding: '6px 10px' }}>
                                <Eye size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && !searchTerm && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Page {page + 1} of {totalPages}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="admin-btn-ghost">Previous</button>
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="admin-btn-ghost">Next</button>
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
            style={{ maxWidth: 440, width: '100%', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailModal(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Withdrawal Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Agent</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{detailModal.agent?.name || 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Agent Code</span>
                <span style={{ color: '#a78bfa' }}>{detailModal.agent?.agentCode || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Amount</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{formatAmount(detailModal.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Status</span>
                <span style={{ color: getStatusBadgeColor(detailModal.status).color }}>{detailModal.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Payment Method</span>
                <span style={{ color: '#fff' }}>{(detailModal.paymentMethod || '').replace(/_/g, ' ') || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Phone</span>
                <span style={{ color: '#fff' }}>{detailModal.paymentPhone || detailModal.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Name on account</span>
                <span style={{ color: '#fff' }}>{detailModal.paymentName || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Requested</span>
                <span style={{ color: '#fff' }}>{formatDate(detailModal.createdAt)}</span>
              </div>
              {detailModal.processedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Processed</span>
                  <span style={{ color: '#fff' }}>{formatDate(detailModal.processedAt)}</span>
                </div>
              )}
              {detailModal.transactionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Transaction ID</span>
                  <code style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{detailModal.transactionId}</code>
                </div>
              )}
              {detailModal.rejectionReason && (
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Rejection reason</span>
                  <span style={{ color: '#f87171' }}>{detailModal.rejectionReason}</span>
                </div>
              )}
            </div>
            {detailModal.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => handleProcess(detailModal.id, true)}
                  disabled={processingId === detailModal.id}
                  className="admin-btn-primary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <CheckCircle size={18} />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleProcess(detailModal.id, false)}
                  disabled={processingId === detailModal.id}
                  className="admin-btn-ghost"
                  style={{ flex: 1, color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <XCircle size={18} />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
