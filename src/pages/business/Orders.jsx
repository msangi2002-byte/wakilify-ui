import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Loader2, RefreshCw, CheckCircle, Truck, MapPin, User, Calendar, AlertCircle, ChevronDown, X, Building2, Phone, Mail, Globe, MapPinned, Plus } from 'lucide-react';
import { getBusinessOrders, updateOrderStatus, confirmOrder, shipOrder, deliverOrder } from '@/lib/api/business';
import { getOrderTracking, addOrderTrackingEvent } from '@/lib/api/orders';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

const ORDER_STATUSES = {
  DRAFT: { label: 'Draft', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
  PENDING_CONFIRMATION: { label: 'Pending confirmation', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
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

const TRACKING_EVENT_TYPES = [
  { value: 'AT_STORE', label: 'At store' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'DELIVERED', label: 'Delivered' },
];

function OrderCard({ order, onStatusUpdate }) {
  const queryClient = useQueryClient();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [sellerNotes, setSellerNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [trackingEventType, setTrackingEventType] = useState('IN_TRANSIT');
  const [trackingNote, setTrackingNote] = useState('');
  const [addTrackingWithLocation, setAddTrackingWithLocation] = useState(false);
  const [addingTracking, setAddingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const canAddTracking = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'PENDING', 'DRAFT', 'PENDING_CONFIRMATION'].includes(order.status);
  const { data: trackingEvents = [], refetch: refetchTracking } = useQuery({
    queryKey: ['orders', 'tracking', order.id],
    queryFn: () => getOrderTracking(order.id),
    enabled: canAddTracking,
  });

  const handleAddTrackingEvent = async () => {
    setTrackingError('');
    setAddingTracking(true);
    let lat = null;
    let lng = null;
    if (addTrackingWithLocation && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) {
        setTrackingError('Could not get your location. Add without location?');
        setAddingTracking(false);
        return;
      }
    }
    try {
      await addOrderTrackingEvent(order.id, {
        eventType: trackingEventType,
        note: trackingNote.trim() || undefined,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
      });
      setTrackingNote('');
      setAddTrackingWithLocation(false);
      refetchTracking();
      onStatusUpdate?.(order.id);
    } catch (err) {
      setTrackingError(getApiErrorMessage(err, 'Failed to add tracking update'));
    } finally {
      setAddingTracking(false);
    }
  };

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
      <div className="business-orders-card-header">
        <div style={{ flex: 1 }}>
          <div className="business-orders-card-title-row">
            <h3 className="business-orders-card-title">
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
              className="business-orders-status-dropdown"
            >
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className="business-orders-status-dropdown-btn"
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
            <div className="business-orders-updating">
              <Loader2 size={16} className="icon-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Client information */}
      <div className="business-orders-block">
        <h4 className="business-orders-block-title">
          <User size={18} />
          Client information
        </h4>
        <div className="business-orders-block-content">
          <div className="business-orders-row">
            <span className="business-orders-label">Name:</span>
            <span className="business-orders-value">{order.deliveryName || order.buyer?.name || '—'}</span>
          </div>
          <div className="business-orders-row">
            <span className="business-orders-label">Phone:</span>
            {(order.deliveryPhone || order.buyer?.phone) ? (
              <a href={`tel:${order.deliveryPhone || order.buyer?.phone}`} className="business-orders-link">
                <Phone size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {order.deliveryPhone || order.buyer?.phone}
              </a>
            ) : (
              <span className="business-orders-muted">—</span>
            )}
          </div>
          {order.deliveryAddress && (
            <div className="business-orders-row business-orders-row-col">
              <span className="business-orders-label">Address:</span>
              <span className="business-orders-value business-orders-address">
                <MapPin size={14} style={{ flexShrink: 0 }} />
                {order.deliveryAddress}
                {(order.deliveryRegion || order.deliveryDistrict) && (
                  <span className="business-orders-muted">
                    {order.deliveryDistrict && `${order.deliveryDistrict}, `}{order.deliveryRegion}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Number Input */}
      {showTrackingInput && (
        <div className="business-orders-input-block">
          <label className="business-orders-input-label">Tracking Number</label>
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
        <div className="business-orders-input-block">
          <label className="business-orders-input-label">Seller Notes (Optional)</label>
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
        <div className="business-orders-section">
          <h4 className="business-orders-section-title">Items</h4>
          <div className="business-orders-items">
            {order.items.map((item, idx) => (
              <div key={idx} className="business-orders-item-row">
                <div style={{ flex: 1 }}>
                  <p className="business-orders-item-name">{item.productName || 'Product'}</p>
                  <p className="business-orders-item-meta">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice || item.unitPrice)}
                  </p>
                </div>
                <span className="business-orders-item-total">
                  {formatCurrency(item.total || (item.unitPrice * item.quantity))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="business-orders-summary">
        <div className="business-orders-summary-row">
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal || order.total)}</span>
        </div>
        {order.deliveryFee && order.deliveryFee > 0 && (
          <div className="business-orders-summary-row">
            <span>Delivery Fee</span>
            <span>{formatCurrency(order.deliveryFee)}</span>
          </div>
        )}
        <div className="business-orders-summary-total">
          <span>Total</span>
          <span className="business-orders-total-amount">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Seller (your business) contact */}
      {order.business && (order.business.phone || order.business.email || order.business.website || order.business.region) && (
        <div className="business-orders-section">
          <h4 className="business-orders-block-title">
            <Building2 size={18} className="business-orders-icon-primary" />
            Seller contact
          </h4>
          <div className="business-orders-seller-block">
            {order.business.name && <div className="business-orders-seller-name">{order.business.name}</div>}
            {order.business.phone && (
              <a href={`tel:${order.business.phone}`} className="business-orders-link">
                <Phone size={14} /> {order.business.phone}
              </a>
            )}
            {order.business.email && (
              <a href={`mailto:${order.business.email}`} className="business-orders-link">
                <Mail size={14} /> {order.business.email}
              </a>
            )}
            {order.business.website && (
              <a href={order.business.website.startsWith('http') ? order.business.website : `https://${order.business.website}`} target="_blank" rel="noopener noreferrer" className="business-orders-link">
                <Globe size={14} /> {order.business.website}
              </a>
            )}
            {(order.business.region || order.business.district) && (
              <div className="business-orders-muted business-orders-row" style={{ alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} /> {[order.business.region, order.business.district].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {order.trackingNumber && (
        <div className="business-orders-extra">
          <div className="business-orders-muted business-orders-row" style={{ alignItems: 'center', gap: '8px' }}>
            <Truck size={16} />
            <span><strong>Tracking:</strong> {order.trackingNumber}</span>
          </div>
        </div>
      )}
      {order.sellerNotes && (
        <div className="business-orders-extra">
          <p className="business-orders-muted" style={{ margin: 0 }}>
            <strong>Notes:</strong> {order.sellerNotes}
          </p>
        </div>
      )}

      {/* Tracking updates – status timeline + add event with optional location */}
      {canAddTracking && (
        <div className="business-orders-section" style={{ marginTop: 16 }}>
          <h4 className="business-orders-block-title">
            <Truck size={18} />
            Track mzigo (updates for customer)
          </h4>
          {Array.isArray(trackingEvents) && trackingEvents.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                {trackingEvents.map((ev, idx) => (
                  <div key={ev.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Truck size={16} style={{ color: 'var(--business-primary-light)', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <span style={{ fontWeight: 600 }}>{ev.eventType?.replace(/_/g, ' ')}</span>
                      {ev.note && <span style={{ opacity: 0.9 }}> – {ev.note}</span>}
                      {ev.createdAt && (
                        <div style={{ fontSize: '0.8125rem', opacity: 0.8, marginTop: 2 }}>{formatDate(ev.createdAt)}</div>
                      )}
                      {ev.latitude != null && ev.longitude != null && (
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Location: {ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label className="business-orders-input-label">Status update</label>
              <select
                value={trackingEventType}
                onChange={(e) => setTrackingEventType(e.target.value)}
                className="business-input"
                style={{ minWidth: 140 }}
              >
                {TRACKING_EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="business-orders-input-label">Note (optional)</label>
              <input
                type="text"
                value={trackingNote}
                onChange={(e) => setTrackingNote(e.target.value)}
                placeholder="e.g. Left store, on the way"
                className="business-input"
                style={{ width: '100%' }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={addTrackingWithLocation}
                onChange={(e) => setAddTrackingWithLocation(e.target.checked)}
              />
              <MapPinned size={16} />
              Add my location (for map)
            </label>
            <button
              type="button"
              onClick={handleAddTrackingEvent}
              disabled={addingTracking}
              className="business-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {addingTracking ? <Loader2 size={18} className="icon-spin" /> : <Plus size={18} />}
              Add update
            </button>
          </div>
          {trackingError && (
            <p style={{ marginTop: 8, fontSize: '0.875rem', color: '#f87171' }}>{trackingError}</p>
          )}
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
          <p className="business-orders-subtitle">
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
        <div className="business-card business-orders-error-card">
          <div className="business-orders-error-content">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      {orders.content.length === 0 ? (
        <div className="business-card business-orders-empty-card">
          <Package size={64} className="business-orders-empty-icon" />
          <h2 className="business-orders-empty-title">
            No orders yet
          </h2>
          <p className="business-orders-empty-desc">
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
