import { useState, useEffect } from 'react';
import { Package, Loader2, RefreshCw, CheckCircle, Truck, MapPin, User, Calendar, AlertCircle, ChevronDown, X } from 'lucide-react';
import { getBusinessOrders, updateOrderStatus, confirmOrder, shipOrder, deliverOrder } from '@/lib/api/business';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

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

function OrderCard({ order, onStatusUpdate }) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [sellerNotes, setSellerNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.PENDING;

  const getNextStatuses = () => {
    const transitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'COMPLETED', 'CANCELLED'],
      DELIVERED: ['COMPLETED', 'REFUNDED'],
      COMPLETED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };
    return transitions[order.status] || [];
  };

  const handleStatusChange = async (newStatus) => {
    setStatusMenuOpen(false);
    setUpdating(true);
    try {
      if (newStatus === 'CONFIRMED') {
        await confirmOrder(order.id);
      } else if (newStatus === 'SHIPPED') {
        if (!trackingNumber.trim() && !order.trackingNumber) {
          setShowTrackingInput(true);
          setUpdating(false);
          return;
        }
        await shipOrder(order.id, { trackingNumber: trackingNumber.trim() || order.trackingNumber });
      } else if (newStatus === 'DELIVERED') {
        await deliverOrder(order.id);
      } else {
        await updateOrderStatus(order.id, {
          status: newStatus,
          sellerNotes: sellerNotes.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
        });
      }
      onStatusUpdate?.(order.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to update order status'));
    } finally {
      setUpdating(false);
      setTrackingNumber('');
      setSellerNotes('');
      setShowTrackingInput(false);
      setShowNotesInput(false);
    }
  };

  const nextStatuses = getNextStatuses();

  return (
    <div className="business-card" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
            {order.createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} />
                {formatDate(order.createdAt)}
              </div>
            )}
            {order.buyer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} />
                {order.buyer.name || 'Customer'}
              </div>
            )}
            {order.deliveryAddress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} />
                {order.deliveryAddress}
              </div>
            )}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          {nextStatuses.length > 0 && !updating && (
            <button
              type="button"
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className="business-btn-ghost"
              style={{ position: 'relative' }}
            >
              Change Status
              <ChevronDown size={16} style={{ marginLeft: '4px' }} />
            </button>
          )}
          {statusMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                minWidth: '180px',
                padding: '8px',
              }}
            >
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {status === 'CONFIRMED' && <CheckCircle size={16} style={{ color: ORDER_STATUSES.CONFIRMED.color }} />}
                  {status === 'SHIPPED' && <Truck size={16} style={{ color: ORDER_STATUSES.SHIPPED.color }} />}
                  {status === 'DELIVERED' && <Package size={16} style={{ color: ORDER_STATUSES.DELIVERED.color }} />}
                  {ORDER_STATUSES[status]?.label || status}
                </button>
              ))}
            </div>
          )}
          {updating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
              <Loader2 size={16} className="icon-spin" />
              <span style={{ fontSize: '0.875rem' }}>Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Number Input */}
      {showTrackingInput && (
        <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
            Tracking Number
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="business-input"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleStatusChange('SHIPPED')}
              className="business-btn-primary"
              disabled={!trackingNumber.trim()}
            >
              Ship
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTrackingInput(false);
                setTrackingNumber('');
              }}
              className="business-btn-ghost"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Seller Notes Input */}
      {showNotesInput && (
        <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
            Seller Notes (Optional)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={sellerNotes}
              onChange={(e) => setSellerNotes(e.target.value)}
              placeholder="Add notes about this order"
              className="business-input"
              style={{ flex: 1, minHeight: '60px' }}
              rows={2}
            />
            <button
              type="button"
              onClick={() => {
                setShowNotesInput(false);
                setSellerNotes('');
              }}
              className="business-btn-ghost"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.9375rem', fontWeight: 600 }}>Items</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>
                    {item.productName || 'Product'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice || item.unitPrice)}
                  </p>
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {formatCurrency(item.total || (item.unitPrice * item.quantity))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal || order.total)}</span>
        </div>
        {order.deliveryFee && order.deliveryFee > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span>Delivery Fee</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '1.125rem',
            fontWeight: 700,
          }}
        >
          <span>Total</span>
          <span style={{ color: '#3b82f6' }}>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Additional Info */}
      {order.trackingNumber && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
            <Truck size={16} />
            <span>
              <strong>Tracking:</strong> {order.trackingNumber}
            </span>
          </div>
        </div>
      )}
      {order.sellerNotes && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '0.875rem' }}>
          <p style={{ margin: 0, color: '#6b7280' }}>
            <strong>Notes:</strong> {order.sellerNotes}
          </p>
        </div>
      )}
    </div>
  );
}

export default function Orders() {
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
      const data = await getBusinessOrders(params);
      setOrders(Array.isArray(data?.content) ? { content: data.content, totalElements: data.totalElements || data.content.length } : { content: [], totalElements: 0 });
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

  const handleStatusUpdate = (orderId) => {
    loadOrders();
  };

  if (loading) {
    return (
      <div className="business-loading">
        <Loader2 size={32} className="icon-spin" />
        <div>Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="business-main" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="business-dashboard-title" style={{ margin: 0, marginBottom: '4px' }}>
            <Package size={28} />
            Orders
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            {orders.totalElements} {orders.totalElements === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="business-btn-ghost"
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw size={18} style={{ marginRight: '6px' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={statusFilter === 'all' ? 'business-btn-primary' : 'business-btn-ghost'}
          style={{ fontSize: '0.875rem' }}
        >
          All
        </button>
        {Object.entries(ORDER_STATUSES).map(([status, info]) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={statusFilter === status ? 'business-btn-primary' : 'business-btn-ghost'}
            style={{ fontSize: '0.875rem' }}
          >
            {info.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="business-card"
          style={{
            marginBottom: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        </div>
      )}

      {orders.content.length === 0 ? (
        <div className="business-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Package size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
            No orders yet
          </h2>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {statusFilter !== 'all' ? `No orders with status "${ORDER_STATUSES[statusFilter]?.label}"` : 'Orders will appear here when customers place them'}
          </p>
        </div>
      ) : (
        <div>
          {orders.content.map((order) => (
            <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
