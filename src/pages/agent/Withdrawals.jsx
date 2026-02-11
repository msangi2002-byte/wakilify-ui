import { useState, useEffect } from 'react';
import { getAgentWithdrawals, requestWithdrawal, cancelWithdrawal } from '@/lib/api/agent';
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
    return new Date(iso).toLocaleDateString(undefined, {
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

function statusClass(status) {
  const s = (status || '').toUpperCase();
  if (s === 'SUCCESS' || s === 'COMPLETED') return 'status-success';
  if (s === 'PENDING') return 'status-pending';
  if (s === 'REJECTED' || s === 'CANCELLED') return 'status-warning';
  return 'status-pending';
}

export default function Withdrawals() {
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [page, setPage] = useState(0);
  const size = 20;

  const loadList = () => {
    setLoading(true);
    getAgentWithdrawals({ page, size })
      .then((res) => {
        const content = Array.isArray(res?.content) ? res.content : [];
        setData({
          content,
          totalElements: res?.totalElements ?? content.length,
        });
      })
      .catch(() => setData({ content: [], totalElements: 0 }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, [page]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) {
      setSubmitError('Enter a valid amount.');
      return;
    }
    if (!phone.trim()) {
      setSubmitError('Phone number is required.');
      return;
    }
    setSubmitLoading(true);
    try {
      await requestWithdrawal({ amount: num, phone: phone.trim() });
      setSubmitSuccess('Withdrawal request submitted.');
      setAmount('');
      setPhone('');
      loadList();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Request failed'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this withdrawal request?')) return;
    try {
      await cancelWithdrawal(id);
      loadList();
    } catch (_) {}
  };

  const list = data.content;
  const totalPages = Math.ceil((data.totalElements || 0) / size);

  return (
    <div className="agent-withdrawals">
      <h1 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700 }}>
        Withdrawals
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
        Request a payout to your phone. Withdrawals are subject to minimum amount and verification.
      </p>

      <div className="agent-card" style={{ maxWidth: 400, marginBottom: 24 }}>
        <h2 className="agent-card-title">Request withdrawal</h2>
        <form onSubmit={handleRequest}>
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="wd-amount">
              Amount (TZS) *
            </label>
            <input
              id="wd-amount"
              type="number"
              min="1"
              step="1"
              className="agent-input"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="agent-label" htmlFor="wd-phone">
              Phone *
            </label>
            <input
              id="wd-phone"
              type="tel"
              className="agent-input"
              placeholder="+255712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {submitError && (
            <p style={{ color: '#F09068', marginBottom: 8, fontSize: '0.9rem' }}>{submitError}</p>
          )}
          {submitSuccess && (
            <p style={{ color: '#38B068', marginBottom: 8, fontSize: '0.9rem' }}>{submitSuccess}</p>
          )}
          <button
            type="submit"
            className="agent-btn-primary"
            disabled={submitLoading}
          >
            {submitLoading ? 'Submitting…' : 'Request withdrawal'}
          </button>
        </form>
      </div>

      <div className="agent-card">
        <h2 className="agent-card-title">Withdrawal history</h2>
        {loading ? (
          <div className="agent-loading">Loading…</div>
        ) : list.length === 0 ? (
          <p className="agent-empty">No withdrawals yet.</p>
        ) : (
          <div className="agent-table-wrap">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td className="amount-gold">TZS {formatAmount(row.amount)}</td>
                    <td className={statusClass(row.status)}>{row.status || '—'}</td>
                    <td>
                      {(row.status || '').toUpperCase() === 'PENDING' && (
                        <button
                          type="button"
                          className="agent-btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '0.85rem' }}
                          onClick={() => handleCancel(row.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button
              type="button"
              className="agent-btn-ghost"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span style={{ alignSelf: 'center', color: 'rgba(255,255,255,0.8)' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="agent-btn-ghost"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
