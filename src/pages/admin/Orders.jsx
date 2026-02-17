import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag as ShoppingBagIcon, Search, Eye } from 'lucide-react';
import { getAdminOrders, getAdminOrderById, updateOrderStatus } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

function formatCurrency(n) {
  if (n == null) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, size, ...(statusFilter && { status: statusFilter }) };
      const res = await getAdminOrders(params);
      setOrders(res?.content || []);
      setTotalPages(res?.totalPages || 0);
      setTotalElements(res?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleSearch = (e) => { e.preventDefault(); setPage(0); loadOrders(); };

  const openDetail = async (orderId) => {
    try {
      const order = await getAdminOrderById(orderId);
      setDetailModal(order);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load order'));
    }
  };

  const handleStatusChange = async (orderId, newStatus, trackingNumber = null) => {
    setStatusUpdating(orderId);
    setError('');
    setSuccess('');
    try {
      await updateOrderStatus(orderId, {
        status: newStatus,
        ...(trackingNumber && { trackingNumber }),
      });
      setSuccess('Order status updated');
      loadOrders();
      if (detailModal?.id === orderId) setDetailModal(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update status'));
    } finally {
      setStatusUpdating(null);
    }
  };

  const getStatusColor = (s) => {
    const map = { PENDING: '#fbbf24', CONFIRMED: '#3b82f6', SHIPPED: '#8b5cf6', DELIVERED: '#22c55e', COMPLETED: '#22c55e', CANCELLED: '#ef4444', REFUNDED: '#6b7280' };
    return map[s] || '#94a3b8';
  };

  return (
    <div>
      <AdminPageHeader title="Orders" subtitle="View and manage all orders" icon={ShoppingBagIcon}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            style={{
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '0.875rem',
            }}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="admin-btn-primary" style={{ padding: '8px 16px' }}>
            <Search size={16} /> Apply
          </button>
        </form>
      </AdminPageHeader>

      {error && <div className="admin-card" style={{ marginBottom: 16, padding: 12, background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 8 }}>{error}</div>}
      {success && <div className="admin-card" style={{ marginBottom: 16, padding: 12, background: 'rgba(34,197,94,0.1)', color: '#34d399', borderRadius: 8 }}>{success}</div>}

      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.6)' }}>Loading...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.6)' }}>No orders found</div>
        ) : (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Orders</h2>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Total: {totalElements}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Buyer</th>
                    <th>Business</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{o.orderNumber || o.id?.slice(0, 8)}</td>
                      <td>
                        {o.buyer ? (
                          <Link to={`/app/profile/${o.buyer.id}`} style={{ color: '#818cf8', textDecoration: 'none' }}>
                            {o.buyer.name}
                          </Link>
                        ) : 'N/A'}
                      </td>
                      <td>{o.business?.name || 'N/A'}</td>
                      <td>{formatCurrency(o.total)}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${getStatusColor(o.status)}22`,
                          color: getStatusColor(o.status),
                        }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openDetail(o.id)}
                          className="admin-btn-ghost"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <Eye size={14} /> View
                        </button>
                        {o.status !== 'CANCELLED' && o.status !== 'COMPLETED' && o.status !== 'REFUNDED' && (
                          <div style={{ marginTop: 4 }}>
                            <select
                              value=""
                              onChange={(e) => { const v = e.target.value; if (v) handleStatusChange(o.id, v); }}
                              disabled={!!statusUpdating}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                background: 'rgba(15,23,42,0.6)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 6,
                                color: '#e2e8f0',
                              }}
                            >
                              <option value="">Update status</option>
                              {STATUS_OPTIONS.filter((s) => s !== o.status).map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="admin-btn-ghost">Previous</button>
                <span style={{ color: 'rgba(255,255,255,0.7)', alignSelf: 'center' }}>Page {page + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="admin-btn-ghost">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {detailModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setDetailModal(null)}
        >
          <div
            className="admin-card"
            style={{ maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Order {detailModal.orderNumber}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.875rem' }}>
              <div><strong>Status:</strong> <span style={{ color: getStatusColor(detailModal.status) }}>{detailModal.status}</span></div>
              <div><strong>Buyer:</strong> {detailModal.buyer?.name} ({detailModal.buyer?.phone})</div>
              <div><strong>Business:</strong> {detailModal.business?.name}</div>
              <div><strong>Total:</strong> {formatCurrency(detailModal.total)}</div>
              {detailModal.items?.length > 0 && (
                <div>
                  <strong>Items:</strong>
                  <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                    {detailModal.items.map((i, idx) => (
                      <li key={idx}>{i.productName} x{i.quantity} = {formatCurrency(i.total)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div><strong>Delivery:</strong> {detailModal.deliveryName}, {detailModal.deliveryPhone}</div>
              {detailModal.deliveryAddress && <div>{detailModal.deliveryAddress}, {detailModal.deliveryRegion}</div>}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].filter((s) => s !== detailModal.status).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(detailModal.id, s)}
                  disabled={!!statusUpdating}
                  className="admin-btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  Set {s}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setDetailModal(null)} className="admin-btn-ghost" style={{ marginTop: 16, width: '100%' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
