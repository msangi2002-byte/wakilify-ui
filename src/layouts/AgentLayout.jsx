import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Banknote,
  Wallet,
  ArrowLeft,
  Sparkles,
  Inbox,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants/brand';
import { useAuthStore } from '@/store/auth.store';
import { logout as logoutApi } from '@/lib/api/auth';
import { clearAuth } from '@/store/auth.store';
import '@/styles/agent.css';

const navGroups = [
  {
    label: 'Agent',
    items: [
      { to: '/agent', end: true, icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/agent/requests', end: false, icon: Inbox, label: 'Requests' },
      { to: '/agent/activate', end: false, icon: Building2, label: 'Activate Business' },
      { to: '/agent/commissions', end: false, icon: Banknote, label: 'Commissions' },
      { to: '/agent/withdrawals', end: false, icon: Wallet, label: 'Withdrawals' },
    ],
  },
];

export default function AgentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const agentMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target)) setAgentMenuOpen(false);
    }
    if (agentMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [agentMenuOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setAgentMenuOpen(false);
    try {
      await logoutApi();
    } catch (_) {}
    clearAuth();
    navigate('/auth/login', { replace: true });
  };

  const displayName = user?.name || 'Agent';
  const displayEmail = user?.email || user?.phone || '';
  const initial = (displayName || 'A').charAt(0).toUpperCase();
  const avatarUrl = user?.profilePic;

  const pathSegments = location.pathname.replace(/^\/agent\/?/, '').split('/').filter(Boolean);
  const breadcrumbLabels = {
    '': 'Dashboard',
    requests: 'Requests',
    activate: 'Activate Business',
    commissions: 'Commissions',
    withdrawals: 'Withdrawals',
  };
  const breadcrumbs = [
    { label: 'Agent', to: '/agent' },
    ...pathSegments.map((segment, i) => ({
      label: breadcrumbLabels[segment] || segment,
      to: '/agent/' + pathSegments.slice(0, i + 1).join('/'),
      last: i === pathSegments.length - 1,
    })),
  ];
  if (breadcrumbs.length === 1) breadcrumbs[0].last = true;

  return (
    <div className={`agent-portal ${sidebarOpen ? 'agent-sidebar-open' : ''}`}>
      <div className="agent-bg" aria-hidden="true" />
      <div className="agent-bg-overlay" aria-hidden="true" />
      <header className="agent-topbar">
        <div className="agent-topbar-left">
          <button
            type="button"
            className="agent-topbar-menu"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/agent" className="agent-topbar-brand" onClick={() => setSidebarOpen(false)}>
            <span className="agent-logo-icon">
              <Sparkles size={20} />
            </span>
            {APP_NAME} Agent
          </Link>
        </div>
        <div className="agent-topbar-center">
          <span className="agent-topbar-search-placeholder">Agent dashboard</span>
        </div>
        <nav className="agent-topbar-right">
          <div className="agent-user-dropdown" ref={agentMenuRef}>
            <button
              type="button"
              className="agent-topbar-user"
              onClick={() => setAgentMenuOpen((o) => !o)}
              aria-expanded={agentMenuOpen}
              aria-haspopup="true"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="agent-topbar-user-avatar-img" />
              ) : (
                <span className="agent-topbar-user-avatar">{initial}</span>
              )}
              <span className="agent-topbar-user-label">{displayName}</span>
              <ChevronDown size={16} className={agentMenuOpen ? 'agent-chevron-open' : ''} />
            </button>
            {agentMenuOpen && (
              <div className="agent-user-dropdown-menu">
                <div className="agent-user-dropdown-header">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="agent-user-dropdown-avatar" />
                  ) : (
                    <span className="agent-user-dropdown-avatar agent-user-dropdown-avatar-initial">{initial}</span>
                  )}
                  <div className="agent-user-dropdown-info">
                    <span className="agent-user-dropdown-name">{displayName}</span>
                    {displayEmail && <span className="agent-user-dropdown-email">{displayEmail}</span>}
                  </div>
                </div>
                <div className="agent-user-dropdown-role">Agent</div>
                <Link
                  to="/app/profile"
                  className="agent-user-dropdown-item"
                  onClick={() => setAgentMenuOpen(false)}
                >
                  <User size={18} />
                  My profile
                </Link>
                <button type="button" className="agent-user-dropdown-item agent-user-dropdown-logout" onClick={handleLogout}>
                  <LogOut size={18} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>
      <div className="agent-portal-content">
        <div className="agent-status-bar">
          <span className="agent-status-pill agent-status-operational">
            <span className="agent-status-dot" /> Agent dashboard
          </span>
          <span className="agent-status-meta">Commissions · Withdrawals · Business activation</span>
        </div>
        <div className="agent-breadcrumb-wrap">
          <nav className="agent-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="agent-breadcrumb-item">
                {i > 0 && <span className="agent-breadcrumb-sep">/</span>}
                {b.last ? (
                  <span className="agent-breadcrumb-current">{b.label}</span>
                ) : (
                  <Link to={b.to} className="agent-breadcrumb-link">{b.label}</Link>
                )}
              </span>
            ))}
          </nav>
        </div>
        <div
          className="agent-sidebar-backdrop"
          role="presentation"
          aria-hidden={!sidebarOpen}
          onClick={() => setSidebarOpen(false)}
        />
        <div className="agent-layout-body">
          <aside className="agent-sidebar">
            <nav className="agent-sidebar-nav">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <div className="agent-sidebar-group">{group.label}</div>
                  {group.items.map(({ to, end, icon: Icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      end={end}
                      className={`agent-sidebar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              ))}
              <div className="agent-sidebar-footer">
                <button
                  type="button"
                  className="agent-sidebar-link agent-sidebar-back-btn"
                  onClick={() => { setSidebarOpen(false); navigate('/app'); }}
                >
                  <ArrowLeft size={20} />
                  <span>Back to App</span>
                </button>
              </div>
            </nav>
          </aside>
          <main className="agent-main">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
