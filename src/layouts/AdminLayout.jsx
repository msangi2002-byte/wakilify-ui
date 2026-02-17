import { useState, useEffect } from 'react';
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
  ArrowLeft,
  Shield,
  Menu,
  X,
  Box,
  Bell,
  MapPin,
  Command,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants/brand';
import { getAdminDashboard } from '@/lib/api/admin';
import GlobalSearch from '@/components/admin/GlobalSearch';
import '@/styles/admin.css';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/map', end: false, icon: MapPin, label: 'Map' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/users', end: false, icon: Users, label: 'Users' },
      { to: '/admin/businesses', end: false, icon: Building2, label: 'Businesses' },
      { to: '/admin/agents', end: false, icon: UserCheck, label: 'Agents' },
      { to: '/admin/products', end: false, icon: Package, label: 'Products' },
      { to: '/admin/orders', end: false, icon: ShoppingBag, label: 'Orders' },
    ],
  },
  {
    label: 'Finance & Content',
    items: [
      { to: '/admin/payments', end: false, icon: CreditCard, label: 'Payments' },
      { to: '/admin/withdrawals', end: false, icon: Wallet, label: 'Withdrawals' },
      { to: '/admin/promotions', end: false, icon: Megaphone, label: 'Promotions' },
      { to: '/admin/reports', end: false, icon: BarChart3, label: 'Reports' },
      { to: '/admin/audit-logs', end: false, icon: FileText, label: 'Audit Logs' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/agent-packages', end: false, icon: Box, label: 'Agent Packages' },
      { to: '/admin/settings', end: false, icon: Settings, label: 'Settings' },
    ],
  },
];

const navItems = navGroups.flatMap((g) => g.items);

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    getAdminDashboard()
      .then((d) => {
        if (!cancelled && d) {
          const reports = d.pendingReports ?? 0;
          const withdrawals = d.pendingWithdrawals ?? 0;
          setAlertCount(reports + withdrawals);
        }
      })
      .catch(() => {});
    const t = setInterval(() => {
      getAdminDashboard()
        .then((d) => {
          if (!cancelled && d) {
            const reports = d.pendingReports ?? 0;
            const withdrawals = d.pendingWithdrawals ?? 0;
            setAlertCount(reports + withdrawals);
          }
        })
        .catch(() => {});
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div className={`admin-portal ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>
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
            <Shield size={24} />
            {APP_NAME} Admin
          </Link>
        </div>
        <nav className="admin-topbar-nav">
          <button
            type="button"
            className="admin-topbar-link"
            onClick={() => window.dispatchEvent(new CustomEvent('admin:open-search'))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Quick search (Ctrl+K)"
          >
            <Command size={16} />
            <span className="admin-kbd">⌘K</span>
          </button>
          <Link
            to="/admin/reports"
            className="admin-topbar-link"
            style={{ position: 'relative' }}
            title="Reports & Withdrawals"
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
            <span className="admin-topbar-link-text">Alerts</span>
          </Link>
          {navItems.slice(0, 5).map(({ to, end, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              end={end}
              className={`admin-topbar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="admin-topbar-link-text">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            className="admin-topbar-back"
            onClick={() => navigate('/app')}
          >
            <ArrowLeft size={18} />
            <span className="admin-topbar-link-text">Back to App</span>
          </button>
        </nav>
      </header>
      <div
        className="admin-sidebar-backdrop"
        role="presentation"
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="admin-layout-body">
        <aside className="admin-sidebar">
          <nav className="admin-sidebar-nav">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="admin-sidebar-group">{group.label}</div>
                {group.items.map(({ to, end, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    end={end}
                    className={`admin-sidebar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                ))}
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
  );
}
