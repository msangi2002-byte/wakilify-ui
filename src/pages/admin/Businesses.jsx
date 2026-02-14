import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Building2 as Building2Icon, Search, Eye, Mail, Phone, Shield, CheckCircle, XCircle, MapPin, User, Star } from 'lucide-react';
import { getAdminBusinesses, updateBusinessStatus, verifyBusiness } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

export default function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      };
      const response = await getAdminBusinesses(params);
      setBusinesses(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load businesses'));
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter, searchTerm]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadBusinesses();
  };

  const handleStatusChange = async (businessId, newStatus) => {
    try {
      await updateBusinessStatus(businessId, newStatus);
      loadBusinesses();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update business status'));
    }
  };

  const handleVerify = async (businessId) => {
    try {
      await verifyBusiness(businessId);
      loadBusinesses();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to verify business'));
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'PENDING':
        return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' };
      case 'SUSPENDED':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      case 'EXPIRED':
        return { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' };
      case 'INACTIVE':
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' };
      default:
        return { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
    }
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Businesses Management
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Manage and view all businesses in the system
            </p>
          </div>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'rgba(124, 58, 237, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed'
          }}>
            <Building2Icon size={28} />
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search by business name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(124, 58, 237, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="EXPIRED">Expired</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            type="submit"
            className="admin-btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            <Search size={18} />
            Search
          </button>
        </form>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '24px',
          }}>
            {error}
          </div>
        )}
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Loading businesses...
          </div>
        ) : businesses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            No businesses found
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="admin-card-title">Businesses List</h2>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                Total: {totalElements} businesses
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Business
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Owner
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Location
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Stats
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Created
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((business) => {
                    const statusStyle = getStatusBadgeColor(business.status);
                    const businessId = business?.id ? String(business.id) : null;
                    
                    return (
                      <tr
                        key={business.id || Math.random()}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '16px',
                              overflow: 'hidden',
                            }}>
                              {business.logo ? (
                                <img src={business.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Building2Icon size={20} />
                              )}
                            </div>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 500, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {business.name || 'Unknown Business'}
                                {business.isVerified && (
                                  <CheckCircle size={16} style={{ color: '#3b82f6', display: 'inline-block' }} />
                                )}
                              </div>
                              {business.category && (
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                                  {business.category}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          {business.owner ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <User size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                              <div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500 }}>
                                  {business.owner.name || 'Unknown Owner'}
                                </div>
                                {business.owner.id && (
                                  <Link
                                    to={`/app/profile/${business.owner.id}`}
                                    style={{ color: 'rgba(124, 58, 237, 0.8)', fontSize: '0.75rem', textDecoration: 'none' }}
                                  >
                                    View Profile
                                  </Link>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          {(business.region || business.district || business.ward) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                              <MapPin size={14} />
                              <div>
                                {[business.ward, business.district, business.region].filter(Boolean).join(', ') || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            <Shield size={12} />
                            {business.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                            {business.productsCount !== undefined && (
                              <div>Products: {business.productsCount}</div>
                            )}
                            {business.ordersCount !== undefined && (
                              <div>Orders: {business.ordersCount}</div>
                            )}
                            {business.followersCount !== undefined && (
                              <div>Followers: {business.followersCount}</div>
                            )}
                            {business.rating !== undefined && business.rating > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Star size={12} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                                {business.rating.toFixed(1)} ({business.reviewsCount || 0})
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                            {!business.isVerified && business.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleVerify(business.id)}
                                className="admin-btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Verify
                              </button>
                            )}
                            {business.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleStatusChange(business.id, 'SUSPENDED')}
                                className="admin-btn-ghost"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  color: '#ef4444',
                                }}
                              >
                                Suspend
                              </button>
                            )}
                            {business.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleStatusChange(business.id, 'ACTIVE')}
                                className="admin-btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="admin-btn-ghost"
                  style={{ opacity: page === 0 ? 0.5 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="admin-btn-ghost"
                  style={{ opacity: page >= totalPages - 1 ? 0.5 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
