import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package as PackageIcon, Search, Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getAdminProducts, setProductActive, deleteProduct, getAdminBusinesses } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

function formatCurrency(n) {
  if (n == null) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size,
        ...(businessFilter && { businessId: businessFilter }),
        ...(activeFilter !== '' && { active: activeFilter === 'true' }),
        ...(searchTerm && { search: searchTerm }),
      };
      const res = await getAdminProducts(params);
      setProducts(res?.content || []);
      setTotalPages(res?.totalPages || 0);
      setTotalElements(res?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  }, [page, size, businessFilter, activeFilter, searchTerm]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    getAdminBusinesses({ size: 500 }).then((r) => setBusinesses(r?.content || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => { e.preventDefault(); setPage(0); loadProducts(); };

  const handleToggleActive = async (productId, currentActive) => {
    setError('');
    setSuccess('');
    try {
      await setProductActive(productId, !currentActive);
      setSuccess(currentActive ? 'Product deactivated' : 'Product activated');
      loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update product'));
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Deactivate this product? It will be hidden from marketplace.')) return;
    setError('');
    setSuccess('');
    try {
      await deleteProduct(productId);
      setSuccess('Product deactivated');
      loadProducts();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete product'));
    }
  };

  return (
    <div>
      <AdminPageHeader title="Products" subtitle="Manage all marketplace products" icon={PackageIcon} />

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-input"
              style={{ paddingLeft: 40 }}
            />
          </div>
          <select
            value={businessFilter}
            onChange={(e) => { setBusinessFilter(e.target.value); setPage(0); }}
            style={{ padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.875rem' }}
          >
            <option value="">All businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value); setPage(0); }}
            style={{ padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.875rem' }}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button type="submit" className="admin-btn-primary">Search</button>
        </form>
      </div>

      {error && <div className="admin-card" style={{ marginBottom: 16, padding: 12, background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 8 }}>{error}</div>}
      {success && <div className="admin-card" style={{ marginBottom: 16, padding: 12, background: 'rgba(34,197,94,0.1)', color: '#34d399', borderRadius: 8 }}>{success}</div>}

      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.6)' }}>Loading...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.6)' }}>No products found</div>
        ) : (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Products</h2>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Total: {totalElements}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Business</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {p.thumbnail ? (
                            <img src={p.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <PackageIcon size={20} color="#818cf8" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{p.name}</div>
                            {p.category && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{p.category}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{p.business?.name || 'N/A'}</td>
                      <td>{formatCurrency(p.price)}</td>
                      <td>{p.stockQuantity ?? 'N/A'}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: p.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(107,114,128,0.2)',
                          color: p.isActive ? '#34d399' : '#94a3b8',
                        }}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Link to={`/app/shop/${p.id}`} className="admin-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}>
                            <Eye size={14} /> View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(p.id, p.isActive)}
                            className="admin-btn-ghost"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            title={p.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {p.isActive ? <ToggleRight size={14} style={{ color: '#34d399' }} /> : <ToggleLeft size={14} />}
                            {p.isActive ? 'On' : 'Off'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="admin-btn-ghost"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#f87171' }}
                            title="Deactivate / Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
    </div>
  );
}
