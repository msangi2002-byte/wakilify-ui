import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Loader2, RefreshCw, CheckCircle, Truck, MapPin, Calendar, AlertCircle, X, ShoppingBag, Building2, Phone, User as UserIcon, Mail, Globe, MessageCircle } from 'lucide-react';
import { getMyOrders, getOrderById, cancelOrder } from '@/lib/api/orders';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/user-app.css';

const ORDER_STATUSES = {
  PENDING: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  CONFIRMED: { label: 'Confirmed', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  PROCESSING: { label: 'Processing', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  SHIPPED: { label: 'Shipped', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  DELIVERED: { label: 'Delivered', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  COMPLETED: { label: 'Completed', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  REFUNDED: { label: 'Refunded', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
};

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
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

function OrderCard({ order, onOrderUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.PENDING;
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';

  const loadOrderDetails = async () => {
    if (orderDetails || loadingDetails) return;
    setLoadingDetails(true);
    try {
      const details = await getOrderById(order.id);
      setOrderDetails(details);
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExpand = () => {
    if (!expanded && !orderDetails) {
      loadOrderDetails();
    }
    setExpanded(!expanded);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim() || cancelling) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id, cancelReason.trim());
      setShowCancelModal(false);
      setCancelReason('');
      onOrderUpdate?.();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to cancel order'));
    } finally {
      setCancelling(false);
    }
  };

  const orderData = orderDetails || order;

  return (
    <div className="orders-card">
      <div className="orders-card-header">
        <div className="orders-card-header-left">
          <div className="orders-card-title-row">
            <h3 className="orders-card-title">
              {order.orderNumber || `Order #${order.id?.substring(0, 8)}`}
            </h3>
            <span className="orders-card-status" style={{ background: statusInfo.bg, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          </div>
          <div className="orders-card-meta">
            {order.createdAt && (
              <span>
                <Calendar size={14} />
                {formatDate(order.createdAt)}
              </span>
            )}
            {orderData.business && (
              <span>
                <Building2 size={14} />
                {orderData.business.name || 'Business'}
              </span>
            )}
            {orderData.total && (
              <span style={{ fontWeight: 600, color: '#7c3aed' }}>
                <ShoppingBag size={14} />
                {formatCurrency(orderData.total)}
              </span>
            )}
          </div>
          {orderData.items && orderData.items.length > 0 && !expanded && (
            <div style={{ fontSize: '0.875rem', color: '#65676b' }}>
              {orderData.items.length} {orderData.items.length === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>
        <div className="orders-card-actions">
          {canCancel && (
            <button type="button" onClick={() => setShowCancelModal(true)} className="orders-card-btn orders-card-btn-outline">
              Cancel
            </button>
          )}
          <button type="button" onClick={handleExpand} className="orders-card-btn orders-card-btn-primary">
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="orders-card-expanded">
          {loadingDetails ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '8px' }}>
              <Loader2 size={20} className="icon-spin" />
              <span style={{ color: '#65676b' }}>Loading details...</span>
            </div>
          ) : (
            <>
              {orderData.items && orderData.items.length > 0 && (
                <div className="orders-card-section">
                  <h4 className="orders-card-section-title">Items</h4>
                  <div>
                    {orderData.items.map((item, idx) => (
                      <div key={item.id || idx} className="orders-item-row">
                        {item.productImage && (
                          <img
                            src={item.productImage}
                            alt={item.productName || 'Product'}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              background: '#e4e6eb',
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>
                            {item.productName || 'Product'}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#65676b' }}>
                            Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', alignSelf: 'flex-start' }}>
                          {formatCurrency(item.total || (item.unitPrice * item.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {orderData.business && (
                <div className="orders-card-section orders-seller-box">
                  <h4 className="orders-card-section-title">
                    <Building2 size={18} style={{ color: '#0284c7' }} />
                    Seller Contact
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {orderData.business.logo && (
                      <img
                        src={orderData.business.logo}
                        alt={orderData.business.name || 'Business'}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          background: '#e4e6eb',
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>
                        {orderData.business.name || 'Business'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                    {orderData.business.phone && (
                      <a
                        href={`tel:${orderData.business.phone}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#0284c7',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        <Phone size={16} />
                        <span>{orderData.business.phone}</span>
                      </a>
                    )}
                    {orderData.business.email && (
                      <a
                        href={`mailto:${orderData.business.email}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#0284c7',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        <Mail size={16} />
                        <span>{orderData.business.email}</span>
                      </a>
                    )}
                    {orderData.business.website && (
                      <a
                        href={orderData.business.website.startsWith('http') ? orderData.business.website : `https://${orderData.business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#0284c7',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        <Globe size={16} />
                        <span>{orderData.business.website}</span>
                      </a>
                    )}
                    {(orderData.business.region || orderData.business.district) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#65676b' }}>
                        <MapPin size={16} />
                        <span>
                          {orderData.business.region || ''}
                          {orderData.business.region && orderData.business.district ? ', ' : ''}
                          {orderData.business.district || ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {orderData.business && (
                <div className="orders-card-section orders-seller-box">
                  <h4 className="orders-card-section-title">
                    <Building2 size={18} style={{ color: '#0284c7' }} />
                    Seller Contact
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {orderData.business.logo && (
                      <img
                        src={orderData.business.logo}
                        alt={orderData.business.name || 'Business'}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          background: '#e4e6eb',
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>
                        {orderData.business.name || 'Business'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                    {orderData.business.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <a
                          href={`tel:${orderData.business.phone}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#0284c7',
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          <Phone size={16} />
                          <span>{orderData.business.phone}</span>
                        </a>
                        <a
                          href={`https://wa.me/${orderData.business.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginLeft: '8px',
                            padding: '4px 8px',
                            background: '#25D366',
                            color: '#fff',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                          }}
                          title="Contact via WhatsApp"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </a>
                      </div>
                    )}
                    {orderData.business.email && (
                      <a
                        href={`mailto:${orderData.business.email}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#0284c7',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        <Mail size={16} />
                        <span>{orderData.business.email}</span>
                      </a>
                    )}
                    {orderData.business.website && (
                      <a
                        href={orderData.business.website.startsWith('http') ? orderData.business.website : `https://${orderData.business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#0284c7',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        <Globe size={16} />
                        <span>{orderData.business.website}</span>
                      </a>
                    )}
                    {(orderData.business.region || orderData.business.district) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#65676b' }}>
                        <MapPin size={16} />
                        <span>
                          {orderData.business.region || ''}
                          {orderData.business.region && orderData.business.district ? ', ' : ''}
                          {orderData.business.district || ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(orderData.deliveryName || orderData.deliveryAddress || orderData.deliveryPhone) && (
                <div className="orders-card-section orders-delivery-box">
                  <h4 className="orders-card-section-title">Delivery Information</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                    {orderData.deliveryName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserIcon size={16} style={{ color: '#65676b' }} />
                        <span>{orderData.deliveryName}</span>
                      </div>
                    )}
                    {orderData.deliveryPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} style={{ color: '#65676b' }} />
                        <span>{orderData.deliveryPhone}</span>
                      </div>
                    )}
                    {orderData.deliveryAddress && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <MapPin size={16} style={{ color: '#65676b', marginTop: '2px' }} />
                        <span>{orderData.deliveryAddress}</span>
                      </div>
                    )}
                    {orderData.deliveryRegion && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#65676b' }}>
                        <span>{orderData.deliveryRegion}{orderData.deliveryDistrict ? `, ${orderData.deliveryDistrict}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="orders-card-section orders-summary-box">
                <h4 className="orders-card-section-title">Order Summary</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(orderData.subtotal || orderData.total)}</span>
                  </div>
                  {orderData.deliveryFee && orderData.deliveryFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(orderData.deliveryFee)}</span>
                    </div>
                  )}
                  {orderData.discount && orderData.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                      <span>Discount</span>
                      <span>-{formatCurrency(orderData.discount)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid #e4e6eb',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>Total</span>
                    <span style={{ color: '#7c3aed' }}>{formatCurrency(orderData.total)}</span>
                  </div>
                </div>
              </div>

              {orderData.trackingNumber && (
                <div className="orders-card-section orders-seller-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    <Truck size={16} style={{ color: '#0284c7' }} />
                    <span style={{ fontWeight: 600 }}>Tracking Number:</span>
                    <span>{orderData.trackingNumber}</span>
                  </div>
                </div>
              )}

              <div className="orders-card-section orders-timeline-box">
                <h4 className="orders-card-section-title">Status Timeline</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                  {orderData.createdAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={16} style={{ color: '#22c55e' }} />
                      <span>Order placed on {formatDate(orderData.createdAt)}</span>
                    </div>
                  )}
                  {orderData.confirmedAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={16} style={{ color: '#3b82f6' }} />
                      <span>Confirmed on {formatDate(orderData.confirmedAt)}</span>
                    </div>
                  )}
                  {orderData.shippedAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={16} style={{ color: '#6366f1' }} />
                      <span>Shipped on {formatDate(orderData.shippedAt)}</span>
                    </div>
                  )}
                  {orderData.deliveredAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={16} style={{ color: '#22c55e' }} />
                      <span>Delivered on {formatDate(orderData.deliveredAt)}</span>
                    </div>
                  )}
                  {orderData.cancelledAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                      <X size={16} />
                      <span>Cancelled on {formatDate(orderData.cancelledAt)}</span>
                      {orderData.cancellationReason && (
                        <span style={{ fontSize: '0.8125rem', color: '#65676b' }}>({orderData.cancellationReason})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {orderData.customerNotes && (
                <div className="orders-card-section orders-notes-box">
                  <h4 className="orders-card-section-title">Your Notes</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#65676b' }}>{orderData.customerNotes}</p>
                </div>
              )}
              {orderData.sellerNotes && (
                <div className="orders-card-section orders-notes-box seller">
                  <h4 className="orders-card-section-title">Seller Notes</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#65676b' }}>{orderData.sellerNotes}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showCancelModal && (
        <div className="orders-cancel-modal-backdrop" onClick={() => setShowCancelModal(false)}>
          <div className="orders-cancel-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="orders-cancel-modal-title">Cancel Order</h3>
            <p className="orders-cancel-modal-desc">
              Are you sure you want to cancel this order? Please provide a reason.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={4}
              className="orders-cancel-modal-textarea"
            />
            <div className="orders-cancel-modal-actions">
              <button
                type="button"
                className="orders-cancel-keep"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="orders-cancel-submit"
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 size={16} className="icon-spin" style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: 0, size: 50 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await getMyOrders(params);
      setOrders(
        Array.isArray(data?.content)
          ? { content: data.content, totalElements: data.totalElements || data.content.length }
          : { content: [], totalElements: 0 }
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load orders'));
      setOrders({ content: [], totalElements: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleOrderUpdate = () => {
    loadOrders();
  };

  if (loading) {
    return (
      <div className="orders-container">
        <div className="orders-loading">
          <Loader2 size={48} className="icon-spin orders-loading-spinner" />
          <p className="orders-loading-text">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div>
          <h1 className="orders-header-title">
            <Package size={32} />
            My Orders
          </h1>
          <p className="orders-header-sub">
            {orders.totalElements} {orders.totalElements === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <div className="orders-header-actions">
          <button type="button" onClick={() => navigate('/app/shop')} className="orders-btn orders-btn-primary">
            <ShoppingBag size={18} />
            Shop Now
          </button>
          <button type="button" onClick={loadOrders} disabled={loading} className="orders-btn orders-btn-secondary">
            <RefreshCw size={18} className={loading ? 'icon-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="orders-filters">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`orders-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
        >
          All
        </button>
        {Object.entries(ORDER_STATUSES).map(([status]) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`orders-filter-btn ${statusFilter === status ? 'active' : ''}`}
          >
            {ORDER_STATUSES[status].label}
          </button>
        ))}
      </div>

      {error && (
        <div className="orders-error-card">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {orders.content.length === 0 ? (
        <div className="orders-empty-card">
          <Package size={64} className="orders-empty-icon" />
          <h2 className="orders-empty-title">No orders yet</h2>
          <p className="orders-empty-desc">
            {statusFilter !== 'all'
              ? `No orders with status "${ORDER_STATUSES[statusFilter]?.label}"`
              : 'Start shopping to see your orders here'}
          </p>
          <button type="button" onClick={() => navigate('/app/shop')} className="orders-empty-btn">
            <ShoppingBag size={20} />
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div>
          {orders.content.map((order) => (
            <OrderCard key={order.id} order={order} onOrderUpdate={handleOrderUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
