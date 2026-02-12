import { useState, useEffect } from 'react';
import { Building2, CheckCircle2, Clock, RefreshCw, AlertCircle, XCircle, ShieldCheck } from 'lucide-react';
import { getAgentBusinesses, approveBusinessRequest, cancelBusinessRequest } from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/agent.css';

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

export default function Activate() {
  const [businesses, setBusinesses] = useState({ content: [] });
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoadingBusinesses(true);
    setError('');
    try {
      const data = await getAgentBusinesses({ page: 0, size: 50 });
      setBusinesses(Array.isArray(data?.content) ? { content: data.content } : { content: [] });
    } catch (err) {
      console.error('Failed to load businesses:', err);
      setError(getApiErrorMessage(err, 'Failed to load business requests'));
      setBusinesses({ content: [] });
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const handleVerify = async (businessId) => {
    if (!confirm('Are you sure you want to verify/approve this business activation? This will activate the business.')) {
      return;
    }
    setApprovingId(businessId);
    setError('');
    setSuccess('');
    try {
      await approveBusinessRequest(businessId);
      setSuccess('Business verified and approved successfully!');
      await loadBusinesses();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to verify business'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setApprovingId(null);
    }
  };

  const handleCancel = async (businessId) => {
    const reason = prompt('Please provide a reason for cancelling this business activation:');
    if (!reason || !reason.trim()) {
      return;
    }
    if (!confirm('Are you sure you want to cancel this business activation? This action cannot be undone.')) {
      return;
    }
    setCancellingId(businessId);
    setError('');
    setSuccess('');
    try {
      await cancelBusinessRequest(businessId);
      setSuccess('Business activation cancelled successfully.');
      await loadBusinesses();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, 'Failed to cancel business activation');
      setError(errorMsg + ' The cancel endpoint may not be available in the backend yet.');
      setTimeout(() => setError(''), 8000);
    } finally {
      setCancellingId(null);
    }
  };

  // Filter businesses that are pending (not paid or not approved)
  const pendingBusinesses = businesses.content?.filter((b) => {
    const status = b.status?.toUpperCase();
    return status === 'PENDING' || 
           status === 'PAYMENT_PENDING' || 
           status === 'AWAITING_PAYMENT' ||
           (status !== 'APPROVED' && status !== 'ACTIVE' && status !== 'COMPLETED' && status !== 'CANCELLED' && status !== 'REJECTED');
  }) || [];

  // Check if business can be cancelled (only pending businesses that haven't been paid)
  const canCancelBusiness = (business) => {
    const status = business.status?.toUpperCase();
    const paymentStatus = business.paymentStatus?.toUpperCase();
    return (status === 'PENDING' || status === 'PAYMENT_PENDING') && 
           paymentStatus !== 'SUCCESS' && 
           paymentStatus !== 'PAID' && 
           paymentStatus !== 'COMPLETED';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="agent-activate-title" style={{ margin: 0 }}>
          <Building2 size={28} />
          Activate Business
        </h1>
        <button
          type="button"
          className="agent-btn-ghost"
          onClick={loadBusinesses}
          disabled={loadingBusinesses}
        >
          <RefreshCw size={18} style={{ marginRight: '6px', animation: loadingBusinesses ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="agent-card" style={{ marginBottom: '24px', background: 'rgba(240, 144, 104, 0.1)', borderColor: '#F09068' }}>
          <p className="agent-activate-message agent-activate-message--error" role="alert" style={{ margin: 0 }}>
            <AlertCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="agent-card" style={{ marginBottom: '24px', background: 'rgba(56, 176, 104, 0.1)', borderColor: '#38B068' }}>
          <p className="agent-activate-message agent-activate-message--success" role="status" style={{ margin: 0 }}>
            <CheckCircle2 size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {success}
          </p>
        </div>
      )}

      {/* Pending Business Requests List */}
      <div className="agent-card">
        <div className="agent-card-title">
          Pending Business Activations ({pendingBusinesses.length})
        </div>
        <p className="agent-stat-label" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
          Review and verify or cancel business activation requests. You can verify businesses that are waiting for payment or have completed payment.
        </p>

        {loadingBusinesses ? (
          <div className="agent-loading">Loading businesses...</div>
        ) : pendingBusinesses.length === 0 ? (
          <div className="agent-empty">No pending business activations.</div>
        ) : (
          <ul className="agent-requests-list">
            {pendingBusinesses.map((business) => {
              const status = business.status?.toUpperCase() || 'PENDING';
              const isPending = status === 'PENDING' || status === 'PAYMENT_PENDING' || status === 'AWAITING_PAYMENT';
              const isPaid = business.paymentStatus === 'SUCCESS' || business.paymentStatus === 'PAID' || business.paymentStatus === 'COMPLETED';
              const canVerify = status !== 'APPROVED' && status !== 'ACTIVE' && status !== 'COMPLETED';
              const canCancel = canCancelBusiness(business);

              return (
                <li key={business.id} className="agent-request-card">
                  <div className="agent-request-header">
                    <Building2 className="agent-request-icon" size={20} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="agent-request-name">{business.name || 'Unnamed Business'}</div>
                      {business.ownerName && (
                        <div className="agent-request-meta">Owner: {business.ownerName}</div>
                      )}
                      {business.ownerPhone && (
                        <div className="agent-request-meta">Phone: {business.ownerPhone}</div>
                      )}
                    </div>
                    <span
                      className={`agent-request-status ${
                        status === 'APPROVED' || status === 'ACTIVE'
                          ? 'agent-request-status-approved'
                          : isPaid
                          ? 'agent-request-status-converted'
                          : 'agent-request-status-pending'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="agent-request-details">
                    {business.category && (
                      <div className="agent-request-row">
                        <strong>Category:</strong> {business.category}
                      </div>
                    )}
                    {business.region && (
                      <div className="agent-request-row">
                        <strong>Region:</strong> {business.region}
                        {business.district && `, ${business.district}`}
                      </div>
                    )}
                    {business.createdAt && (
                      <div className="agent-request-row">
                        <strong>Created:</strong> {formatDate(business.createdAt)}
                      </div>
                    )}
                    {business.paymentStatus && (
                      <div className="agent-request-row">
                        <strong>Payment:</strong>{' '}
                        <span
                          className={
                            business.paymentStatus === 'SUCCESS' || business.paymentStatus === 'PAID' || business.paymentStatus === 'COMPLETED'
                              ? 'status-success'
                              : business.paymentStatus === 'PENDING'
                              ? 'status-pending'
                              : 'status-error'
                          }
                        >
                          {business.paymentStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="agent-request-footer">
                    <div className="agent-request-date">
                      {isPending && !isPaid && (
                        <span style={{ color: '#F09068' }}>
                          <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          Waiting for payment
                        </span>
                      )}
                      {isPaid && (
                        <span style={{ color: '#38B068' }}>
                          <CheckCircle2 size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          Payment confirmed
                        </span>
                      )}
                      {!isPaid && !isPending && (
                        <span style={{ color: '#6b7280' }}>
                          <AlertCircle size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          Awaiting activation
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {canVerify && (
                        <button
                          type="button"
                          className="agent-btn-verify"
                          onClick={() => handleVerify(business.id)}
                          disabled={approvingId === business.id || cancellingId === business.id}
                        >
                          {approvingId === business.id ? (
                            <>
                              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={18} />
                              Verify
                            </>
                          )}
                        </button>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          className="agent-btn-cancel"
                          onClick={() => handleCancel(business.id)}
                          disabled={approvingId === business.id || cancellingId === business.id}
                        >
                          {cancellingId === business.id ? (
                            <>
                              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle size={18} />
                              Cancel
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
