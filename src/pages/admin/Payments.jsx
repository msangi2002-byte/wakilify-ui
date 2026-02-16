import { useState, useEffect, useCallback } from 'react';
import { CreditCard as CreditCardIcon, Search, Filter, Download, Calendar, User, DollarSign } from 'lucide-react';
import { getAdminPayments } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

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

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size,
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
    }
  }, [page, size, statusFilter, typeFilter, userIdFilter, startDate, endDate]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(0);
    loadPayments();
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setUserIdFilter('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'PENDING':
        return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' };
      case 'PROCESSING':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
      case 'FAILED':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      case 'CANCELLED':
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' };
      case 'REFUNDED':
        return { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' };
      default:
        return { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'AGENT_REGISTRATION':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
      case 'BUSINESS_ACTIVATION':
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'SUBSCRIPTION':
        return { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' };
      case 'PROMOTION':
        return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' };
      case 'ORDER':
        return { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899' };
      case 'AGENT_PACKAGE':
        return { bg: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9' };
      case 'COIN_PURCHASE':
        return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' };
      default:
        return { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0.00';
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPaymentMethod = (method) => {
    if (!method) return 'N/A';
    return method.replace('_', ' ');
  };

  // Calculate summary stats
  const totalAmount = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const successCount = payments.filter((p) => p.status === 'SUCCESS').length;
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
  const failedCount = payments.filter((p) => p.status === 'FAILED').length;

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Payments Monitoring
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Monitor all payment transactions from agents, users, and businesses
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
            color: '#7c3aed'
          }}>
            <CreditCardIcon size={28} />
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <DollarSign size={20} color="#10b981" />
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>Total Revenue</span>
            </div>
            <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 700 }}>
              {formatAmount(totalAmount)}
            </div>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '8px' }}>Successful</div>
            <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 700 }}>{successCount}</div>
          </div>
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '8px' }}>Pending</div>
            <div style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: 700 }}>{pendingCount}</div>
          </div>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '8px' }}>Failed</div>
            <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 700 }}>{failedCount}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(124, 58, 237, 0.2)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: '8px',
              color: '#7c3aed',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <Filter size={16} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <form onSubmit={handleFilter} style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '8px' }}>
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              >
                {PAYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '8px' }}>
                User ID
              </label>
              <input
                type="text"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                placeholder="Enter user ID"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '8px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '8px' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: 'rgba(124, 58, 237, 0.3)',
                  border: '1px solid rgba(124, 58, 237, 0.5)',
                  borderRadius: '8px',
                  color: '#7c3aed',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Clear
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Payments Table */}
      <div className="admin-card">
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            No payments found
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Transaction ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Method</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Created</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const statusColor = getStatusBadgeColor(payment.status);
                    const typeColor = getTypeBadgeColor(payment.type);
                    return (
                      <tr key={payment.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px', color: '#fff', fontSize: '0.875rem' }}>
                          <code style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                          }}>
                            {payment.transactionId || payment.id?.substring(0, 8) || 'N/A'}
                          </code>
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {payment.userId ? (
                            <span style={{
                              background: 'rgba(124, 58, 237, 0.2)',
                              color: '#7c3aed',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                            }}>
                              {payment.userId.substring(0, 8)}...
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: typeColor.bg,
                            color: typeColor.color,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}>
                            {payment.type?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
                          {formatAmount(payment.amount)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: statusColor.bg,
                            color: statusColor.color,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}>
                            {payment.status || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {formatPaymentMethod(payment.method)}
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {payment.paymentPhone || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {formatDate(payment.createdAt)}
                        </td>
                        <td style={{ padding: '12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} payments
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    style={{
                      padding: '8px 16px',
                      background: page === 0 ? 'rgba(107, 114, 128, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                      border: `1px solid ${page === 0 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(124, 58, 237, 0.3)'}`,
                      borderRadius: '8px',
                      color: page === 0 ? 'rgba(255, 255, 255, 0.3)' : '#7c3aed',
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Previous
                  </button>
                  <span style={{
                    padding: '8px 16px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.875rem',
                  }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    style={{
                      padding: '8px 16px',
                      background: page >= totalPages - 1 ? 'rgba(107, 114, 128, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                      border: `1px solid ${page >= totalPages - 1 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(124, 58, 237, 0.3)'}`,
                      borderRadius: '8px',
                      color: page >= totalPages - 1 ? 'rgba(255, 255, 255, 0.3)' : '#7c3aed',
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                    }}
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
