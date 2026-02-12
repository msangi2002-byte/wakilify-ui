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
    <div className="user-app-card" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
              {order.orderNumber || `Order #${order.id?.substring(0, 8)}`}
            </h3>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: statusInfo.bg,
                color: statusInfo.color,
              }}
            >
              {statusInfo.label}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.875rem', color: '#65676b', marginBottom: '8px' }}>
            {order.createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} />
                {formatDate(order.createdAt)}
              </div>
            )}
            {orderData.business && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} />
                {orderData.business.name || 'Business'}
              </div>
            )}
            {orderData.total && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#7c3aed' }}>
                <ShoppingBag size={14} />
                {formatCurrency(orderData.total)}
              </div>
            )}
          </div>
          {orderData.items && orderData.items.length > 0 && !expanded && (
            <div style={{ fontSize: '0.875rem', color: '#65676b' }}>
              {orderData.items.length} {orderData.items.length === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {canCancel && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              style={{
                padding: '6px 12px',
                fontSize: '0.875rem',
                background: 'none',
                border: '1px solid #e4e6eb',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#ef4444',
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleExpand}
            style={{
              padding: '6px 12px',
              fontSize: '0.875rem',
              background: '#7c3aed',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ paddingTop: '16px', borderTop: '1px solid #e4e6eb' }}>
          {loadingDetails ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '8px' }}>
              <Loader2 size={20} className="icon-spin" />
              <span style={{ color: '#65676b' }}>Loading details...</span>
            </div>
          ) : (
            <>
              {/* Order Items */}
              {orderData.items && orderData.items.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Items</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orderData.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                        }}
                      >
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

              {/* Seller Contact Information */}
              {orderData.business && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
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

              {/* Seller Contact Information */}
              {orderData.business && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
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

              {/* Delivery Information */}
              {(orderData.deliveryName || orderData.deliveryAddress || orderData.deliveryPhone) && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Delivery Information</h4>
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

              {/* Order Summary */}
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Order Summary</h4>
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

              {/* Tracking Information */}
              {orderData.trackingNumber && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    <Truck size={16} style={{ color: '#0284c7' }} />
                    <span style={{ fontWeight: 600 }}>Tracking Number:</span>
                    <span>{orderData.trackingNumber}</span>
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Status Timeline</h4>
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

              {/* Notes */}
              {orderData.customerNotes && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.9375rem', fontWeight: 600 }}>Your Notes</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#65676b' }}>{orderData.customerNotes}</p>
                </div>
              )}
              {orderData.sellerNotes && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.9375rem', fontWeight: 600 }}>Seller Notes</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#65676b' }}>{orderData.sellerNotes}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="user-app-card"
            style={{ maxWidth: '500px', width: '90%', margin: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 600 }}>Cancel Order</h3>
            <p style={{ margin: '0 0 16px', color: '#65676b' }}>
              Are you sure you want to cancel this order? Please provide a reason.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e4e6eb',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                marginBottom: '16px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: '1px solid #e4e6eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                }}
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelling}
                style={{
                  padding: '10px 20px',
                  background: cancelling || !cancelReason.trim() ? '#d1d5db' : '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: cancelling || !cancelReason.trim() ? 'not-allowed' : 'pointer',
                  color: '#fff',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}
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
      <div className="user-app-card" style={{ padding: '48px', textAlign: 'center' }}>
        <Loader2 size={48} className="icon-spin" style={{ color: '#7c3aed', margin: '0 auto 16px' }} />
        <p style={{ color: '#65676b' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }} className="orders-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '4px', fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={32} />
            My Orders
          </h1>
          <p style={{ color: '#65676b', fontSize: '0.9375rem', margin: 0 }}>
            {orders.totalElements} {orders.totalElements === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/app/shop')}
            style={{
              padding: '10px 20px',
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShoppingBag size={18} />
            Shop Now
          </button>
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#fff',
              color: '#050505',
              border: '1px solid #e4e6eb',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.9375rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={18} className={loading ? 'icon-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '8px 16px',
            fontSize: '0.875rem',
            background: statusFilter === 'all' ? '#7c3aed' : '#fff',
            color: statusFilter === 'all' ? '#fff' : '#050505',
            border: '1px solid #e4e6eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: statusFilter === 'all' ? 600 : 400,
          }}
        >
          All
        </button>
        {Object.entries(ORDER_STATUSES).map(([status, info]) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              background: statusFilter === status ? '#7c3aed' : '#fff',
              color: statusFilter === status ? '#fff' : '#050505',
              border: '1px solid #e4e6eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: statusFilter === status ? 600 : 400,
            }}
          >
            {info.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="user-app-card"
          style={{
            marginBottom: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        </div>
      )}

      {orders.content.length === 0 ? (
        <div className="user-app-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Package size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600, color: '#050505' }}>
            No orders yet
          </h2>
          <p style={{ margin: '0 0 24px', color: '#65676b' }}>
            {statusFilter !== 'all'
              ? `No orders with status "${ORDER_STATUSES[statusFilter]?.label}"`
              : 'Start shopping to see your orders here'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/app/shop')}
            style={{
              padding: '12px 24px',
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
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
