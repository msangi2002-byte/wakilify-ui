import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants/brand';
import '@/styles/business.css';

const navItems = [
  { to: '/business', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/business/products', end: false, icon: Package, label: 'Products' },
  { to: '/business/orders', end: false, icon: ShoppingBag, label: 'Orders' },
  { to: '/business/stats', end: false, icon: BarChart3, label: 'Analytics' },
  { to: '/business/settings', end: false, icon: Settings, label: 'Settings' },
];

export default function BusinessLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`business-portal ${sidebarOpen ? 'business-sidebar-open' : ''}`}>
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
            <Store size={24} />
            {APP_NAME} Business
          </Link>
        </div>
        <nav className="business-topbar-nav">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              end={end}
              className={`business-topbar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <Link
            to="/business/products/new"
            className="business-topbar-link business-topbar-link-primary"
          >
            <Plus size={18} />
            Post Product
          </Link>
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
      <div
        className="business-sidebar-backdrop"
        role="presentation"
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="business-layout-body">
        <aside className="business-sidebar">
          <nav className="business-sidebar-nav">
            {navItems.map(({ to, end, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                end={end}
                className={`business-sidebar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                {label}
              </Link>
            ))}
            <div className="business-sidebar-divider" />
            <Link
              to="/business/products/new"
              className="business-sidebar-link business-sidebar-link-primary"
              onClick={() => setSidebarOpen(false)}
            >
              <Plus size={20} />
              Post Product
            </Link>
            <div className="business-sidebar-footer">
              <button
                type="button"
                className="business-sidebar-link business-sidebar-back-btn"
                onClick={() => { setSidebarOpen(false); navigate('/app'); }}
              >
                <ArrowLeft size={20} />
                Back to App
              </button>
            </div>
          </nav>
        </aside>
        <main className="business-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
