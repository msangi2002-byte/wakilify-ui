import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Package, Loader2, CheckCircle, XCircle, Store, ArrowRight } from 'lucide-react';
import { getMyInquiries, acceptInquiry } from '@/lib/api/inquiries';
import { createDraftOrder } from '@/lib/api/orders';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/user-app.css';

function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount);
}

const STATUS_LABEL = {
  OPEN: 'Awaiting quote',
  QUOTED: 'Quote received',
  ACCEPTED: 'Accepted',
  REJECTED: 'Closed',
  CONVERTED_TO_ORDER: 'Order created',
};

export default function Inquiries() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [actionError, setActionError] = useState('');
  const [actingId, setActingId] = useState(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['inquiries', 'my'],
    queryFn: () => getMyInquiries({ page: 0, size: 50 }),
    enabled: !!user,
  });

  const content = data?.content ?? [];
  const errorMessage = error ? getApiErrorMessage(error, 'Failed to load inquiries') : '';

  const handleAccept = async (inquiry) => {
    setActionError('');
    setActingId(inquiry.id);
    try {
      await acceptInquiry(inquiry.id);
      refetch();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to accept'));
    } finally {
      setActingId(null);
    }
  };

  const handleCreateOrder = async (inquiry) => {
    setActionError('');
    setActingId(inquiry.id);
    try {
      const order = await createDraftOrder({
        inquiryId: inquiry.id,
        deliveryName: user?.name ?? '',
        deliveryPhone: user?.phone ?? '',
        deliveryAddress: '',
      });
      refetch();
      navigate(`/app/orders?highlight=${order.id}`);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to create order'));
    } finally {
      setActingId(null);
    }
  };

  if (!user) {
    return (
      <div className="product-details-container" style={{ padding: '24px' }}>
        <h1 className="product-details-order-title">My Inquiries</h1>
        <p style={{ color: '#65676b' }}>Please log in to view your inquiries.</p>
        <Link to="/auth/login" style={{ color: '#7c3aed', fontWeight: 600 }}>Log in</Link>
      </div>
    );
  }

  return (
    <div className="product-details-container" style={{ padding: '24px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <MessageCircle size={28} style={{ color: '#0d9488' }} />
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>My Inquiries</h1>
      </div>
      <p style={{ color: '#65676b', marginBottom: '24px' }}>
        Requests you sent to suppliers. When they send a quote, you can accept and create an order.
      </p>

      {actionError && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginBottom: '16px', color: '#ef4444' }}>
          {actionError}
        </div>
      )}

      {isPending ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#65676b' }}>
          <Loader2 size={20} className="icon-spin" />
          Loading...
        </div>
      ) : errorMessage ? (
        <p style={{ color: '#ef4444' }}>{errorMessage}</p>
      ) : content.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f9fafb', borderRadius: '12px' }}>
          <MessageCircle size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>No inquiries yet</p>
          <p style={{ margin: 0, color: '#65676b' }}>Contact a supplier from a product page to request a quote.</p>
          <Link to="/app/shop" style={{ display: 'inline-block', marginTop: '16px', color: '#7c3aed', fontWeight: 600 }}>Browse Marketplace</Link>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {content.map((inquiry) => (
            <li
              key={inquiry.id}
              style={{
                border: '1px solid #e4e6eb',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {inquiry.productThumbnail ? (
                  <img
                    src={inquiry.productThumbnail}
                    alt=""
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', background: '#e4e6eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={24} style={{ color: '#9ca3af' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Link to={`/app/shop/${inquiry.productId}`} style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}>
                      {inquiry.productName}
                    </Link>
                    <span style={{ fontSize: '0.875rem', color: '#65676b', padding: '2px 8px', background: '#f3f4f6', borderRadius: '6px' }}>
                      {STATUS_LABEL[inquiry.status] ?? inquiry.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.875rem', color: '#65676b' }}>
                    <Store size={14} />
                    {inquiry.businessName}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '0.9375rem', color: '#374151' }}>{inquiry.message}</p>
                  {inquiry.sellerReply && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#f0fdf4', borderRadius: '8px', fontSize: '0.9375rem' }}>
                      <strong>Quote:</strong> {inquiry.sellerReply}
                      {(inquiry.quotedPrice != null || inquiry.quotedDeliveryFee != null) && (
                        <div style={{ marginTop: '4px' }}>
                          {inquiry.quotedPrice != null && formatCurrency(inquiry.quotedPrice)}
                          {inquiry.quotedDeliveryFee != null && inquiry.quotedDeliveryFee > 0 && ` + ${formatCurrency(inquiry.quotedDeliveryFee)} delivery`}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {inquiry.status === 'QUOTED' && (
                      <button
                        type="button"
                        onClick={() => handleAccept(inquiry)}
                        disabled={actingId === inquiry.id}
                        style={{
                          padding: '8px 16px',
                          background: '#0d9488',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: actingId === inquiry.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {actingId === inquiry.id ? <Loader2 size={16} className="icon-spin" /> : <CheckCircle size={16} />}
                        Accept quote
                      </button>
                    )}
                    {inquiry.status === 'ACCEPTED' && !inquiry.convertedOrderId && (
                      <button
                        type="button"
                        onClick={() => handleCreateOrder(inquiry)}
                        disabled={actingId === inquiry.id}
                        style={{
                          padding: '8px 16px',
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: actingId === inquiry.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {actingId === inquiry.id ? <Loader2 size={16} className="icon-spin" /> : <ArrowRight size={16} />}
                        Create order
                      </button>
                    )}
                    {inquiry.convertedOrderId && (
                      <Link
                        to={`/app/orders`}
                        style={{
                          padding: '8px 16px',
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        View order
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: '24px' }}>
        <Link to="/app/shop" style={{ color: '#7c3aed', fontWeight: 600 }}>← Back to Marketplace</Link>
      </div>
    </div>
  );
}
