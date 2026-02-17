import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  Package,
  ShoppingBag,
  CreditCard,
  Wallet,
  Megaphone,
  BarChart3,
  FileText,
  Settings,
  Shield,
  ArrowLeft,
  Menu,
  X,
  Box,
  Bell,
  MapPin,
  HelpCircle,
  ChevronDown,
  Search,
  LogOut,
  User,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants/brand';
import { getAdminDashboard } from '@/lib/api/admin';
import { useAuthStore } from '@/store/auth.store';
import { logout as logoutApi } from '@/lib/api/auth';
import { clearAuth } from '@/store/auth.store';
import GlobalSearch from '@/components/admin/GlobalSearch';
import { getEffectiveAdminRole, filterNavGroupsByRole, canAccessPath, getAdminRoleLabel } from '@/lib/adminRoles';
import '@/styles/admin.css';

const navGroups = [
  { label: 'Overview', items: [{ to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' }, { to: '/admin/map', end: false, icon: MapPin, label: 'Map' }] },
  { label: 'People', items: [{ to: '/admin/users', end: false, icon: Users, label: 'Users' }, { to: '/admin/agents', end: false, icon: UserCheck, label: 'Agents', badgeKey: 'pendingAgents' }] },
  { label: 'Business', items: [{ to: '/admin/businesses', end: false, icon: Building2, label: 'Businesses' }, { to: '/admin/products', end: false, icon: Package, label: 'Products' }, { to: '/admin/orders', end: false, icon: ShoppingBag, label: 'Orders' }] },
  { label: 'Financial', items: [{ to: '/admin/payments', end: false, icon: CreditCard, label: 'Payments' }, { to: '/admin/withdrawals', end: false, icon: Wallet, label: 'Withdrawals' }] },
  { label: 'Content & Moderation', items: [{ to: '/admin/promotions', end: false, icon: Megaphone, label: 'Promotions' }, { to: '/admin/reports', end: false, icon: BarChart3, label: 'Reports' }, { to: '/admin/audit-logs', end: false, icon: FileText, label: 'Audit Logs' }] },
  { label: 'System', items: [{ to: '/admin/roles', end: false, icon: Shield, label: 'Roles & Access' }, { to: '/admin/agent-packages', end: false, icon: Box, label: 'Agent Packages' }, { to: '/admin/settings', end: false, icon: Settings, label: 'Settings' }] },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const adminRole = getEffectiveAdminRole(user);
  const filteredNavGroups = filterNavGroupsByRole(navGroups, adminRole);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [pendingAgents, setPendingAgents] = useState(0);
  const [tableDensity, setTableDensity] = useState(() => {
    try {
      return window.localStorage.getItem('admin_table_density') || 'comfortable';
    } catch (_) {
      return 'comfortable';
    }
  });
  const [toast, setToast] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const adminMenuRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    const onToast = (e) => {
      const { message, type } = e.detail || {};
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast(message ? { message, type: type || 'success' } : null);
      if (message) {
        toastTimerRef.current = setTimeout(() => {
          setToast(null);
          toastTimerRef.current = null;
        }, 3500);
      }
    };
    window.addEventListener('admin:toast', onToast);
    return () => {
      window.removeEventListener('admin:toast', onToast);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          setShortcutsOpen((o) => !o);
        }
      }
      if (e.key === 'Escape') setShortcutsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleDensityChange = (value) => {
    setTableDensity(value);
    try {
      window.localStorage.setItem('admin_table_density', value);
    } catch (_) {}
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target)) setAdminMenuOpen(false);
    }
    if (adminMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [adminMenuOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Route guard: redirect to /admin if current path is not allowed for this admin role
  useEffect(() => {
    if (!adminRole || !location.pathname.startsWith('/admin')) return;
    if (!canAccessPath(adminRole, location.pathname)) navigate('/admin', { replace: true });
  }, [adminRole, location.pathname, navigate]);

  useEffect(() => {
    let cancelled = false;
    function apply(d) {
      if (!d) return;
      const reports = d.pendingReports ?? 0;
      const withdrawals = d.pendingWithdrawals ?? 0;
      setAlertCount(reports + withdrawals);
      if (d.pendingAgents != null) setPendingAgents(Number(d.pendingAgents));
    }
    getAdminDashboard().then((d) => { if (!cancelled) apply(d); }).catch(() => {});
    const t = setInterval(() => {
      getAdminDashboard().then((d) => { if (!cancelled) apply(d); }).catch(() => {});
    }, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const handleLogout = async () => {
    setAdminMenuOpen(false);
    try {
      await logoutApi();
    } catch (_) {}
    clearAuth();
    navigate('/auth/login', { replace: true });
  };

  const displayName = user?.name || 'Admin';
  const displayEmail = user?.email || user?.phone || '';
  const initial = (displayName || 'A').charAt(0).toUpperCase();
  const avatarUrl = user?.profilePic;

  const pathSegments = location.pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const breadcrumbLabels = {
    '': 'Dashboard',
    map: 'Map',
    users: 'Users',
    businesses: 'Businesses',
    agents: 'Agents',
    products: 'Products',
    orders: 'Orders',
    payments: 'Payments',
    withdrawals: 'Withdrawals',
    promotions: 'Promotions',
    reports: 'Reports',
    'audit-logs': 'Audit Logs',
    'agent-packages': 'Agent Packages',
    roles: 'Roles & Access',
    settings: 'Settings',
  };
  const breadcrumbs = [
    { label: 'Admin', to: '/admin' },
    ...pathSegments.map((segment, i) => ({
      label: breadcrumbLabels[segment] || segment,
      to: '/admin/' + pathSegments.slice(0, i + 1).join('/'),
      last: i === pathSegments.length - 1,
    })),
  ];
  if (breadcrumbs.length === 1) breadcrumbs[0].last = true;

  return (
    <div className={`admin-portal ${sidebarOpen ? 'admin-sidebar-open' : ''} ${tableDensity === 'compact' ? 'admin-density-compact' : ''}`}>
      <div className="admin-bg" aria-hidden="true" />
      <div className="admin-bg-overlay" aria-hidden="true" />
      <GlobalSearch />
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button
            type="button"
            className="admin-topbar-menu"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/admin" className="admin-topbar-brand" onClick={() => setSidebarOpen(false)}>
            <span className="admin-logo-w">W</span>
            {APP_NAME} Admin
          </Link>
        </div>
        <div className="admin-topbar-center">
          <button
            type="button"
            className="admin-topbar-search-trigger"
            onClick={() => window.dispatchEvent(new CustomEvent('admin:open-search'))}
          >
            <Search size={18} />
            <span>Search... (Ctrl+K)</span>
          </button>
        </div>
        <nav className="admin-topbar-right">
          <Link to="/admin/reports" className="admin-topbar-icon-wrap admin-topbar-icon-badge" title="Notifications">
            <Bell size={20} />
            {alertCount > 0 && <span className="admin-topbar-badge">{alertCount > 99 ? '99+' : alertCount}</span>}
          </Link>
          <button
            type="button"
            className="admin-topbar-icon-wrap"
            aria-label="Help"
            title="Shortcuts (?)"
            onClick={() => setShortcutsOpen(true)}
          >
            <HelpCircle size={20} />
          </button>
          <div className="admin-user-dropdown" ref={adminMenuRef}>
            <button
              type="button"
              className="admin-topbar-user"
              onClick={() => setAdminMenuOpen((o) => !o)}
              aria-expanded={adminMenuOpen}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="admin-topbar-user-avatar-img" />
              ) : (
                <span className="admin-topbar-user-avatar">{initial}</span>
              )}
              <span className="admin-topbar-user-label">{displayName}</span>
              <ChevronDown size={16} className={adminMenuOpen ? 'admin-chevron-open' : ''} />
            </button>
            {adminMenuOpen && (
              <div className="admin-user-dropdown-menu">
                <div className="admin-user-dropdown-header">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="admin-user-dropdown-avatar" />
                  ) : (
                    <span className="admin-user-dropdown-avatar admin-user-dropdown-avatar-initial">{initial}</span>
                  )}
                  <div className="admin-user-dropdown-info">
                    <span className="admin-user-dropdown-name">{displayName}</span>
                    {displayEmail && <span className="admin-user-dropdown-email">{displayEmail}</span>}
                  </div>
                </div>
                <div className="admin-user-dropdown-role">{getAdminRoleLabel(adminRole)}</div>
                <Link
                  to="/app/profile"
                  className="admin-user-dropdown-item"
                  onClick={() => setAdminMenuOpen(false)}
                >
                  <User size={18} />
                  My profile
                </Link>
                <button type="button" className="admin-user-dropdown-item admin-user-dropdown-logout" onClick={handleLogout}>
                  <LogOut size={18} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>
      <div className="admin-portal-content">
        <div className="admin-status-bar">
          <span className="admin-status-pill admin-status-operational">
            <span className="admin-status-dot" /> All systems operational
          </span>
          <span className="admin-status-meta">Enterprise control panel · Scale-ready</span>
          <div className="admin-density-toggle">
            <span className="admin-density-label">Tables:</span>
            <button
              type="button"
              className={`admin-density-btn ${tableDensity === 'comfortable' ? 'active' : ''}`}
              onClick={() => handleDensityChange('comfortable')}
            >
              Comfortable
            </button>
            <button
              type="button"
              className={`admin-density-btn ${tableDensity === 'compact' ? 'active' : ''}`}
              onClick={() => handleDensityChange('compact')}
            >
              Compact
            </button>
          </div>
        </div>
        <div className="admin-breadcrumb-wrap">
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="admin-breadcrumb-item">
                {i > 0 && <span className="admin-breadcrumb-sep">/</span>}
                {b.last ? (
                  <span className="admin-breadcrumb-current">{b.label}</span>
                ) : (
                  <Link to={b.to} className="admin-breadcrumb-link">{b.label}</Link>
                )}
              </span>
            ))}
          </nav>
        </div>
        <div
          className="admin-sidebar-backdrop"
          role="presentation"
          aria-hidden={!sidebarOpen}
          onClick={() => setSidebarOpen(false)}
        />
        <div className="admin-layout-body">
        <aside className="admin-sidebar">
          <nav className="admin-sidebar-nav">
            {filteredNavGroups.map((group) => (
              <div key={group.label}>
                <div className="admin-sidebar-group">{group.label}</div>
                {group.items.map(({ to, end, icon: Icon, label, badgeKey }) => {
                  const count = badgeKey === 'pendingAgents' ? pendingAgents : 0;
                  return (
                    <Link
                      key={to}
                      to={to}
                      end={end}
                      className={`admin-sidebar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                      {count > 0 && <span className="admin-sidebar-badge">{count > 99 ? '99+' : count}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
            <div className="admin-sidebar-footer">
              <button
                type="button"
                className="admin-sidebar-link admin-sidebar-back-btn"
                onClick={() => { setSidebarOpen(false); navigate('/app'); }}
              >
                <ArrowLeft size={20} />
                <span>Back to App</span>
              </button>
            </div>
          </nav>
        </aside>
        <main className="admin-main">
          <Outlet />
        </main>
        </div>
      </div>

      {toast && (
        <div
          className={`admin-toast admin-toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      {shortcutsOpen && (
        <div
          className="admin-shortcuts-backdrop"
          onClick={() => setShortcutsOpen(false)}
          role="presentation"
        >
          <div
            className="admin-shortcuts-modal admin-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#f8fafc' }}>Keyboard shortcuts</h3>
              <button type="button" className="admin-btn-ghost" onClick={() => setShortcutsOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <ul className="admin-shortcuts-list">
              <li><kbd>⌘</kbd> <kbd>K</kbd> <span>Quick search</span></li>
              <li><kbd>?</kbd> <span>This shortcuts panel</span></li>
              <li><kbd>Esc</kbd> <span>Close modal / panel</span></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
