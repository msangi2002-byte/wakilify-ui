import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  Plus,
  ArrowLeft,
  Store,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants/brand';
import { useAuthStore } from '@/store/auth.store';
import { logout as logoutApi } from '@/lib/api/auth';
import { clearAuth } from '@/store/auth.store';
import '@/styles/business.css';

const navItems = [
  { to: '/business', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/business/products', end: false, icon: Package, label: 'Products' },
  { to: '/business/orders', end: false, icon: ShoppingBag, label: 'Orders' },
  { to: '/business/feedback', end: false, icon: MessageSquare, label: 'Shop feedback' },
  { to: '/business/stats', end: false, icon: BarChart3, label: 'Analytics' },
  { to: '/business/settings', end: false, icon: Settings, label: 'Settings' },
];

const pathLabels = {
  '': 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  feedback: 'Shop feedback',
  stats: 'Analytics',
  settings: 'Settings',
  new: 'New Product',
};

export default function BusinessLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await logoutApi();
    } catch (_) {}
    clearAuth();
    navigate('/auth/login', { replace: true });
  };

  const pathSegments = location.pathname.replace(/^\/business\/?/, '').split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Business', to: '/business' },
    ...pathSegments.map((segment, i) => ({
      label: pathLabels[segment] || segment,
      to: '/business/' + pathSegments.slice(0, i + 1).join('/'),
      last: i === pathSegments.length - 1,
    })),
  ];
  if (breadcrumbs.length === 1) breadcrumbs[0].last = true;

  const displayName = user?.name || 'Business';
  const displayEmail = user?.email || user?.phone || '';
  const initial = (displayName || 'B').charAt(0).toUpperCase();
  const avatarUrl = user?.profilePic;

  return (
    <div className={`business-portal ${sidebarOpen ? 'business-sidebar-open' : ''}`}>
      <div className="business-bg" aria-hidden="true" />
      <div className="business-bg-overlay" aria-hidden="true" />
      <header className="business-topbar">
        <div className="business-topbar-left">
          <button
            type="button"
            className="business-topbar-menu"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/business" className="business-topbar-brand" onClick={() => setSidebarOpen(false)}>
            <Store size={22} />
            {APP_NAME} Business
          </Link>
        </div>
        <div className="business-topbar-center" aria-hidden="true">
          <span className="business-topbar-center-placeholder">Business dashboard</span>
        </div>
        <nav className="business-topbar-right">
          <div className="business-user-dropdown" ref={userMenuRef}>
            <button
              type="button"
              className="business-topbar-user"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="business-topbar-user-avatar-img" />
              ) : (
                <span className="business-topbar-user-avatar">{initial}</span>
              )}
              <span className="business-topbar-user-label">{displayName}</span>
              <ChevronDown size={16} className={userMenuOpen ? 'business-chevron-open' : ''} />
            </button>
            {userMenuOpen && (
              <div className="business-user-dropdown-menu">
                <div className="business-user-dropdown-header">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="business-user-dropdown-avatar" />
                  ) : (
                    <span className="business-user-dropdown-avatar business-user-dropdown-avatar-initial">{initial}</span>
                  )}
                  <div className="business-user-dropdown-info">
                    <span className="business-user-dropdown-name">{displayName}</span>
                    {displayEmail && <span className="business-user-dropdown-email">{displayEmail}</span>}
                  </div>
                </div>
                <Link
                  to="/app/profile"
                  className="business-user-dropdown-item"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User size={18} />
                  My profile
                </Link>
                <button type="button" className="business-user-dropdown-item business-user-dropdown-logout" onClick={handleLogout}>
                  <LogOut size={18} />
                  Log out
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="business-topbar-back"
            onClick={() => navigate('/app')}
          >
            <ArrowLeft size={18} />
            Back to App
          </button>
        </nav>
      </header>

      <div className="business-portal-content">
        <div className="business-status-bar">
          <span className="business-status-pill business-status-operational">
            <span className="business-status-dot" /> Business dashboard
          </span>
        </div>
        <div className="business-breadcrumb-wrap">
          <nav className="business-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="business-breadcrumb-item">
                {i > 0 && <span className="business-breadcrumb-sep">/</span>}
                {b.last ? (
                  <span className="business-breadcrumb-current">{b.label}</span>
                ) : (
                  <Link to={b.to} className="business-breadcrumb-link">{b.label}</Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div
          className="business-sidebar-backdrop"
          role="presentation"
          aria-hidden={!sidebarOpen}
          onClick={() => setSidebarOpen(false)}
        />
        <div className="business-layout-body">
          <aside className="business-sidebar">
            <nav className="business-sidebar-nav">
              {navItems.map(({ to, end, icon: Icon, label }) => {
                const isActive = location.pathname === to || (!end && location.pathname.startsWith(to));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`business-sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                );
              })}
              <div className="business-sidebar-divider" />
              <Link
                to="/business/products/new"
                className="business-sidebar-link business-sidebar-link-primary"
                onClick={() => setSidebarOpen(false)}
              >
                <Plus size={18} />
                Post Product
              </Link>
              <div className="business-sidebar-footer">
                <button
                  type="button"
                  className="business-sidebar-link business-sidebar-back-btn"
                  onClick={() => { setSidebarOpen(false); navigate('/app'); }}
                >
                  <ArrowLeft size={20} />
                  <span>Back to App</span>
                </button>
              </div>
            </nav>
          </aside>
          <main className="business-main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
