import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAgentCommissions } from '@/lib/api/agent';
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
  if (s === 'PAID') return 'status-success';
  if (s === 'PENDING') return 'status-pending';
  return 'status-pending';
}

export default function Commissions() {
  const [page, setPage] = useState(0);
  const size = 20;

  const { data, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['agent', 'commissions', page],
    queryFn: () => getAgentCommissions({ page, size }),
    select: (res) => {
      const content = Array.isArray(res?.content) ? res.content : [];
      return { content, totalElements: res?.totalElements ?? content.length };
    },
  });

  const list = data?.content ?? [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.ceil((totalElements || 0) / size);
  const error = queryError ? getApiErrorMessage(queryError, 'Failed to load commissions') : '';

  return (
    <div className="agent-dashboard agent-dashboard-cards agent-page-centered">
      <h1 className="agent-dashboard-title">Commissions</h1>
      <p className="agent-dashboard-card-desc" style={{ marginBottom: 0 }}>
        Commission breakdown per activation and renewal. Amounts in TZS.
      </p>
      {error && (
        <div className="agent-dashboard-card agent-dashboard-card-error">
          <p className="agent-dashboard-card-error-text">{error}</p>
        </div>
      )}
      <div className="agent-dashboard-card agent-dashboard-card-commissions">
        {loading ? (
          <AgentTableSkeleton rows={6} cols={5} />
        ) : list.length === 0 ? (
          <p className="agent-empty">No commissions yet.</p>
        ) : (
          <div className="agent-table-wrap">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.type || '—'}</td>
                    <td>{row.description || '—'}</td>
                    <td className="amount-gold">TZS {formatAmount(row.amount)}</td>
                    <td className={statusClass(row.status)}>{row.status || '—'}</td>
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
  );
}
