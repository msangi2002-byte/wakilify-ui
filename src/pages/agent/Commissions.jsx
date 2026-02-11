import { useState, useEffect } from 'react';
import { getAgentCommissions } from '@/lib/api/agent';
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
  if (s === 'PAID') return 'status-success';
  if (s === 'PENDING') return 'status-pending';
  return 'status-pending';
}

export default function Commissions() {
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const size = 20;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAgentCommissions({ page, size })
      .then((res) => {
        if (cancelled) return;
        const content = Array.isArray(res?.content) ? res.content : [];
        setData({
          content,
          totalElements: res?.totalElements ?? content.length,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load commissions'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  const list = data.content;
  const totalPages = Math.ceil((data.totalElements || 0) / size);

  return (
    <div className="agent-commissions">
      <h1 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700 }}>
        Commissions
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
        Commission breakdown per activation and renewal. Amounts in TZS.
      </p>
      {error && (
        <div className="agent-card" style={{ marginBottom: 20, borderColor: '#F09068' }}>
          <p style={{ color: '#F09068', margin: 0 }}>{error}</p>
        </div>
      )}
      <div className="agent-card">
        {loading ? (
          <div className="agent-loading">Loading…</div>
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
