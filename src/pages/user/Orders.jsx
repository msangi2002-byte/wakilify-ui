import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Package, Loader2, RefreshCw, CheckCircle, Truck, MapPin, Calendar, AlertCircle, X, ShoppingBag, Building2, Phone, User as UserIcon, Mail, Globe, MessageCircle } from 'lucide-react';
import { getMyOrders, getOrderById, cancelOrder, confirmOrder, getOrderTracking } from '@/lib/api/orders';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { OrdersListSkeleton } from '@/components/ui/OrdersListSkeleton';
import { OrdersDetailSkeleton } from '@/components/ui/OrdersDetailSkeleton';
import 'leaflet/dist/leaflet.css';
import '@/styles/user-app.css';

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

// Fit map bounds to markers (used inside MapContainer)
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
  }, [map, points]);
  return null;
}

function OrderCard({ order, onOrderUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  const { data: orderDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['orders', 'detail', order.id],
    queryFn: () => getOrderById(order.id),
    enabled: expanded,
  });

  const { data: trackingEvents = [] } = useQuery({
    queryKey: ['orders', 'tracking', order.id],
    queryFn: () => getOrderTracking(order.id),
    enabled: expanded && ['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(orderDetails?.status || order.status),
  });

  const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.PENDING;
  const canCancel = ['PENDING', 'CONFIRMED', 'DRAFT', 'PENDING_CONFIRMATION'].includes(order.status);
  const canConfirm = order.status === 'DRAFT' || order.status === 'PENDING_CONFIRMATION';
  const canTrack = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status);

  const handleExpand = () => {
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

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirmOrder(order.id);
      onOrderUpdate?.();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to confirm order'));
    } finally {
      setConfirming(false);
    }
  };

  const orderData = orderDetails ?? order;
  const canTrackOrder = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(orderData?.status || order.status);

  useEffect(() => {
    if (!expanded || !canTrackOrder || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [expanded, canTrackOrder]);

  const trackingPointsWithLocation = Array.isArray(trackingEvents) ? trackingEvents.filter((ev) => ev.latitude != null && ev.longitude != null) : [];
  const mapPoints = [
    ...trackingPointsWithLocation.map((ev) => ({ lat: ev.latitude, lng: ev.longitude })),
    ...(userLocation ? [userLocation] : []),
  ];
  const mapCenter = mapPoints.length > 0
    ? mapPoints.reduce((a, p) => ({ lat: a.lat + p.lat, lng: a.lng + p.lng }), { lat: 0, lng: 0 })
    : { lat: -6.369, lng: 34.8888 };
  if (mapPoints.length > 0) {
    mapCenter.lat /= mapPoints.length;
    mapCenter.lng /= mapPoints.length;
  }

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
          {canConfirm && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="orders-card-btn orders-card-btn-primary"
              style={{ background: '#0d9488' }}
            >
              {confirming ? <Loader2 size={16} className="icon-spin" /> : <CheckCircle size={16} />}
              Confirm order
            </button>
          )}
          {canTrack && (
            <button type="button" onClick={handleExpand} className="orders-card-btn orders-card-btn-outline">
              <MapPin size={16} />
              Track
            </button>
          )}
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
            <OrdersDetailSkeleton />
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

              {Array.isArray(trackingEvents) && trackingEvents.length > 0 && (
                <div className="orders-card-section">
                  <h4 className="orders-card-section-title">
                    <MapPin size={18} style={{ color: '#6366f1' }} />
                    Tracking
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                    {trackingEvents.map((ev, idx) => (
                      <div key={ev.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Truck size={16} style={{ color: '#6366f1', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <span style={{ fontWeight: 600 }}>{ev.eventType?.replace(/_/g, ' ')}</span>
                          {ev.note && <span style={{ color: '#65676b' }}> - {ev.note}</span>}
                          {ev.createdAt && (
                            <div style={{ fontSize: '0.8125rem', color: '#9ca3af', marginTop: '2px' }}>{formatDate(ev.createdAt)}</div>
                          )}
                          {ev.latitude != null && ev.longitude != null && (
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Location: {ev.latitude.toFixed(4)}, {ev.longitude.toFixed(4)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canTrackOrder && (trackingPointsWithLocation.length > 0 || userLocation) && (
                <div className="orders-card-section">
                  <h4 className="orders-card-section-title">Track mzigo – map</h4>
                  <div style={{ height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <MapContainer
                      center={[mapCenter.lat, mapCenter.lng]}
                      zoom={mapPoints.length === 1 ? 12 : 10}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {mapPoints.length > 0 && <FitBounds points={mapPoints} />}
                      {trackingPointsWithLocation.map((ev, idx) => (
                        <Marker
                          key={ev.id || idx}
                          position={[ev.latitude, ev.longitude]}
                          icon={L.divIcon({
                            className: 'orders-tracking-marker',
                            html: `<div style="width:28px;height:28px;border-radius:50%;background:#6366f1;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${(idx + 1)}</div>`,
                            iconSize: [28, 28],
                            iconAnchor: [14, 14],
                          })}
                        >
                          <Popup>
                            <strong>{ev.eventType?.replace(/_/g, ' ')}</strong>
                            {ev.note && <div>{ev.note}</div>}
                            {ev.createdAt && <div style={{ fontSize: 12, color: '#6b7280' }}>{formatDate(ev.createdAt)}</div>}
                          </Popup>
                        </Marker>
                      ))}
                      {userLocation && (
                        <Marker
                          position={[userLocation.lat, userLocation.lng]}
                          icon={L.divIcon({
                            className: 'orders-tracking-marker-you',
                            html: '<div style="width:32px;height:32px;border-radius:50%;background:#22c55e;color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);">You</div>',
                            iconSize: [32, 32],
                            iconAnchor: [16, 16],
                          })}
                        >
                          <Popup><strong>You are here</strong></Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                  {userLocation && (
                    <p style={{ marginTop: 8, fontSize: '0.8125rem', color: '#6b7280' }}>
                      Your location is used only to show you on the map. Mteja anaweza kuona mwendo wa mzigo kwa updates za seller.
                    </p>
                  )}
                </div>
              )}

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

function normalizeOrdersResponse(data) {
  if (!data) return { content: [], totalElements: 0 };
  const content = Array.isArray(data.content) ? data.content : [];
  const totalElements = data.totalElements ?? content.length;
  return { content, totalElements };
}

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    data: ordersData,
    isLoading: loading,
    error: ordersError,
    refetch,
  } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => {
      const params = { page: 0, size: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;
      return getMyOrders(params);
    },
    select: normalizeOrdersResponse,
  });

  const orders = ordersData ?? { content: [], totalElements: 0 };
  const error = ordersError ? getApiErrorMessage(ordersError, 'Failed to load orders') : '';

  const handleOrderUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div>
          <h1 className="orders-header-title">
            <Package size={32} />
            My Orders
          </h1>
          <p className="orders-header-sub">
            {loading ? '—' : `${orders.totalElements} ${orders.totalElements === 1 ? 'order' : 'orders'}`}
          </p>
        </div>
        <div className="orders-header-actions">
          <button type="button" onClick={() => navigate('/app/shop')} className="orders-btn orders-btn-primary">
            <ShoppingBag size={18} />
            Shop Now
          </button>
          <button type="button" onClick={() => refetch()} disabled={loading} className="orders-btn orders-btn-secondary">
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

      {loading ? (
        <OrdersListSkeleton cards={4} />
      ) : orders.content.length === 0 ? (
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
