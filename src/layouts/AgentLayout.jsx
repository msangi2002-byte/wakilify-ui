import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants/brand';
import '@/styles/agent.css';

const navItems = [
  { to: '/agent', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent/requests', end: false, icon: Inbox, label: 'Requests' },
  { to: '/agent/activate', end: false, icon: Building2, label: 'Activate Business' },
  { to: '/agent/commissions', end: false, icon: Banknote, label: 'Commissions' },
  { to: '/agent/withdrawals', end: false, icon: Wallet, label: 'Withdrawals' },
];

export default function AgentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={`agent-portal ${sidebarOpen ? 'agent-sidebar-open' : ''}`}>
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
            <Sparkles size={24} />
            {APP_NAME} Agent
          </Link>
        </div>
        <nav className="agent-topbar-nav">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              end={end}
              className={`agent-topbar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <button
            type="button"
            className="agent-topbar-back"
            onClick={() => navigate('/app')}
          >
            <ArrowLeft size={18} />
            Back to App
          </button>
        </nav>
      </header>
      <div
        className="agent-sidebar-backdrop"
        role="presentation"
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="agent-sidebar">
        <nav className="agent-sidebar-nav">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              end={end}
              className={`agent-sidebar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
          <div className="agent-sidebar-footer">
            <button
              type="button"
              className="agent-sidebar-link agent-sidebar-back-btn"
              onClick={() => { setSidebarOpen(false); navigate('/app'); }}
            >
              <ArrowLeft size={20} />
              Back to App
            </button>
          </div>
        </nav>
      </aside>
      <main className="agent-main">
        <Outlet />
      </main>
    </div>
  );
}
