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
  Sparkles,
  Building2,
  Package,
  LayoutGrid,
  X,
  Shield,
} from 'lucide-react';
import { ROLES } from '@/types/roles';
import { useAuthStore } from '@/store/auth.store';
import { logout as logoutApi } from '@/lib/api/auth';
import { getIncomingCalls, answerCall, rejectCall } from '@/lib/api/calls';
import { searchUsers, getPeopleYouMayKnow, recordActivity } from '@/lib/api/users';
import { followUser, getMutualFollows } from '@/lib/api/friends';
import { getActiveAds, recordImpression, recordClick } from '@/lib/api/ads';
import { getAllCommunities } from '@/lib/api/communities';
import { getUnreadCount as getNotificationUnreadCount } from '@/lib/api/notifications';
import IncomingCallModal from '@/components/call/IncomingCallModal';
import { APP_NAME, LOGO_PNG, LOGO_ICON } from '@/lib/constants/brand';
import { clearAuth } from '@/store/auth.store';
import '@/styles/user-app.css';
import '@/styles/theme-dark.css';

const POLL_INTERVAL_MS = 2500;

const SAMPLE_SPONSORED = [
  { id: 'sample-1', title: 'Discover Wakilify Shop', description: 'Find products from local sellers.', imageUrl: 'https://picsum.photos/seed/ads1/240/240', targetUrl: '/app/shop' },
  { id: 'sample-2', title: 'Join Live Streams', description: 'Watch and connect with creators.', imageUrl: 'https://picsum.photos/seed/ads2/240/240', targetUrl: '/app/live' },
  { id: 'sample-3', title: 'Create Your Group', description: 'Connect with people who share your interests.', imageUrl: 'https://picsum.photos/seed/ads3/240/240', targetUrl: '/app/groups' },
];

const leftNav = [
  { to: '/app/profile', icon: User, label: 'Profile' },
  { to: '/app/friends', icon: Users, label: 'Friends' },
  { to: '/app/live', icon: Radio, label: 'Live' },
  { to: '/app/groups', icon: Users, label: 'Groups' },
  { to: '/app/shop', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/app/orders', icon: Package, label: 'My Orders' },
  { to: '/app/notifications', icon: Bell, label: 'Notifications' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
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
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [navMenuSearch, setNavMenuSearch] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callActionLoading, setCallActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ people: [], groups: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sponsoredAds, setSponsoredAds] = useState([]);
  const [sponsoredLoading, setSponsoredLoading] = useState(false);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState([]);
  const [mutualFollows, setMutualFollows] = useState([]);
  const [pymkLoading, setPymkLoading] = useState(false);
  const [followLoadingId, setFollowLoadingId] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const impressedAdIds = useRef(new Set());
  const menuRef = useRef(null);
  const navMenuRef = useRef(null);
  const searchRef = useRef(null);

  const navItems = [
    ...leftNav,
    ...(String(user?.role ?? '').toLowerCase() === ROLES.AGENT
      ? [{ to: '/agent', icon: Sparkles, label: 'Agent Dashboard' }]
      : []),
  ];
  const filteredNavItems = navMenuSearch.trim()
    ? navItems.filter((item) => item.label.toLowerCase().includes(navMenuSearch.toLowerCase().trim()))
    : navItems;

  const isHome = location.pathname === '/app' || location.pathname === '/app/';
  const isOnCallPage = location.pathname.startsWith('/app/call');

  useEffect(() => {
    if (!user?.id) return;
    recordActivity().catch(() => {});
    const id = setInterval(() => {
      recordActivity().catch(() => {});
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [user?.id]);

  // Fetch unread notification count
  const isNotificationsPage = location.pathname === '/app/notifications';
  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationCount(0);
      return;
    }
    
    const fetchUnreadCount = async () => {
      try {
        const count = await getNotificationUnreadCount();
        setUnreadNotificationCount(typeof count === 'number' ? count : (count?.count ?? 0));
      } catch {
        setUnreadNotificationCount(0);
      }
    };

    fetchUnreadCount();
    // Poll every 30 seconds for new notifications (or every 5 seconds if on notifications page)
    const pollInterval = isNotificationsPage ? 5000 : 30000;
    const interval = setInterval(fetchUnreadCount, pollInterval);
    return () => clearInterval(interval);
  }, [user?.id, isNotificationsPage]);

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

  useEffect(() => {
    if (!navMenuOpen) return;
    function handleClickOutside(e) {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target)) setNavMenuOpen(false);
    }
    const id = setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [navMenuOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    }
    const id = setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [searchOpen]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults({ people: [], groups: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(() => {
      let cancelled = false;
      Promise.all([
        searchUsers(q, { page: 0, size: 15 }).then((res) => {
          const content = res?.content ?? [];
          return Array.isArray(content) ? content : [];
        }),
        getAllCommunities({ page: 0, size: 50 }).then((page) => {
          const list = page?.content ?? [];
          const arr = Array.isArray(list) ? list : [];
          const lower = q.toLowerCase();
          return arr.filter((g) => (g.name || '').toLowerCase().includes(lower));
        }),
      ])
        .then(([people, groups]) => {
          if (!cancelled) setSearchResults({ people, groups });
        })
        .catch(() => {
          if (!cancelled) setSearchResults({ people: [], groups: [] });
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
      return () => { cancelled = true; };
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    setSponsoredLoading(true);
    getActiveAds({ type: 'FEED', limit: 5 })
      .then((list) => {
        if (!cancelled) setSponsoredAds(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setSponsoredAds([]);
      })
      .finally(() => {
        if (!cancelled) setSponsoredLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPymkLoading(true);
    Promise.all([
      getMutualFollows({ page: 0, size: 20 }),
      getPeopleYouMayKnow({ page: 0, size: 15 }).then((res) => res?.content ?? []),
    ])
      .then(([mutual, pymk]) => {
        const mutualList = Array.isArray(mutual) ? mutual : [];
        const pymkList = Array.isArray(pymk) ? pymk : [];
        const mutualIds = new Set(mutualList.map((u) => u.id));
        const rest = pymkList.filter((u) => !mutualIds.has(u.id));
        rest.sort((a, b) => {
          const aOnline = a.isOnline === true;
          const bOnline = b.isOnline === true;
          if (aOnline !== bOnline) return aOnline ? -1 : 1;
          const aSeen = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
          const bSeen = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
          return bSeen - aSeen;
        });
        if (!cancelled) {
          setMutualFollows(
            mutualList.sort((a, b) => {
              const aOnline = a.isOnline === true;
              const bOnline = b.isOnline === true;
              if (aOnline !== bOnline) return aOnline ? -1 : 1;
              const aSeen = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
              const bSeen = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
              return bSeen - aSeen;
            })
          );
          setPeopleYouMayKnow(rest);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMutualFollows([]);
          setPeopleYouMayKnow([]);
        }
      })
      .finally(() => {
        if (!cancelled) setPymkLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleAdClick = (ad) => {
    if (!ad) return;
    if (ad.id && !String(ad.id).startsWith('sample-')) recordClick(ad.id).catch(() => {});
    if (ad.targetUrl) {
      if (ad.targetUrl.startsWith('/')) navigate(ad.targetUrl);
      else window.open(ad.targetUrl, '_blank', 'noopener');
    }
  };

  const handleFollowContact = async (u) => {
    const id = u?.id;
    if (!id || followLoadingId) return;
    setFollowLoadingId(id);
    try {
      await followUser(id);
      setPeopleYouMayKnow((prev) => prev.filter((p) => p.id !== id));
    } catch (_) {
      // keep in list
    } finally {
      setFollowLoadingId(null);
    }
  };

  const recordAdImpression = (adId) => {
    if (!adId || impressedAdIds.current.has(adId)) return;
    impressedAdIds.current.add(adId);
    recordImpression(adId).catch(() => {});
  };

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
          <div className={`user-app-search-wrap ${searchOpen ? 'expanded' : ''}`} ref={searchRef}>
            <div
              className="user-app-search"
              onClick={() => setSearchOpen(true)}
              onFocus={() => setSearchOpen(true)}
              role="search"
            >
              <span className="user-app-search-icon-wrap" aria-hidden="true">
                <Search size={20} className="user-app-search-icon" strokeWidth={2} />
              </span>
              <input
                type="text"
                placeholder="Search people or groups"
                aria-label="Search people or groups"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                className="user-app-search-input"
              />
            </div>
            {searchOpen && (
              <>
                <div className="user-app-search-overlay-mobile" onClick={() => setSearchOpen(false)} aria-hidden />
                <div className="user-app-search-overlay-mobile-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="user-app-search-overlay-header">
                    <div className="user-app-search-overlay-input-wrap">
                      <Search size={20} className="user-app-search-overlay-icon" />
                      <input
                        type="text"
                        placeholder="Search people or groups"
                        aria-label="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="user-app-search-overlay-input"
                        autoFocus
                      />
                    </div>
                    <button type="button" className="user-app-search-overlay-close" onClick={() => setSearchOpen(false)} aria-label="Close">
                      <X size={22} />
                    </button>
                  </div>
                  <div className="user-app-search-overlay-results">
                    {searchLoading ? (
                      <div className="global-search-loading">Searching…</div>
                    ) : !searchQuery.trim() ? (
                      <div className="global-search-hint">Type to search for people or groups</div>
                    ) : (
                      <>
                        {searchResults.people.length > 0 && (
                          <div className="global-search-section">
                            <div className="global-search-section-title">People</div>
                            <ul className="global-search-list">
                              {searchResults.people.map((u) => (
                                <li key={u.id}>
                                  <Link
                                    to={`/app/profile/${u.id}`}
                                    className="global-search-item"
                                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                  >
                                    <Avatar user={u} size={36} className="global-search-avatar" />
                                    <span className="global-search-item-name">{u.name ?? u.username ?? 'User'}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {searchResults.groups.length > 0 && (
                          <div className="global-search-section">
                            <div className="global-search-section-title">Groups</div>
                            <ul className="global-search-list">
                              {searchResults.groups.map((g) => (
                                <li key={g.id}>
                                  <Link
                                    to={`/app/groups/${g.id}`}
                                    className="global-search-item"
                                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                  >
                                    <div className="global-search-group-icon">
                                      <Users size={20} />
                                    </div>
                                    <span className="global-search-item-name">{g.name ?? 'Group'}</span>
                                    {(g.membersCount ?? g.members_count) != null && (
                                      <span className="global-search-item-meta">
                                        {(g.membersCount ?? g.members_count).toLocaleString()} members
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {!searchLoading && searchQuery.trim() && searchResults.people.length === 0 && searchResults.groups.length === 0 && (
                          <div className="global-search-empty">No people or groups found</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
            {searchOpen && (
              <div className="global-search-dropdown">
                {searchLoading ? (
                  <div className="global-search-loading">Searching…</div>
                ) : !searchQuery.trim() ? (
                  <div className="global-search-hint">Type to search for people or groups</div>
                ) : (
                  <>
                    {searchResults.people.length > 0 && (
                      <div className="global-search-section">
                        <div className="global-search-section-title">People</div>
                        <ul className="global-search-list">
                          {searchResults.people.map((u) => (
                            <li key={u.id}>
                              <Link
                                to={`/app/profile/${u.id}`}
                                className="global-search-item"
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                              >
                                <Avatar user={u} size={36} className="global-search-avatar" />
                                <span className="global-search-item-name">{u.name ?? u.username ?? 'User'}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {searchResults.groups.length > 0 && (
                      <div className="global-search-section">
                        <div className="global-search-section-title">Groups</div>
                        <ul className="global-search-list">
                          {searchResults.groups.map((g) => (
                            <li key={g.id}>
                              <Link
                                to={`/app/groups/${g.id}`}
                                className="global-search-item"
                                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                              >
                                <div className="global-search-group-icon">
                                  <Users size={20} />
                                </div>
                                <span className="global-search-item-name">{g.name ?? 'Group'}</span>
                                {(g.membersCount ?? g.members_count) != null && (
                                  <span className="global-search-item-meta">
                                    {(g.membersCount ?? g.members_count).toLocaleString()} members
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!searchLoading && searchQuery.trim() && searchResults.people.length === 0 && searchResults.groups.length === 0 && (
                      <div className="global-search-empty">No people or groups found</div>
                    )}
                  </>
                )}
              </div>
            )}
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
          <div className={`user-app-dropdown user-app-nav-menu-wrap ${navMenuOpen ? 'open' : ''}`} ref={navMenuRef}>
            <button
              type="button"
              onClick={() => { setNavMenuOpen((o) => !o); setNavMenuSearch(''); }}
              className="user-app-icon-btn user-app-menu-btn"
              aria-expanded={navMenuOpen}
              aria-haspopup="true"
              aria-label="Menu"
            >
              <LayoutGrid size={20} />
            </button>
            {navMenuOpen && (
              <>
                <div className="user-app-nav-drawer-backdrop" onClick={() => setNavMenuOpen(false)} aria-hidden />
                <div className="user-app-nav-drawer">
                <div className="user-app-nav-drawer-header">
                  <h3 className="user-app-nav-drawer-title">Menu</h3>
                  <button type="button" className="user-app-nav-drawer-close" onClick={() => setNavMenuOpen(false)} aria-label="Close">
                    <X size={22} />
                  </button>
                </div>
                <div className="user-app-nav-drawer-search">
                  <Search size={18} className="user-app-nav-drawer-search-icon" />
                  <input
                    type="text"
                    placeholder="Search menu…"
                    value={navMenuSearch}
                    onChange={(e) => setNavMenuSearch(e.target.value)}
                    className="user-app-nav-drawer-search-input"
                    aria-label="Search menu"
                  />
                </div>
                <nav className="user-app-nav-drawer-list">
                  {filteredNavItems.length > 0 ? (
                    filteredNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to || (item.to.length > 1 && location.pathname.startsWith(item.to + '/'));
                      return (
                        <Link
                          key={item.to + item.label}
                          to={item.to}
                          className={`user-app-nav-drawer-item ${isActive ? 'active' : ''}`}
                          onClick={() => setNavMenuOpen(false)}
                        >
                          <span className="user-app-nav-drawer-icon">
                            <Icon size={22} />
                          </span>
                          <span className="user-app-nav-drawer-label">{item.label}</span>
                          {item.label === 'Notifications' && unreadNotificationCount > 0 && (
                            <span className="user-app-nav-drawer-badge">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>
                          )}
                        </Link>
                      );
                    })
                  ) : (
                    <p className="user-app-nav-drawer-empty">No results for &quot;{navMenuSearch}&quot;</p>
                  )}
                </nav>
                </div>
              </>
            )}
          </div>
          <Link to="/app/notifications" className="user-app-icon-btn" aria-label="Notifications">
            <Bell size={20} />
            {unreadNotificationCount > 0 && (
              <span className="badge">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          </Link>
          <div className="user-app-dropdown" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="user-app-avatar"
              style={{ padding: 0, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Profile menu"
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
                {String(user?.role ?? '').toLowerCase() === ROLES.AGENT && (
                  <li>
                    <Link to="/agent" onClick={() => setMenuOpen(false)}>
                      <Sparkles size={20} />
                      Agent Dashboard
                    </Link>
                  </li>
                )}
                {String(user?.role ?? '').toLowerCase() === ROLES.BUSINESS && (
                  <li>
                    <Link to="/business" onClick={() => setMenuOpen(false)}>
                      <Building2 size={20} />
                      Business Dashboard
                    </Link>
                  </li>
                )}
                {String(user?.role ?? '').toLowerCase() === ROLES.ADMIN && (
                  <li>
                    <Link to="/admin" onClick={() => setMenuOpen(false)}>
                      <Shield size={20} />
                      Admin Dashboard
                    </Link>
                  </li>
                )}
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
          <Link to="/app/settings" className="user-app-icon-btn user-app-header-settings" aria-label="Settings">
            <Settings size={20} />
          </Link>
        </div>
      </header>

      <div className={`user-app-body ${location.pathname.startsWith('/app/shop') ? 'user-app-body-shop' : ''}`}>
        {!location.pathname.startsWith('/app/shop') && (
          <aside className="user-app-sidebar">
            <ul className="user-app-sidebar-list">
              {[
                ...leftNav,
                ...(String(user?.role ?? '').toLowerCase() === ROLES.AGENT
                  ? [{ to: '/agent', icon: Sparkles, label: 'Agent Dashboard' }]
                  : []),
                ...(String(user?.role ?? '').toLowerCase() === ROLES.ADMIN
                  ? [{ to: '/admin', icon: Shield, label: 'Admin Dashboard' }]
                  : []),
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to + item.label}>
                    <Link
                      to={item.to}
                      className="user-app-sidebar-link"
                    >
                      <span className="icon-wrap">
                        <Icon size={20} />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}

        <main className={`user-app-main ${location.pathname.startsWith('/app/shop') ? 'user-app-main-no-left-sidebar' : ''}`}>
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
            </div>
            {sponsoredLoading ? (
              <div className="user-app-right-loading">Loading…</div>
            ) : (
              (sponsoredAds.length === 0 ? SAMPLE_SPONSORED : sponsoredAds).map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  className="user-app-sponsored-card"
                  onClick={() => handleAdClick(ad)}
                  ref={(el) => el && !String(ad.id).startsWith('sample-') && recordAdImpression(ad.id)}
                >
                  <div className="thumb">
                    {ad.imageUrl ? (
                      <img src={ad.imageUrl} alt="" />
                    ) : (
                      <div style={{ background: 'var(--surface)', width: '100%', height: '100%' }} />
                    )}
                  </div>
                  <div>
                    <span className="user-app-sponsored-label">Sponsored</span>
                    <div className="title">{ad.title}</div>
                    <div className="desc">{ad.description || ''}</div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="user-app-right-section">
            <div className="user-app-right-section-header">
              <h3>People you may know</h3>
              <Link to="/app/friends" className="user-app-right-see-all">See all</Link>
            </div>
            {pymkLoading ? (
              <div className="user-app-right-loading">Loading…</div>
            ) : mutualFollows.length === 0 && peopleYouMayKnow.length === 0 ? (
              <div className="user-app-right-empty">No suggestions</div>
            ) : (
              <>
                {mutualFollows.map((u) => (
                  <div key={u.id} className="user-app-contact-row">
                    <Link to={`/app/profile/${u.id}`} className="user-app-contact">
                      <span className="user-app-avatar-wrap">
                        <Avatar user={u} size={36} />
                        {u.isOnline && <span className="user-app-online-dot" aria-label="Online" />}
                      </span>
                      <span className="name">{u.name ?? u.username ?? 'User'}</span>
                    </Link>
                    <span className="user-app-follow-badge">Friends</span>
                  </div>
                ))}
                {peopleYouMayKnow.map((u) => (
                  <div key={u.id} className="user-app-contact-row">
                    <Link to={`/app/profile/${u.id}`} className="user-app-contact">
                      <span className="user-app-avatar-wrap">
                        <Avatar user={u} size={36} />
                        {u.isOnline && <span className="user-app-online-dot" aria-label="Online" />}
                      </span>
                      <span className="name">{u.name ?? u.username ?? 'User'}</span>
                    </Link>
                    <button
                      type="button"
                      className="user-app-follow-btn"
                      onClick={(e) => { e.preventDefault(); handleFollowContact(u); }}
                      disabled={followLoadingId === u.id}
                    >
                      {followLoadingId === u.id ? '…' : 'Follow'}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
