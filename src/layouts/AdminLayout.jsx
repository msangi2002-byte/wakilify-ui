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
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants/brand';
import '@/styles/admin.css';

const navItems = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', end: false, icon: Users, label: 'Users' },
  { to: '/admin/businesses', end: false, icon: Building2, label: 'Businesses' },
  { to: '/admin/agents', end: false, icon: UserCheck, label: 'Agents' },
  { to: '/admin/products', end: false, icon: Package, label: 'Products' },
  { to: '/admin/orders', end: false, icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/payments', end: false, icon: CreditCard, label: 'Payments' },
  { to: '/admin/withdrawals', end: false, icon: Wallet, label: 'Withdrawals' },
  { to: '/admin/promotions', end: false, icon: Megaphone, label: 'Promotions' },
  { to: '/admin/reports', end: false, icon: BarChart3, label: 'Reports' },
  { to: '/admin/audit-logs', end: false, icon: FileText, label: 'Audit Logs' },
  { to: '/admin/agent-packages', end: false, icon: Box, label: 'Agent Packages' },
  { to: '/admin/settings', end: false, icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`admin-portal ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>
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
            {navItems.map(({ to, end, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                end={end}
                className={`admin-sidebar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
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
