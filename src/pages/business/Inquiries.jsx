import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Package,
  Loader2,
  User,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { getBusinessInquiries, quoteInquiry, rejectInquiry } from '@/lib/api/inquiries';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-TZ', {
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

const STATUS_LABEL = {
  OPEN: 'Awaiting your quote',
  QUOTED: 'Quote sent',
  ACCEPTED: 'Accepted by buyer',
  REJECTED: 'Closed',
  CONVERTED_TO_ORDER: 'Order created',
};

export default function BusinessInquiries() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actingId, setActingId] = useState(null);
  const [quoteOpenId, setQuoteOpenId] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    sellerReply: '',
    quotedPrice: '',
    quotedDeliveryFee: '',
  });

  const { data, isPending, error } = useQuery({
    queryKey: ['business', 'inquiries', statusFilter],
    queryFn: () =>
      getBusinessInquiries({
        page: 0,
        size: 50,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
  });

  const content = data?.content ?? [];
  const errorMessage = error ? getApiErrorMessage(error, 'Failed to load inquiries') : '';

  const handleQuote = async (inquiryId) => {
    setActionError('');
    setActingId(inquiryId);
    const reply = (quoteForm.sellerReply || '').trim();
    const price = quoteForm.quotedPrice === '' ? null : parseFloat(quoteForm.quotedPrice);
    const delivery = quoteForm.quotedDeliveryFee === '' ? 0 : parseFloat(quoteForm.quotedDeliveryFee);
    if (!reply) {
      setActionError('Please enter your quote message.');
      setActingId(null);
      return;
    }
    try {
      await quoteInquiry(inquiryId, {
        sellerReply: reply,
        quotedPrice: price,
        quotedDeliveryFee: Number.isNaN(delivery) ? 0 : delivery,
      });
      setQuoteOpenId(null);
      setQuoteForm({ sellerReply: '', quotedPrice: '', quotedDeliveryFee: '' });
      queryClient.invalidateQueries({ queryKey: ['business', 'inquiries'] });
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to send quote'));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (inquiryId) => {
    setActionError('');
    setActingId(inquiryId);
    try {
      await rejectInquiry(inquiryId, true);
      setQuoteOpenId(null);
      queryClient.invalidateQueries({ queryKey: ['business', 'inquiries'] });
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to close inquiry'));
    } finally {
      setActingId(null);
    }
  };

  const openQuoteForm = (inquiry) => {
    setQuoteOpenId(inquiry.id);
    setQuoteForm({
      sellerReply: '',
      quotedPrice: inquiry.productId ? '' : '',
      quotedDeliveryFee: '0',
    });
    setActionError('');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MessageCircle size={28} style={{ color: 'var(--business-primary-light, #818cf8)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Quote requests</h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.8)' }}>
              Customers requested a quote. Reply with price and terms; they can then accept and pay.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>Filter:</span>
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value === '' ? null : e.target.value)}
            className="business-input"
            style={{ minWidth: 160 }}
          >
            <option value="">All</option>
            <option value="OPEN">Awaiting quote</option>
            <option value="QUOTED">Quote sent</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Closed</option>
            <option value="CONVERTED_TO_ORDER">Order created</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div
          className="business-card"
          style={{ marginBottom: 16, padding: 16, background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', gap: 10 }}
          role="alert"
        >
          <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} /> <span style={{ color: '#fca5a5' }}>{actionError}</span>
        </div>
      )}

      {isPending ? (
        <div className="business-card" style={{ padding: 32, textAlign: 'center' }}>
          <Loader2 size={32} className="icon-spin" style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>Loading quote requests...</p>
        </div>
      ) : errorMessage ? (
        <div className="business-card business-card-alert-error" style={{ padding: 24 }}>
          {errorMessage}
        </div>
      ) : content.length === 0 ? (
        <div className="business-card" style={{ padding: 48, textAlign: 'center' }}>
          <MessageCircle size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
          <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#f8fafc' }}>No quote requests yet</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)' }}>
            When customers use “Contact Supplier” on your products, requests will appear here.
          </p>
          <Link to="/business/products" style={{ display: 'inline-block', marginTop: 16, color: 'var(--business-primary-light)', fontWeight: 600 }}>
            View Products
          </Link>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {content.map((inquiry) => (
            <li key={inquiry.id} className="business-card" style={{ marginBottom: 16, padding: 20 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {inquiry.productThumbnail ? (
                  <img
                    src={inquiry.productThumbnail}
                    alt=""
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      background: '#f3f4f6',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Package size={28} style={{ color: '#9ca3af' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link
                      to={`/app/shop/${inquiry.productId}`}
                      style={{ fontWeight: 600, color: '#f8fafc', textDecoration: 'none' }}
                    >
                      {inquiry.productName}
                    </Link>
                    <span
                      style={{
                        fontSize: 12,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: inquiry.status === 'OPEN' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(52, 211, 153, 0.25)',
                        color: inquiry.status === 'OPEN' ? '#fcd34d' : '#6ee7b7',
                      }}
                    >
                      {STATUS_LABEL[inquiry.status] ?? inquiry.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                    <User size={14} />
                    {inquiry.buyerName ?? 'Customer'}
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: 15, color: 'rgba(255,255,255,0.95)', lineHeight: 1.45 }}>{inquiry.message}</p>
                  {inquiry.quantity != null && inquiry.quantity > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>Quantity: {inquiry.quantity}</p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{formatDate(inquiry.createdAt)}</p>

                  {inquiry.status === 'OPEN' && (
                    <div style={{ marginTop: 16 }}>
                      {quoteOpenId === inquiry.id ? (
                        <div
                          style={{
                            padding: 16,
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderRadius: 12,
                            marginTop: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.95)' }}>Your quote</label>
                          <textarea
                            placeholder="Price, delivery terms, availability..."
                            value={quoteForm.sellerReply}
                            onChange={(e) => setQuoteForm((f) => ({ ...f, sellerReply: e.target.value }))}
                            className="business-input"
                            rows={3}
                            style={{ width: '100%', marginBottom: 12 }}
                          />
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div>
                              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: 4 }}>Price (TZS)</label>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                placeholder="Optional"
                                value={quoteForm.quotedPrice}
                                onChange={(e) => setQuoteForm((f) => ({ ...f, quotedPrice: e.target.value }))}
                                className="business-input"
                                style={{ width: 140 }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: 4 }}>Delivery fee (TZS)</label>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={quoteForm.quotedDeliveryFee}
                                onChange={(e) => setQuoteForm((f) => ({ ...f, quotedDeliveryFee: e.target.value }))}
                                className="business-input"
                                style={{ width: 120 }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="business-btn-primary"
                              onClick={() => handleQuote(inquiry.id)}
                              disabled={actingId === inquiry.id}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              {actingId === inquiry.id ? (
                                <Loader2 size={18} className="icon-spin" />
                              ) : (
                                <Send size={18} />
                              )}
                              Send quote
                            </button>
                            <button
                              type="button"
                              className="business-btn-secondary"
                              onClick={() => handleReject(inquiry.id)}
                              disabled={actingId === inquiry.id}
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              className="business-btn-ghost"
                              onClick={() => setQuoteOpenId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="business-btn-primary"
                            onClick={() => openQuoteForm(inquiry)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            <Send size={18} />
                            Reply with quote
                          </button>
                          <button
                            type="button"
                            className="business-btn-secondary"
                            onClick={() => handleReject(inquiry.id)}
                            disabled={actingId === inquiry.id}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {inquiry.status === 'QUOTED' && (
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(52, 211, 153, 0.15)', borderRadius: 8, fontSize: 14, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                      <strong style={{ color: '#6ee7b7' }}>Your quote:</strong>{' '}
                      <span style={{ color: 'rgba(255,255,255,0.95)' }}>{inquiry.sellerReply}</span>
                      {(inquiry.quotedPrice != null || (inquiry.quotedDeliveryFee != null && inquiry.quotedDeliveryFee > 0)) && (
                        <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.9)' }}>
                          {inquiry.quotedPrice != null && formatCurrency(inquiry.quotedPrice)}
                          {inquiry.quotedDeliveryFee != null && inquiry.quotedDeliveryFee > 0 &&
                            ` + ${formatCurrency(inquiry.quotedDeliveryFee)} delivery`}
                        </div>
                      )}
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Sent {formatDate(inquiry.respondedAt)}</p>
                    </div>
                  )}

                  {inquiry.status === 'ACCEPTED' && inquiry.convertedOrderId && (
                    <Link
                      to="/business/orders"
                      className="business-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12 }}
                    >
                      View order
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
