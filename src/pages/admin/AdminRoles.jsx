import { useState, useEffect, useCallback } from 'react';
import { Shield, Lock, BarChart3, UserCircle, Wallet, UserPlus, Users, CheckCircle, XCircle, UserMinus, UserCheck, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getEffectiveAdminRole, ADMIN_ROLES, ADMIN_ROLE_LABELS, getAreasForRole, AREA_LABELS, ALL_AREA_KEYS, buildRoleMaps } from '@/lib/adminRoles';
import { createAdminUser, getAdminUsers, updateUserStatus, setUserAdminRole, getRoleDefinitions, createRoleDefinition, updateRoleDefinition, deleteRoleDefinition } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { showAdminToast } from '@/lib/adminToast';

/** Order for display: Super Admin, Moderator, Support, Finance */
const ROLE_ORDER = ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT_AGENT', 'FINANCE_MANAGER'];

const ROLE_ICONS = {
  SUPER_ADMIN: Shield,
  MODERATOR: BarChart3,
  SUPPORT_AGENT: UserCircle,
  FINANCE_MANAGER: Wallet,
};

export default function AdminRoles() {
  const { user } = useAuthStore();
  const currentRole = getEffectiveAdminRole(user);
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState('roles');
  const [roleDefs, setRoleDefs] = useState([]);
  const [roleDefsLoading, setRoleDefsLoading] = useState(false);
  const [roleDefsError, setRoleDefsError] = useState('');
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState('');
  const [roleModal, setRoleModal] = useState(null); // { type: 'add' | 'edit', def?: {...} }
  const [roleForm, setRoleForm] = useState({ code: '', displayName: '', areas: [] });
  const [roleFormLoading, setRoleFormLoading] = useState(false);

  const { roles: dynamicRoles, labels: dynamicLabels } = buildRoleMaps(roleDefs);
  const displayRoles = roleDefs.length > 0 ? dynamicRoles : ADMIN_ROLES;
  const displayLabels = roleDefs.length > 0 ? dynamicLabels : ADMIN_ROLE_LABELS;

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    setAdminsError('');
    try {
      const res = await getAdminUsers({ role: 'ADMIN', size: 100 });
      setAdmins(res?.content || []);
    } catch (err) {
      setAdminsError(getApiErrorMessage(err, 'Failed to load admins'));
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  const loadRoleDefs = useCallback(async () => {
    setRoleDefsLoading(true);
    setRoleDefsError('');
    try {
      const list = await getRoleDefinitions();
      setRoleDefs(list || []);
    } catch (err) {
      setRoleDefsError(getApiErrorMessage(err, 'Failed to load roles'));
    } finally {
      setRoleDefsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'roles') loadRoleDefs();
  }, [activeTab, loadRoleDefs]);

  useEffect(() => {
    if (activeTab === 'admins') loadAdmins();
  }, [activeTab, loadAdmins]);

  const handleToggleStatus = async (adminUser, newActive) => {
    setAdminsError('');
    try {
      await updateUserStatus(adminUser.id, newActive, 'Admin action');
      showAdminToast(newActive ? 'Admin activated' : 'Admin deactivated', 'success');
      loadAdmins();
    } catch (err) {
      setAdminsError(getApiErrorMessage(err, 'Failed to update status'));
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setRoleFormLoading(true);
    setRoleDefsError('');
    try {
      if (roleModal?.type === 'add') {
        await createRoleDefinition({ code: roleForm.code, displayName: roleForm.displayName, areas: roleForm.areas });
        showAdminToast('Role added', 'success');
      } else if (roleModal?.type === 'edit' && roleModal.def) {
        await updateRoleDefinition(roleModal.def.id, { displayName: roleForm.displayName, areas: roleForm.areas });
        showAdminToast('Role updated', 'success');
      }
      setRoleModal(null);
      loadRoleDefs();
    } catch (err) {
      setRoleDefsError(getApiErrorMessage(err, 'Failed to save role'));
    } finally {
      setRoleFormLoading(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Delete this role? Users with this role will lose admin access.')) return;
    setRoleDefsError('');
    try {
      await deleteRoleDefinition(id);
      showAdminToast('Role deleted', 'success');
      setRoleModal(null);
      loadRoleDefs();
    } catch (err) {
      setRoleDefsError(getApiErrorMessage(err, 'Failed to delete role'));
    }
  };

  const handleAdminRoleChange = async (userId, adminRole) => {
    setAdminsError('');
    try {
      await setUserAdminRole(userId, adminRole);
      showAdminToast('Admin role updated', 'success');
      loadAdmins();
    } catch (err) {
      setAdminsError(getApiErrorMessage(err, 'Failed to update admin role'));
    }
  };

  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    adminRole: 'MODERATOR',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    if (!createForm.name.trim() || !createForm.phone.trim() || !createForm.password.trim()) {
      setCreateError('Name, phone and password are required');
      return;
    }
    setCreateLoading(true);
    try {
      const body = {
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        role: 'ADMIN',
        adminRole: createForm.adminRole,
      };
      if (createForm.email?.trim()) body.email = createForm.email.trim();
      const created = await createAdminUser(body);
      setCreateSuccess(`Admin "${created?.name}" created with role ${displayLabels[createForm.adminRole] || createForm.adminRole}. They can log in with phone/email and password.`);
      showAdminToast('Admin created', 'success');
      setCreateForm({ name: '', phone: '', email: '', password: '', adminRole: 'MODERATOR' });
      loadAdmins();
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Failed to create admin'));
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="admin-roles-page">
      {/* Page hero */}
      <div className="admin-command-hero">
        <div>
          <h1 className="admin-command-title">Admin roles and access</h1>
          <p className="admin-command-subtitle">
            Create new admins and assign a role (Super Admin, Moderator, Support, Finance). Each role can only access the areas listed below.
          </p>
        </div>
        <div className="admin-roles-hero-icon" aria-hidden>
          <Shield size={32} />
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-roles-tabs">
        <button
          type="button"
          className={`admin-roles-tab ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={18} />
          Roles & Access
        </button>
        <button
          type="button"
          className={`admin-roles-tab ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          <Users size={18} />
          Admins
        </button>
      </div>

      {activeTab === 'admins' && (
        <div className="admin-card admin-roles-admins-card">
          <h2 className="admin-card-title">Admin users</h2>
          <p className="admin-section-label">
            All users with Role = ADMIN. Activate or deactivate, or change their admin sub-role. (Super Admin only)
          </p>
          {adminsError && <p className="admin-roles-form-error">{adminsError}</p>}
          {adminsLoading ? (
            <div className="admin-loading" style={{ padding: 32 }}>Loading admins...</div>
          ) : admins.length === 0 ? (
            <div className="admin-empty" style={{ padding: 32 }}>No admin users found</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Admin role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    {isSuperAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {a.profilePic ? (
                            <img src={a.profilePic} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
                              {(a.name || 'A').charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span style={{ fontWeight: 500, color: '#f8fafc' }}>{a.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                          {a.email && <div>{a.email}</div>}
                          {a.phone && <div>{a.phone}</div>}
                          {!a.email && !a.phone && '—'}
                        </div>
                      </td>
                      <td>
                        {isSuperAdmin ? (
                          <select
                            className="admin-input"
                            value={a.adminRole || 'SUPER_ADMIN'}
                            onChange={(e) => handleAdminRoleChange(a.id, e.target.value)}
                            style={{ width: 'auto', minWidth: 120, padding: '6px 10px', fontSize: '0.8125rem', cursor: 'pointer' }}
                          >
                            {displayRoles.map((r) => (
                              <option key={r} value={r}>{displayLabels[r] || r}</option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>
                            {displayLabels[a.adminRole || 'SUPER_ADMIN'] || a.adminRole || 'Super Admin'}
                          </span>
                        )}
                      </td>
                      <td>
                        {a.isActive ? (
                          <span className="admin-badge admin-badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={14} /> Active
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <XCircle size={14} /> Inactive
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                      </td>
                      {isSuperAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="admin-btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            onClick={() => handleToggleStatus(a, !a.isActive)}
                            title={a.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {a.isActive ? <UserMinus size={16} /> : <UserCheck size={16} />}
                            {a.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'roles' && (
        <>
      {/* Create admin – Super Admin only */}
      {isSuperAdmin && (
        <div className="admin-card admin-roles-create-card">
          <div className="admin-roles-create-header">
            <UserPlus size={22} className="admin-roles-create-icon" />
            <div>
              <h2 className="admin-card-title" style={{ marginBottom: 4 }}>Create admin</h2>
              <p className="admin-roles-create-desc">
                Create a new admin and assign one of the four roles. They can log in immediately with phone/email and password.
              </p>
            </div>
          </div>
          <form onSubmit={handleCreateAdmin} className="admin-roles-form">
            <div className="admin-roles-form-grid">
              <div>
                <label className="admin-label">Name *</label>
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
                <label className="admin-label">Phone *</label>
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
                <label className="admin-label">Email (optional)</label>
                <input
                  type="email"
                  className="admin-input"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="admin-label">Password *</label>
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
                <label className="admin-label">Admin role *</label>
                <select
                  className="admin-input"
                  value={createForm.adminRole}
                  onChange={(e) => setCreateForm((f) => ({ ...f, adminRole: e.target.value }))}
                  style={{ cursor: 'pointer' }}
                >
{displayRoles.map((r) => (
                                    <option key={r} value={r}>{displayLabels[r] || r}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
            {createError && <p className="admin-roles-form-error">{createError}</p>}
            {createSuccess && <p className="admin-roles-form-success">{createSuccess}</p>}
            <button type="submit" className="admin-btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create admin'}
            </button>
          </form>
        </div>
      )}

      {/* Admin roles and allowed areas */}
      <div className="admin-card admin-roles-matrix-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 className="admin-card-title">Admin roles and allowed areas</h2>
            <p className="admin-section-label">
              Add, edit, or delete roles. Super Admin can manage roles and areas.
            </p>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => {
                setRoleForm({ code: '', displayName: '', areas: [] });
                setRoleModal({ type: 'add' });
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Plus size={18} /> Add role
            </button>
          )}
        </div>
        {roleDefsError && <p className="admin-roles-form-error" style={{ marginBottom: 12 }}>{roleDefsError}</p>}
        {roleDefsLoading ? (
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading roles...</p>
        ) : (
          <div className="admin-roles-grid">
            {(roleDefs.length > 0 ? roleDefs : ROLE_ORDER.map((code) => ({
              code,
              displayName: ADMIN_ROLE_LABELS[code] || code,
              isBuiltin: true,
              areas: getAreasForRole(code, null),
            }))).map((def) => {
              const role = def.code;
              const areas = def.areas || getAreasForRole(role, roleDefs);
              const isCurrent = currentRole === role;
              const Icon = ROLE_ICONS[role] || Shield;
              return (
                <div
                  key={role}
                  className={`admin-roles-role-card ${isCurrent ? 'admin-roles-role-card-current' : ''}`}
                >
                  <div className="admin-roles-role-card-header">
                    <span className="admin-roles-role-icon">
                      <Icon size={20} />
                    </span>
                    <span className="admin-roles-role-name">{def.displayName || role}</span>
                    {isCurrent && <span className="admin-roles-you-badge">You</span>}
                    {role === 'SUPER_ADMIN' && (
                      <Lock size={14} className="admin-roles-lock-icon" title="Full access" />
                    )}
                    {isSuperAdmin && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="admin-btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => {
                            const areaList = role === 'SUPER_ADMIN'
                              ? getAreasForRole(role, roleDefs)
                              : (def.areas || getAreasForRole(role, roleDefs) || []);
                            setRoleForm({
                              code: def.code,
                              displayName: def.displayName || def.code,
                              areas: areaList,
                            });
                            setRoleModal({ type: 'edit', def });
                          }}
                          title="Edit role"
                        >
                          <Pencil size={14} />
                        </button>
                        {!def.isBuiltin && def.id && (
                          <button
                            type="button"
                            className="admin-btn-ghost"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--admin-error)' }}
                            onClick={() => handleDeleteRole(def.id)}
                            title="Delete role"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="admin-roles-role-areas">
                    {(!areas || areas.length === 0) ? (
                      <span className="admin-roles-no-areas">No areas</span>
                    ) : (
                      areas.map((areaKey) => (
                        <span key={areaKey} className="admin-roles-area-tag">
                          {AREA_LABELS[areaKey] || areaKey}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="admin-roles-footer-note">
          To assign an admin role to a user: go to <strong>Users</strong>, or use the <strong>Admins</strong> tab above to view and manage admin users.
        </div>
      </div>

      {/* Add/Edit role modal */}
      {roleModal && (
        <div className="admin-modal-overlay" onClick={() => setRoleModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">{roleModal.type === 'add' ? 'Add role' : 'Edit role'}</h3>
            <form onSubmit={handleSaveRole}>
              {roleModal.type === 'add' && (
                <div style={{ marginBottom: 16 }}>
                  <label className="admin-label">Code *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={roleForm.code}
                    onChange={(e) => setRoleForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                    placeholder="e.g. CONTENT_MANAGER"
                    required
                  />
                </div>
              )}
              {roleModal.type === 'edit' && (
                <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  Role code: <strong>{roleForm.code}</strong>
                </p>
              )}
              <div style={{ marginBottom: 16 }}>
                <label className="admin-label">Display name *</label>
                <input
                  type="text"
                  className="admin-input"
                  value={roleForm.displayName}
                  onChange={(e) => setRoleForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. Content Manager"
                  required
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="admin-label">Allowed areas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {ALL_AREA_KEYS.map((areaKey) => (
                    <label key={areaKey} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={roleForm.areas.includes(areaKey)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...roleForm.areas, areaKey]
                            : roleForm.areas.filter((a) => a !== areaKey);
                          setRoleForm((f) => ({ ...f, areas: next }));
                        }}
                      />
                      {AREA_LABELS[areaKey] || areaKey}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn-ghost" onClick={() => setRoleModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={roleFormLoading}>
                  {roleFormLoading ? 'Saving...' : (roleModal.type === 'add' ? 'Add role' : 'Save changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
