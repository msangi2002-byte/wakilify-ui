import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { getAgentWithdrawals, requestWithdrawal, cancelWithdrawal } from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { AgentTableSkeleton } from '@/components/ui/agent/AgentTableSkeleton';
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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const size = 20;
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const { data, isLoading: loading } = useQuery({
    queryKey: ['agent', 'withdrawals', page],
    queryFn: () => getAgentWithdrawals({ page, size }),
    select: (res) => {
      const content = Array.isArray(res?.content) ? res.content : [];
      return { content, totalElements: res?.totalElements ?? content.length };
    },
  });

  const list = data?.content ?? [];
  const totalPages = Math.ceil((data?.totalElements ?? 0) / size);

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
      queryClient.invalidateQueries({ queryKey: ['agent', 'withdrawals'] });
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
      queryClient.invalidateQueries({ queryKey: ['agent', 'withdrawals'] });
    } catch (_) {}
  };

  return (
    <div className="agent-dashboard agent-dashboard-cards agent-page-centered">
      <h1 className="agent-dashboard-title">Withdrawals</h1>
      <p className="agent-dashboard-card-desc" style={{ marginBottom: 0 }}>
        Request a payout to your phone. Withdrawals are subject to minimum amount and verification.
      </p>

      <div className="agent-dashboard-cards-row agent-withdrawals-row">
        <div className="agent-dashboard-card agent-dashboard-card-withdraw-form">
          <h2 className="agent-dashboard-card-heading">
            <Wallet size={20} />
            Request withdrawal
          </h2>
          <form onSubmit={handleRequest} className="agent-withdraw-form agent-requests-form-cols">
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="wd-amount">Amount (TZS) *</label>
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
            <div className="agent-form-field">
              <label className="agent-label" htmlFor="wd-phone">Phone *</label>
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
              <div className="agent-dashboard-card-alert agent-dashboard-card-alert-error" style={{ gridColumn: '1 / -1' }}>
                <AlertCircle size={18} />
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div className="agent-dashboard-card-alert agent-dashboard-card-alert-success" style={{ gridColumn: '1 / -1' }}>
                <CheckCircle size={18} />
                {submitSuccess}
              </div>
            )}
            <button type="submit" className="agent-btn-primary agent-requests-submit" disabled={submitLoading} style={{ gridColumn: '1 / -1' }}>
              {submitLoading ? 'Submitting…' : 'Request withdrawal'}
            </button>
          </form>
        </div>

        <div className="agent-dashboard-card agent-dashboard-card-withdraw-history">
          <h2 className="agent-dashboard-card-heading">
            <Wallet size={20} />
            Withdrawal history
          </h2>
        {loading ? (
          <AgentTableSkeleton rows={5} cols={4} />
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
          <div className="agent-dashboard-card-pagination">
            <button
              type="button"
              className="agent-btn-ghost"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span className="agent-dashboard-card-pagination-label">
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
    </div>
  );
}
