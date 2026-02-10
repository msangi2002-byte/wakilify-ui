import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Home,
  Users,
  PlayCircle,
  Radio,
  ShoppingBag,
  Bell,
  MessageCircle,
  Settings,
  User,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { logout as logoutApi } from '@/lib/api/auth';
import { getIncomingCalls, answerCall, rejectCall } from '@/lib/api/calls';
import IncomingCallModal from '@/components/call/IncomingCallModal';
import { APP_NAME, LOGO_PNG, LOGO_ICON } from '@/lib/constants/brand';
import { clearAuth } from '@/store/auth.store';
import '@/styles/user-app.css';

const POLL_INTERVAL_MS = 2500;

const leftNav = [
  { to: '/app/profile', icon: User, label: 'Profile' },
  { to: '/app/friends', icon: Users, label: 'Friends' },
  { to: '/app/live', icon: Radio, label: 'Live' },
  { to: '/app/groups', icon: Users, label: 'Groups' },
  { to: '/app/shop', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

const sponsored = [
  { title: 'Dummy Ads', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { title: 'Dummy Ads', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
];

function BrandLogo({ size = 40, className = '' }) {
  const [src, setSrc] = useState(LOGO_PNG);
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', borderRadius: 8 }}
      onError={() => setSrc(LOGO_ICON)}
    />
  );
}

const contacts = [
  'Kold Manes',
  'Karean Soar',
  'Rusty Friends',
  'Juritttun Frar',
  'Kobu Natrun',
  'Emy Smith',
  'Kack Hardan',
];

function Avatar({ user, size = 40, className = '' }) {
  const src = user?.profilePic;
  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.4,
      }}
    >
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  );
}

export default function UserLayout() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callActionLoading, setCallActionLoading] = useState(false);
  const menuRef = useRef(null);

  const isHome = location.pathname === '/app' || location.pathname === '/app/';
  const isOnCallPage = location.pathname.startsWith('/app/call');

  const pollIncoming = useCallback(async () => {
    if (isOnCallPage) return;
    try {
      const list = await getIncomingCalls();
      const ringing = Array.isArray(list) ? list : [];
      const first = ringing[0];
      if (first?.id && first?.status === 'RINGING') {
        setIncomingCall((prev) => {
          if (prev?.id === first.id) return prev;
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(`${first.caller?.name || 'Someone'} is calling`, {
                body: first.type === 'VIDEO' ? 'Video call' : 'Voice call',
                tag: `call-${first.id}`,
              });
            } catch (_) {}
          }
          return first;
        });
      } else {
        setIncomingCall(null);
      }
    } catch {
      setIncomingCall(null);
    }
  }, [isOnCallPage]);

  useEffect(() => {
    const id = setInterval(pollIncoming, POLL_INTERVAL_MS);
    pollIncoming();
    return () => clearInterval(id);
  }, [pollIncoming]);

  const handleAcceptCall = async () => {
    if (!incomingCall?.id || callActionLoading) return;
    setCallActionLoading(true);
    try {
      const call = await answerCall(incomingCall.id);
      setIncomingCall(null);
      const roomId = call?.roomId ?? incomingCall?.roomId;
      if (roomId) {
        const type = ((call?.type ?? incomingCall?.type) || 'VIDEO').toUpperCase();
        const peerId = incomingCall?.caller?.id;
        const q = new URLSearchParams({ room: roomId, type, role: 'callee' });
        if (peerId) q.set('peerUserId', String(peerId));
        navigate(`/app/call?${q.toString()}`);
      }
    } catch (err) {
      console.error('Answer call failed:', err);
    } finally {
      setCallActionLoading(false);
    }
  };

  const handleDeclineCall = async () => {
    if (!incomingCall?.id || callActionLoading) return;
    setCallActionLoading(true);
    try {
      await rejectCall(incomingCall.id);
      setIncomingCall(null);
    } catch (err) {
      console.error('Reject call failed:', err);
      setIncomingCall(null);
    } finally {
      setCallActionLoading(false);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    const id = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logoutApi();
    } catch (_) {}
    clearAuth();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="user-app">
      <IncomingCallModal
        call={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
        disabled={callActionLoading}
      />
      <header className="user-app-header">
        <div className="user-app-header-left">
          <Link to="/app" className="user-app-logo">
            <BrandLogo size={40} />
            <span>{APP_NAME}</span>
          </Link>
          <div className="user-app-search">
            <Search size={20} className="text-[#65676b]" />
            <input type="text" placeholder="Search" aria-label="Search" />
          </div>
        </div>

        <nav className="user-app-nav">
          <Link
            to="/app"
            className={`user-app-nav-item ${isHome ? 'active' : ''}`}
            aria-label="Home"
          >
            <Home size={24} />
          </Link>
          <Link to="/app/friends" className="user-app-nav-item" aria-label="Friends">
            <Users size={24} />
          </Link>
          <Link to="/app/reels" className={`user-app-nav-item ${location.pathname === '/app/reels' ? 'active' : ''}`} aria-label="Short video">
            <PlayCircle size={24} />
          </Link>
          <Link to="/app/shop" className="user-app-nav-item" aria-label="Marketplace">
            <ShoppingBag size={24} />
          </Link>
          <Link to="/app/messages" className="user-app-nav-item" aria-label="Chat">
            <MessageCircle size={24} />
          </Link>
        </nav>

        <div className="user-app-header-right">
          <div className="user-app-dropdown" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="user-app-avatar"
              style={{ padding: 0, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <Avatar user={user} size={40} />
            </button>
            {menuOpen && (
              <ul className="user-app-dropdown-menu">
                <li>
                  <Link to="/app/profile" onClick={() => setMenuOpen(false)}>
                    <User size={20} />
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/app/settings" onClick={() => setMenuOpen(false)}>
                    <Settings size={20} />
                    Settings
                  </Link>
                </li>
                <li>
                  <button type="button" className="danger" onClick={handleLogout}>
                    <LogOut size={20} />
                    Log out
                  </button>
                </li>
              </ul>
            )}
          </div>
          <Link to="/app/notifications" className="user-app-icon-btn" aria-label="Notifications">
            <Bell size={20} />
            <span className="badge">1</span>
          </Link>
          <Link to="/app/settings" className="user-app-icon-btn" aria-label="Settings">
            <Settings size={20} />
          </Link>
        </div>
      </header>

      <div className="user-app-body">
        <aside className="user-app-sidebar">
          <ul className="user-app-sidebar-list">
            {leftNav.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="user-app-sidebar-link"
                >
                  <span className="icon-wrap">
                    <item.icon size={20} />
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className="user-app-main">
          <Outlet />
        </main>

        <nav className="user-app-bottom-nav" aria-label="Main navigation">
          <Link to="/app" className={`user-app-bottom-nav-item ${isHome ? 'active' : ''}`} aria-label="Home">
            <Home size={24} />
            <span>Home</span>
          </Link>
          <Link to="/app/friends" className="user-app-bottom-nav-item" aria-label="Friends">
            <Users size={24} />
            <span>Friends</span>
          </Link>
          <Link to="/app/reels" className={`user-app-bottom-nav-item ${location.pathname === '/app/reels' ? 'active' : ''}`} aria-label="Reels">
            <PlayCircle size={24} />
            <span>Reels</span>
          </Link>
          <Link to="/app/groups" className={`user-app-bottom-nav-item ${location.pathname.startsWith('/app/groups') ? 'active' : ''}`} aria-label="Groups">
            <Users size={24} />
            <span>Groups</span>
          </Link>
          <Link to="/app/messages" className="user-app-bottom-nav-item" aria-label="Messages">
            <MessageCircle size={24} />
            <span>Chat</span>
          </Link>
        </nav>

        <aside className="user-app-sidebar">
          <div className="user-app-right-section">
            <div className="user-app-right-section-header">
              <h3>Sponsored</h3>
              <button type="button" aria-label="More">⋯</button>
            </div>
            {sponsored.map((ad, i) => (
              <a key={i} href="#sponsored" className="user-app-sponsored-card">
                <div className="thumb" />
                <div>
                  <div className="title">{ad.title}</div>
                  <div className="desc">{ad.desc}</div>
                </div>
              </a>
            ))}
          </div>
          <div className="user-app-right-section">
            <div className="user-app-right-section-header">
              <h3>Contacts</h3>
              <button type="button" aria-label="More">⋯</button>
            </div>
            {contacts.map((name) => (
              <Link key={name} to="/app" className="user-app-contact">
                <Avatar user={{ name }} size={36} />
                <span className="name">{name}</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
