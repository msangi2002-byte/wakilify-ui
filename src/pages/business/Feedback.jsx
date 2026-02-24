import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, RefreshCw, AlertCircle, User, Check, CheckCheck } from 'lucide-react';
import { getBusinessFeedback, markBusinessFeedbackAsRead, markAllBusinessFeedbackAsRead } from '@/lib/api/business';
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
  const [readLoadingId, setReadLoadingId] = useState(null);
  const [readAllLoading, setReadAllLoading] = useState(false);

  const loadFeedback = async (silent = false) => {
    if (!silent) setLoading(true);
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

  const handleMarkAsRead = async (item) => {
    if (item.read) return;
    setReadLoadingId(item.id);
    try {
      await markBusinessFeedbackAsRead(item.id);
      setData((prev) => ({
        ...prev,
        content: prev.content.map((f) => (f.id === item.id ? { ...f, read: true, readAt: new Date().toISOString() } : f)),
      }));
    } catch (_) {
      loadFeedback(true);
    } finally {
      setReadLoadingId(null);
    }
  };

  const handleReadAll = async () => {
    setReadAllLoading(true);
    try {
      await markAllBusinessFeedbackAsRead();
      await loadFeedback(true);
    } catch (_) {
      loadFeedback(true);
    } finally {
      setReadAllLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const unreadCount = data.content.filter((f) => !f.read).length;

  if (loading) {
    return (
      <div className="business-loading">
        <Loader2 size={32} className="icon-spin" />
        <div>Loading feedback…</div>
      </div>
    );
  }

  return (
    <div className="business-main business-page" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <header className="business-page-header" style={{ marginBottom: 0 }}>
          <h1 className="business-page-title">
            <MessageSquare size={26} />
            Maoni ya wateja
            {unreadCount > 0 && (
              <span className="business-feedback-unread-badge" style={{ marginLeft: 8 }}>{unreadCount} mpya</span>
            )}
          </h1>
          <p className="business-page-subtitle">
            Maoni na mapendekezo kutoka kwa wateja waliofikia duka lako
          </p>
        </header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="business-btn-primary"
              onClick={handleReadAll}
              disabled={readAllLoading}
            >
              {readAllLoading ? <Loader2 size={18} className="icon-spin" style={{ marginRight: 6 }} /> : <CheckCheck size={18} style={{ marginRight: 6 }} />}
              Read all
            </button>
          )}
          <button type="button" className="business-btn-ghost" onClick={loadFeedback} disabled={loading}>
            <RefreshCw size={18} style={{ marginRight: '6px' }} />
            Refresh
          </button>
        </div>
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
            <div
              key={item.id}
              className={`business-card business-feedback-card ${item.read ? '' : 'business-feedback-card-unread'}`}
              style={{ padding: '20px' }}
            >
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
                      {!item.read && <span className="business-feedback-new-dot" style={{ marginLeft: 6 }} />}
                    </div>
                  </div>
                </div>
                {!item.read && (
                  <button
                    type="button"
                    className="business-btn-ghost business-feedback-mark-read"
                    onClick={() => handleMarkAsRead(item)}
                    disabled={readLoadingId === item.id}
                    title="Mark as read"
                  >
                    {readLoadingId === item.id ? (
                      <Loader2 size={18} className="icon-spin" />
                    ) : (
                      <Check size={18} style={{ marginRight: 4 }} />
                    )}
                    New read
                  </button>
                )}
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
