import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Banknote,
  Wallet,
  ArrowLeft,
  Sparkles,
  Inbox,
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

  return (
    <div className="agent-portal">
      <header className="agent-topbar">
        <Link to="/agent" className="agent-topbar-brand">
          <Sparkles size={24} />
          {APP_NAME} Agent
        </Link>
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
      <div className="agent-layout-body">
        <aside className="agent-sidebar">
          <nav className="agent-sidebar-nav">
            {navItems.map(({ to, end, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                end={end}
                className={`agent-sidebar-link ${location.pathname === to || (!end && location.pathname.startsWith(to)) ? 'active' : ''}`}
              >
                <Icon size={20} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="agent-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
