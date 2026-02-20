import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, RefreshCw, AlertCircle, User } from 'lucide-react';
import { getBusinessFeedback } from '@/lib/api/business';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function Feedback() {
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getBusinessFeedback({ page: 0, size: 50 });
      setData({
        content: Array.isArray(res?.content) ? res.content : [],
        totalElements: res?.totalElements ?? res?.content?.length ?? 0,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load feedback'));
      setData({ content: [], totalElements: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  if (loading) {
    return (
      <div className="business-loading">
        <Loader2 size={32} className="icon-spin" />
        <div>Loading feedback…</div>
      </div>
    );
  }

  return (
    <div className="business-main" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="business-dashboard-title" style={{ margin: 0, marginBottom: '4px' }}>
            <MessageSquare size={28} />
            Shop feedback
          </h1>
          <p className="business-orders-subtitle">
            Feedback and advice from customers who visited your shop
          </p>
        </div>
        <button type="button" className="business-btn-ghost" onClick={loadFeedback} disabled={loading}>
          <RefreshCw size={18} style={{ marginRight: '6px' }} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="business-card business-orders-error-card">
          <div className="business-orders-error-content">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      {!error && data.content.length === 0 ? (
        <div className="business-card business-orders-empty-card">
          <MessageSquare size={64} className="business-orders-empty-icon" />
          <h2 className="business-orders-empty-title">No feedback yet</h2>
          <p className="business-orders-empty-desc">
            When customers leave feedback or advice on your shop page, it will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.content.map((item) => (
            <div key={item.id} className="business-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.user?.profilePic ? (
                    <img
                      src={item.user.profilePic}
                      alt=""
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="rgba(255,255,255,0.6)" />
                    </div>
                  )}
                  <div>
                    <span className="business-orders-value" style={{ fontWeight: 600 }}>{item.user?.name || 'Customer'}</span>
                    <div className="business-orders-muted" style={{ fontSize: '0.8125rem', marginTop: 2 }}>
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9375rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
