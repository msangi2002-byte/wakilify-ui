import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users as UsersIcon, Search, Eye, Mail, Phone, Shield, CheckCircle, XCircle, UserPlus, UserMinus, BadgeCheck, Ban, Download, LogIn, MapPin, FileText, UsersRound, X, BarChart3, Globe } from 'lucide-react';
import { getAdminUsers, getAdminUserDetail, getAudienceAnalytics, updateUserStatus, updateUserRole, verifyUser, exportUsersCsv, impersonateUser, setUserAdminRole, createAdminUser } from '@/lib/api/admin';
import { openImpersonateSession } from '@/pages/auth/Impersonate';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { showAdminToast } from '@/lib/adminToast';
import { useAuthStore } from '@/store/auth.store';
import { getEffectiveAdminRole, ADMIN_ROLES, ADMIN_ROLE_LABELS } from '@/lib/adminRoles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const ROLES = ['USER', 'BUSINESS', 'AGENT', 'ADMIN', 'VISITOR'];

export default function Users() {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = getEffectiveAdminRole(currentUser) === 'SUPER_ADMIN';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [roleModal, setRoleModal] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', password: '', role: 'USER', adminRole: 'SUPER_ADMIN' });
  const [createLoading, setCreateLoading] = useState(false);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [detailModal, setDetailModal] = useState({ open: false, userId: null, data: null, loading: false });
  const [mainTab, setMainTab] = useState('list'); // 'list' | 'analytics'
  const [analyticsTab, setAnalyticsTab] = useState('continent'); // 'continent' | 'country' | 'region'
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsFrom, setAnalyticsFrom] = useState('');
  const [analyticsTo, setAnalyticsTo] = useState('');

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

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const params = {};
      if (analyticsFrom) params.fromDate = analyticsFrom;
      if (analyticsTo) params.toDate = analyticsTo;
      const data = await getAudienceAnalytics(params);
      setAnalytics(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load analytics'));
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsFrom, analyticsTo]);

  useEffect(() => {
    if (mainTab === 'analytics') loadAnalytics();
  }, [mainTab, loadAnalytics]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadUsers();
  };

  const handleStatusChange = async (user, newActive) => {
    setError('');
    setSuccess('');
    try {
      await updateUserStatus(user.id, newActive, 'Admin action');
      const msg = newActive ? 'User activated' : 'User deactivated';
      setSuccess(msg);
      showAdminToast(msg, 'success');
      loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update status'));
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setSuccess('');
    try {
      await updateUserRole(userId, newRole, 'Admin action');
      setSuccess('Role updated');
      showAdminToast('Role updated', 'success');
      setRoleModal(null);
      loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update role'));
    }
  };

  const handleVerify = async (user) => {
    setError('');
    setSuccess('');
    try {
      await verifyUser(user.id);
      setSuccess('User verified (Blue Tick)');
      showAdminToast('User verified (Blue Tick)', 'success');
      loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to verify user'));
    }
  };

  const handleBan = async (user) => {
    setError('');
    setSuccess('');
    try {
      await updateUserStatus(user.id, false, 'Banned by admin');
      setSuccess('User banned');
      showAdminToast('User banned', 'success');
      loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to ban user'));
    }
  };

  const handleExportCsv = async () => {
    setError('');
    try {
      await exportUsersCsv();
      setSuccess('CSV exported');
      showAdminToast('CSV exported', 'success');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to export CSV'));
    }
  };

  const handleAdminRoleChange = async (userId, adminRole) => {
    setError('');
    setSuccess('');
    try {
      await setUserAdminRole(userId, adminRole);
      setSuccess('Admin role updated');
      showAdminToast('Admin role updated', 'success');
      loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update admin role'));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!createForm.name.trim() || !createForm.phone.trim() || !createForm.password.trim()) {
      setError('Name, phone and password are required');
      return;
    }
    setCreateLoading(true);
    try {
      const body = { name: createForm.name.trim(), phone: createForm.phone.trim(), password: createForm.password, role: createForm.role };
      if (createForm.email?.trim()) body.email = createForm.email.trim();
      if (createForm.role === 'ADMIN') body.adminRole = createForm.adminRole;
      const created = await createAdminUser(body);
      setSuccess(`User "${created?.name}" created. They can log in with phone/email and password.`);
      showAdminToast('User created', 'success');
      setCreateModal(false);
      setCreateForm({ name: '', phone: '', email: '', password: '', role: 'USER', adminRole: 'SUPER_ADMIN' });
      loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create user'));
    } finally {
      setCreateLoading(false);
    }
  };

  const openUserDetail = async (user) => {
    if (!user?.id) return;
    setDetailModal({ open: true, userId: user.id, data: null, loading: true });
    try {
      const data = await getAdminUserDetail(user.id);
      setDetailModal((m) => ({ ...m, data, loading: false }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load user details'));
      setDetailModal((m) => ({ ...m, loading: false }));
    }
  };

  const closeUserDetail = () => setDetailModal({ open: false, userId: null, data: null, loading: false });

  const handleAccessAccount = async (user) => {
    setError('');
    try {
      const auth = await impersonateUser(user.id);
      openImpersonateSession(auth);
      setSuccess('Opened account in new tab');
      showAdminToast('Opened account in new tab', 'success');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to access account'));
    }
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

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setMainTab('list')}
            className={mainTab === 'list' ? 'admin-btn-primary' : 'admin-btn-ghost'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
          >
            <UsersIcon size={18} />
            Users List
          </button>
          <button
            type="button"
            onClick={() => setMainTab('analytics')}
            className={mainTab === 'analytics' ? 'admin-btn-primary' : 'admin-btn-ghost'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>

        {mainTab === 'list' && (
        <>
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
          {isSuperAdmin && (
            <>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setCreateModal(true)}
              >
                <UserPlus size={18} />
                Create user
              </button>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
                onClick={handleExportCsv}
              >
                <Download size={18} />
                Export CSV
              </button>
            </>
          )}
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
        {success && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            color: '#22c55e',
            marginBottom: '24px',
          }}>
            {success}
          </div>
        )}
        </>
        )}
      </div>

      {mainTab === 'list' && (
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
                      Admin role
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
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        onClick={() => openUserDetail(user)}
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
                            {user.role === 'ADMIN' ? (
                              isSuperAdmin ? (
                                <select
                                  value={user.adminRole || 'SUPER_ADMIN'}
                                  onChange={(e) => handleAdminRoleChange(user.id, e.target.value)}
                                  style={{
                                    padding: '6px 10px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {ADMIN_ROLES.map((r) => (
                                    <option key={r} value={r}>{ADMIN_ROLE_LABELS[r] || r}</option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.8rem' }}>
                                  {ADMIN_ROLE_LABELS[user.adminRole || 'SUPER_ADMIN'] || user.adminRole || 'Super Admin'}
                                </span>
                              )
                            ) : (
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.8rem' }}>—</span>
                            )}
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
                        <td style={{ padding: '16px 12px' }} onClick={(e) => e.stopPropagation()}>
                          {userId ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleAccessAccount(user)}
                                  className="admin-btn-primary"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
                                  title="Access account (open as user)"
                                >
                                  <LogIn size={14} />
                                  Access Account
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openUserDetail(user)}
                                className="admin-btn-ghost"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
                                title="View full details"
                              >
                                <Eye size={14} />
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(user, !user.isActive)}
                                className="admin-btn-ghost"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {user.isActive ? <UserMinus size={14} /> : <UserPlus size={14} />}
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRoleModal({ id: user.id, name: user.name, currentRole: user.role })}
                                className="admin-btn-ghost"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
                                title="Change Role"
                              >
                                <Shield size={14} />
                                Role
                              </button>
                              {!user.isVerified && (
                                <button
                                  type="button"
                                  onClick={() => handleVerify(user)}
                                  className="admin-btn-ghost"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
                                  title="Verify (Blue Tick)"
                                >
                                  <BadgeCheck size={14} />
                                  Verify
                                </button>
                              )}
                              {user.isActive && (
                                <button
                                  type="button"
                                  onClick={() => handleBan(user)}
                                  className="admin-btn-ghost"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444' }}
                                  title="Ban user"
                                >
                                  <Ban size={14} />
                                  Ban
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>N/A</span>
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
      )}

      {mainTab === 'analytics' && (
        <div className="admin-card" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 24 }}>
            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>From</label>
            <input
              type="date"
              value={analyticsFrom}
              onChange={(e) => setAnalyticsFrom(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.875rem',
              }}
            />
            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>To</label>
            <input
              type="date"
              value={analyticsTo}
              onChange={(e) => setAnalyticsTo(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.875rem',
              }}
            />
            <button type="button" onClick={loadAnalytics} className="admin-btn-primary" style={{ padding: '8px 16px' }}>
              Apply
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { id: 'continent', label: 'Continent', icon: Globe },
              { id: 'country', label: 'Country', icon: MapPin },
              { id: 'region', label: 'Region (Mkoa)', icon: MapPin },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAnalyticsTab(id)}
                className={analyticsTab === id ? 'admin-btn-primary' : 'admin-btn-ghost'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px' }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {analyticsLoading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.7)' }}>Loading analytics...</div>
          ) : analytics ? (
            <>
              <div style={{ marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{
                  padding: 16,
                  background: 'rgba(124, 58, 237, 0.15)',
                  borderRadius: 12,
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  minWidth: 160,
                }}>
                  <div style={{ color: '#a78bfa', fontSize: '0.8rem', marginBottom: 4 }}>Total Users</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.75rem' }}>
                    {analytics.totalUsers?.toLocaleString?.() ?? 0}
                  </div>
                </div>
              </div>

              {(() => {
                const data = analyticsTab === 'continent' ? analytics.byContinent : analyticsTab === 'country' ? analytics.byCountry : analytics.byRegion;
                const chartData = (data || []).slice(0, 12).map(({ name, count }) => ({ name: name || 'Unknown', count }));
                const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#6366f1', '#4f46e5', '#818cf8', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#94a3b8'];
                if (!chartData.length) {
                  return <div style={{ color: 'rgba(255,255,255,0.5)', padding: 24, textAlign: 'center' }}>No data for this view</div>;
                }
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h4 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '1rem' }}>
                        By {analyticsTab === 'continent' ? 'Continent' : analyticsTab === 'country' ? 'Country' : 'Region'}
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                          <YAxis dataKey="name" type="category" width={70} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                          <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h4 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '1rem' }}>Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}
            </>
          ) : null}
        </div>
      )}

      {roleModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setRoleModal(null)}
        >
          <div
            className="admin-card"
            style={{ maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Change Role</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontSize: '0.9rem' }}>
              {roleModal.name} – current: {roleModal.currentRole}
            </p>
            {roleModal.currentRole === 'ADMIN' && (
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px', fontSize: '0.8rem' }}>
                Admin sub-role (Super Admin, Moderator, Support, Finance) is set in the <strong>Admin role</strong> column in the table.
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {ROLES.filter((r) => r !== roleModal.currentRole).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(roleModal.id, role)}
                  className="admin-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                >
                  {role}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setRoleModal(null)} className="admin-btn-ghost" style={{ width: '100%' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {detailModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-detail-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={closeUserDetail}
        >
          <div
            className="admin-card"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeUserDetail}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {detailModal.loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                Loading user details...
              </div>
            ) : detailModal.data ? (
              <>
                <h2 id="user-detail-title" style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.25rem' }}>
                  User Details
                </h2>

                <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    {detailModal.data.profilePic ? (
                      <img src={detailModal.data.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28 }}>
                        {(detailModal.data.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>
                      {detailModal.data.name}
                      {detailModal.data.isVerified && <CheckCircle size={18} style={{ marginLeft: 6, color: '#3b82f6', verticalAlign: 'middle' }} />}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: getRoleBadgeColor(detailModal.data.role).bg,
                        color: getRoleBadgeColor(detailModal.data.role).color,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {detailModal.data.role}
                      </span>
                      {detailModal.data.isActive ? (
                        <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>Active</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Inactive</span>
                      )}
                      {detailModal.data.adminRole && (
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{detailModal.data.adminRole}</span>
                      )}
                    </div>
                    {detailModal.data.bio && (
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{detailModal.data.bio}</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                  <div style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ color: '#7c3aed', fontWeight: 700, fontSize: '1.25rem' }}>{detailModal.data.followersCount ?? 0}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Followers</div>
                  </div>
                  <div style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ color: '#7c3aed', fontWeight: 700, fontSize: '1.25rem' }}>{detailModal.data.followingCount ?? 0}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Following</div>
                  </div>
                  <div style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ color: '#7c3aed', fontWeight: 700, fontSize: '1.25rem' }}>{detailModal.data.postsCount ?? 0}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Posts</div>
                  </div>
                  <div style={{
                    padding: 16,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ color: '#7c3aed', fontWeight: 700, fontSize: '1.25rem' }}>{detailModal.data.communities?.length ?? 0}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Groups/Channels</div>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={18} />
                    Location
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {detailModal.data.country && (
                      <span style={{
                        padding: '8px 14px',
                        background: 'rgba(124, 58, 237, 0.2)',
                        borderRadius: 8,
                        color: '#a78bfa',
                        fontSize: '0.875rem',
                      }}>
                        Country: {detailModal.data.country}
                      </span>
                    )}
                    {detailModal.data.region && (
                      <span style={{
                        padding: '8px 14px',
                        background: 'rgba(124, 58, 237, 0.2)',
                        borderRadius: 8,
                        color: '#a78bfa',
                        fontSize: '0.875rem',
                      }}>
                        Mkoa: {detailModal.data.region}
                      </span>
                    )}
                    {detailModal.data.currentCity && (
                      <span style={{
                        padding: '8px 14px',
                        background: 'rgba(124, 58, 237, 0.2)',
                        borderRadius: 8,
                        color: '#a78bfa',
                        fontSize: '0.875rem',
                      }}>
                        City: {detailModal.data.currentCity}
                      </span>
                    )}
                    {!detailModal.data.country && !detailModal.data.region && !detailModal.data.currentCity && (
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>No location set</span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UsersRound size={18} />
                    Groups &amp; Channels
                  </h3>
                  {detailModal.data.communities && detailModal.data.communities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {detailModal.data.communities.map((c) => (
                        <div
                          key={c.communityId}
                          style={{
                            padding: 12,
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          <div>
                            <div style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>{c.name}</div>
                            <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                              <span>{c.type}</span>
                              <span>Role: {c.memberRole}</span>
                              {c.membersCount != null && <span>{c.membersCount} members</span>}
                              {c.joinedAt && <span>Joined {new Date(c.joinedAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          {c.memberRole === 'ADMIN' && (
                            <span style={{
                              padding: '4px 8px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#f87171',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}>
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Not in any group or channel</div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={18} />
                    Contact
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {detailModal.data.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)' }}>
                        <Mail size={16} />
                        {detailModal.data.email}
                      </div>
                    )}
                    {detailModal.data.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)' }}>
                        <Phone size={16} />
                        {detailModal.data.phone}
                      </div>
                    )}
                    {!detailModal.data.email && !detailModal.data.phone && (
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>No contact info</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
                  <Link
                    to={`/app/profile/${detailModal.data.id}`}
                    className="admin-btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                  >
                    <Eye size={16} />
                    View profile
                  </Link>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => { handleAccessAccount({ id: detailModal.data.id }); closeUserDetail(); }}
                      className="admin-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <LogIn size={16} />
                      Access account
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {createModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setCreateModal(false)}
        >
          <div
            className="admin-card"
            style={{ maxWidth: '420px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="create-user-title" style={{ margin: '0 0 16px 0', color: '#fff' }}>Create user</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '16px', fontSize: '0.875rem' }}>
              Create a new user. They can log in with phone/email and password.
            </p>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="admin-label" style={{ marginBottom: 6 }}>Name *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="admin-label" style={{ marginBottom: 6 }}>Phone *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+255..."
                  required
                />
              </div>
              <div>
                <label className="admin-label" style={{ marginBottom: 6 }}>Email (optional)</label>
                <input
                  type="email"
                  className="admin-input"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="admin-label" style={{ marginBottom: 6 }}>Password *</label>
                <input
                  type="password"
                  className="admin-input"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="admin-label" style={{ marginBottom: 6 }}>Role *</label>
                <select
                  className="admin-input"
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                  style={{ cursor: 'pointer' }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {createForm.role === 'ADMIN' && (
                <div>
                  <label className="admin-label" style={{ marginBottom: 6 }}>Admin role</label>
                  <select
                    className="admin-input"
                    value={createForm.adminRole}
                    onChange={(e) => setCreateForm((f) => ({ ...f, adminRole: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    {ADMIN_ROLES.map((r) => (
                      <option key={r} value={r}>{ADMIN_ROLE_LABELS[r] || r}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="admin-btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setCreateModal(false)} className="admin-btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
