import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users as UsersIcon, Search, Eye, Mail, Phone, Shield, CheckCircle, XCircle } from 'lucide-react';
import { getAdminUsers } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size,
        ...(roleFilter && { role: roleFilter }),
        ...(activeFilter !== '' && { isActive: activeFilter === 'true' }),
        ...(searchTerm && { search: searchTerm }),
      };
      const response = await getAdminUsers(params);
      setUsers(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [page, size, roleFilter, activeFilter, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadUsers();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      case 'AGENT':
        return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
      case 'BUSINESS':
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
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
              Users Management
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Manage and view all users in the system
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
            <UsersIcon size={28} />
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
              placeholder="Search by name, email, or phone..."
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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
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
            <option value="">All Roles</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="AGENT">AGENT</option>
            <option value="BUSINESS">BUSINESS</option>
            <option value="VISITOR">VISITOR</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
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
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            No users found
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="admin-card-title">Users List</h2>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                Total: {totalElements} users
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      User
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Contact
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Role
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Joined
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleStyle = getRoleBadgeColor(user.role);
                    const userId = user?.id ? String(user.id) : null;
                    const userIdDisplay = userId ? (userId.length > 8 ? userId.substring(0, 8) + '...' : userId) : 'N/A';
                    
                    return (
                      <tr
                        key={user.id || Math.random()}
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
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '16px',
                              overflow: 'hidden',
                            }}>
                              {user.profilePic ? (
                                <img src={user.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                (user.name || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>
                                {user.name || 'Unknown User'}
                                {user.isVerified && (
                                  <CheckCircle size={16} style={{ marginLeft: '6px', color: '#3b82f6', display: 'inline-block', verticalAlign: 'middle' }} />
                                )}
                              </div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                                ID: {userIdDisplay}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {user.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                                <Mail size={14} />
                                {user.email}
                              </div>
                            )}
                            {user.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                                <Phone size={14} />
                                {user.phone}
                              </div>
                            )}
                            {!user.email && !user.phone && (
                              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                                No contact info
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: roleStyle.bg,
                            color: roleStyle.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            <Shield size={12} />
                            {user.role || 'USER'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {user.isActive ? (
                              <>
                                <CheckCircle size={16} style={{ color: '#22c55e' }} />
                                <span style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 500 }}>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={16} style={{ color: '#ef4444' }} />
                                <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>Inactive</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          {userId ? (
                            <Link
                              to={`/app/profile/${userId}`}
                              className="admin-btn-ghost"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                textDecoration: 'none',
                              }}
                            >
                              <Eye size={16} />
                              View
                            </Link>
                          ) : (
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                              N/A
                            </span>
                          )}
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
