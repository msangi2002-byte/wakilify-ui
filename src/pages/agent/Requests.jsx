import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, User, Phone, MapPin } from 'lucide-react';
import { getAgentBusinessRequests } from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/agent.css';

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

export default function Requests() {
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const size = 20;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAgentBusinessRequests({ page, size })
      .then((res) => {
        if (cancelled) return;
        const content = Array.isArray(res?.content) ? res.content : [];
        setData({
          content,
          totalElements: res?.totalElements ?? content.length,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load requests'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  const list = data.content;
  const totalPages = Math.ceil((data.totalElements || 0) / size);

  return (
    <div className="agent-requests">
      <h1 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700 }}>
        Business requests
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
        Users who selected you as their agent when requesting to become a business. Review and use Activate Business to proceed.
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
          <p className="agent-empty">No business requests yet. Users who select you when they request to become a business will appear here.</p>
        ) : (
          <ul className="agent-requests-list">
            {list.map((req) => (
              <li key={req.id} className="agent-request-card">
                <div className="agent-request-header">
                  <Building2 size={20} className="agent-request-icon" />
                  <span className="agent-request-name">{req.businessName || '—'}</span>
                  <span className={`agent-request-status agent-request-status-${(req.status || '').toLowerCase()}`}>
                    {req.status || 'PENDING'}
                  </span>
                </div>
                <div className="agent-request-details">
                  {req.userName && (
                    <div className="agent-request-row">
                      <User size={16} />
                      <span>{req.userName}</span>
                    </div>
                  )}
                  {(req.ownerPhone || req.userPhone) && (
                    <div className="agent-request-row">
                      <Phone size={16} />
                      <span>{req.ownerPhone || req.userPhone}</span>
                    </div>
                  )}
                  {req.region && (
                    <div className="agent-request-row">
                      <MapPin size={16} />
                      <span>{[req.region, req.district, req.ward].filter(Boolean).join(', ') || req.region}</span>
                    </div>
                  )}
                  {req.category && (
                    <div className="agent-request-row">
                      <span className="agent-request-meta">Category: {req.category}</span>
                    </div>
                  )}
                  {req.description && (
                    <p className="agent-request-desc">{req.description}</p>
                  )}
                </div>
                <div className="agent-request-footer">
                  <span className="agent-request-date">{formatDate(req.createdAt)}</span>
                  {(req.status || '').toUpperCase() === 'PENDING' && (
                    <Link
                      to="/agent/activate"
                      state={{
                        fromRequest: {
                          businessName: req.businessName,
                          ownerName: req.userName,
                          ownerPhone: req.ownerPhone || req.userPhone,
                          category: req.category,
                          region: req.region,
                          district: req.district,
                          ward: req.ward,
                          street: req.street,
                          description: req.description,
                        },
                      }}
                      className="agent-btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                    >
                      Activate business
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
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
