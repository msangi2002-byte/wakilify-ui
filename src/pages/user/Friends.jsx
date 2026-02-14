import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users, UserPlus, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getFollowing, followUser, unfollowUser } from '@/lib/api/friends';
import {
  searchUsers,
  getSuggestedUsers,
  getNearbyUsers,
  getPeopleYouMayKnow,
  uploadContacts,
} from '@/lib/api/users';

const TABS = [
  { id: 'following', label: 'Following', icon: Users },
  { id: 'suggestions', label: 'Suggestions', icon: UserPlus },
  { id: 'find', label: 'Find', icon: Search },
];

function UserAvatar({ user, size = 48 }) {
  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="friends-fb-avatar"
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
        flexShrink: 0,
      }}
    >
      {user?.profilePic ? (
        <img src={user.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initial
      )}
    </div>
  );
}

function normalizeUser(u) {
  return {
    id: u.id,
    name: u.name ?? 'User',
    username: (u.username ?? u.name?.replace(/\s+/g, '_').toLowerCase()) ?? 'user',
    profilePic: u.profilePic ?? u.avatar ?? u.image,
    isFollowing: u.isFollowing ?? false,
    region: u.region,
    country: u.country,
    age: u.age,
    interests: u.interests,
  };
}

export default function Friends() {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('following');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [nearby, setNearby] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState([]);
  const [pymkLoading, setPymkLoading] = useState(false);
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [contactsPhones, setContactsPhones] = useState('');
  const [contactsEmails, setContactsEmails] = useState('');
  const [contactsSubmitting, setContactsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!currentUser?.id) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getFollowing(currentUser.id, { page: 0, size: 50 })
      .then((res) => {
        if (!cancelled && res?.content) setUsers(res.content.map(normalizeUser));
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    let cancelled = false;
    setSuggestedLoading(true);
    getSuggestedUsers({ page: 0, size: 20 })
      .then((res) => {
        if (!cancelled && res?.content) setSuggested(res.content.map(normalizeUser));
      })
      .catch(() => {
        if (!cancelled) setSuggested([]);
      })
      .finally(() => {
        if (!cancelled) setSuggestedLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setNearbyLoading(true);
    getNearbyUsers({ page: 0, size: 20 })
      .then((res) => {
        if (!cancelled && res?.content) setNearby(res.content.map(normalizeUser));
      })
      .catch(() => {
        if (!cancelled) setNearby([]);
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPymkLoading(true);
    getPeopleYouMayKnow({ page: 0, size: 20 })
      .then((res) => {
        if (!cancelled && res?.content) setPeopleYouMayKnow(res.content.map(normalizeUser));
      })
      .catch(() => {
        if (!cancelled) setPeopleYouMayKnow([]);
      })
      .finally(() => {
        if (!cancelled) setPymkLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleUploadContacts = async () => {
    const phones = contactsPhones.trim().split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    const emails = contactsEmails.trim().split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (phones.length === 0 && emails.length === 0) return;
    setContactsSubmitting(true);
    try {
      await uploadContacts({ phones, emails });
      setContactsModalOpen(false);
      setContactsPhones('');
      setContactsEmails('');
      setPymkLoading(true);
      const res = await getPeopleYouMayKnow({ page: 0, size: 20 });
      setPeopleYouMayKnow((res?.content ?? []).map(normalizeUser));
    } catch (_) {}
    finally {
      setContactsSubmitting(false);
      setPymkLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchUsers(searchQuery.trim(), { page: 0, size: 30 })
        .then((res) => {
          if (!cancelled && res?.content) setSearchResults(res.content.map(normalizeUser));
          else if (!cancelled) setSearchResults([]);
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleFollowToggle = async (user, setList) => {
    if (loadingId) return;
    setLoadingId(user.id);
    const nextFollowing = !user.isFollowing;
    setList((prev) => prev.map((u) => (u.id === user.id ? { ...u, isFollowing: nextFollowing } : u)));
    try {
      if (nextFollowing) await followUser(String(user.id));
      else await unfollowUser(String(user.id));
    } catch (err) {
      setList((prev) => prev.map((u) => (u.id === user.id ? { ...u, isFollowing: user.isFollowing } : u)));
      alert(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMessage = (user) => {
    navigate('/app/messages', { state: { openUser: user } });
  };

  const UserCard = ({ user, setList }) => (
    <div className="friends-fb-card">
      <Link to={`/app/profile/${user.id}`} className="friends-fb-card-avatar-wrap">
        <UserAvatar user={user} size={72} />
      </Link>
      <div className="friends-fb-card-body">
        <Link to={`/app/profile/${user.id}`} className="friends-fb-card-name">
          {user.name}
        </Link>
        <span className="friends-fb-card-username">@{user.username}</span>
        {(user.region || user.country) && (
          <span className="friends-fb-card-meta">
            {[user.region, user.country].filter(Boolean).join(' · ')}
          </span>
        )}
        <div className="friends-fb-card-actions">
          <button
            type="button"
            className={`friends-fb-btn ${user.isFollowing ? 'following' : 'follow'}`}
            onClick={() => handleFollowToggle(user, setList)}
            disabled={loadingId === user.id}
          >
            {loadingId === user.id ? '…' : user.isFollowing ? 'Following' : 'Add friend'}
          </button>
          <button
            type="button"
            className="friends-fb-btn secondary"
            onClick={() => handleMessage(user)}
          >
            Message
          </button>
        </div>
      </div>
    </div>
  );

  const UserRow = ({ user, setList }) => (
    <div className="friends-fb-row">
      <Link to={`/app/profile/${user.id}`} className="friends-fb-row-left">
        <UserAvatar user={user} size={48} />
        <div className="friends-fb-row-info">
          <span className="friends-fb-row-name">{user.name}</span>
          <span className="friends-fb-row-username">@{user.username}</span>
          {(user.region || user.country) && (
            <span className="friends-fb-row-meta">
              {[user.region, user.country].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </Link>
      <div className="friends-fb-row-actions">
        <button
          type="button"
          className={`friends-fb-btn small ${user.isFollowing ? 'following' : 'follow'}`}
          onClick={() => handleFollowToggle(user, setList)}
          disabled={loadingId === user.id}
        >
          {loadingId === user.id ? '…' : user.isFollowing ? 'Following' : 'Add friend'}
        </button>
        <button type="button" className="friends-fb-btn small secondary" onClick={() => handleMessage(user)}>
          Message
        </button>
      </div>
    </div>
  );

  return (
    <div className="user-app-card friends-fb-page">
      <div className="friends-fb-sidebar">
        <h1 className="friends-fb-sidebar-title">Friends</h1>
        <nav className="friends-fb-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`friends-fb-tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="friends-fb-main">
        <div className="friends-fb-search-wrap">
          <Search size={20} className="friends-fb-search-icon" />
          <input
            type="search"
            className="friends-fb-search-input"
            placeholder="Search people"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search"
          />
        </div>

        {activeTab === 'following' && (
          <section className="friends-fb-section">
            <h2 className="friends-fb-section-title">People you follow</h2>
            {error && <p className="friends-fb-error">{error}</p>}
            {loading && <p className="friends-fb-loading">Loading…</p>}
            {!loading && !error && users.length === 0 && (
              <p className="friends-fb-empty">You don&apos;t follow anyone yet. Find people in Suggestions or search.</p>
            )}
            {!loading && users.length > 0 && (
              <div className="friends-fb-list">
                {users.map((u) => (
                  <UserRow key={u.id} user={u} setList={setUsers} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'suggestions' && (
          <section className="friends-fb-section">
            <h2 className="friends-fb-section-title">Suggestions for you</h2>
            <p className="friends-fb-section-desc">People with similar location or interests</p>
            {suggestedLoading && <p className="friends-fb-loading">Loading…</p>}
            {!suggestedLoading && suggested.length === 0 && (
              <p className="friends-fb-empty">No suggestions right now. Add your location in profile.</p>
            )}
            {!suggestedLoading && suggested.length > 0 && (
              <div className="friends-fb-grid">
                {suggested.map((u) => (
                  <UserCard key={u.id} user={u} setList={setSuggested} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'find' && (
          <section className="friends-fb-section">
            {searchQuery.trim() ? (
              <>
                <h2 className="friends-fb-section-title">Search results</h2>
                {searching && <p className="friends-fb-loading">Searching…</p>}
                {!searching && searchResults.length === 0 && (
                  <p className="friends-fb-empty">No users found. Try another search.</p>
                )}
                {!searching && searchResults.length > 0 && (
                  <div className="friends-fb-grid">
                    {searchResults.map((u) => (
                      <UserCard key={u.id} user={u} setList={setSearchResults} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="friends-fb-section-header">
                  <h2 className="friends-fb-section-title">People nearby</h2>
                  <span className="friends-fb-section-hint">Same region or country</span>
                </div>
                {nearbyLoading && <p className="friends-fb-loading">Loading…</p>}
                {!nearbyLoading && nearby.length === 0 && (
                  <p className="friends-fb-empty">No one nearby. Add city/region in your profile.</p>
                )}
                {!nearbyLoading && nearby.length > 0 && (
                  <div className="friends-fb-grid">
                    {nearby.map((u) => (
                      <UserCard key={u.id} user={u} setList={setNearby} />
                    ))}
                  </div>
                )}

                <div className="friends-fb-section-header" style={{ marginTop: 32 }}>
                  <h2 className="friends-fb-section-title">People you may know</h2>
                  <button
                    type="button"
                    className="friends-fb-sync-btn"
                    onClick={() => setContactsModalOpen(true)}
                  >
                    <Phone size={16} />
                    Sync contacts
                  </button>
                </div>
                {pymkLoading && <p className="friends-fb-loading">Loading…</p>}
                {!pymkLoading && peopleYouMayKnow.length === 0 && (
                  <p className="friends-fb-empty">Sync your contacts to find friends on Wakify.</p>
                )}
                {!pymkLoading && peopleYouMayKnow.length > 0 && (
                  <div className="friends-fb-grid">
                    {peopleYouMayKnow.map((u) => (
                      <UserCard key={u.id} user={u} setList={setPeopleYouMayKnow} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>

      {contactsModalOpen && (
        <div className="friends-modal-overlay friends-fb-modal-overlay" onClick={() => setContactsModalOpen(false)} role="dialog">
          <div className="friends-modal friends-fb-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Sync contacts</h3>
            <p className="friends-modal-desc">Phones and emails are stored hashed. We match with Wakify users only.</p>
            <label>
              <span>Phones (one per line or comma-separated)</span>
              <textarea
                value={contactsPhones}
                onChange={(e) => setContactsPhones(e.target.value)}
                placeholder="+255712345678"
                rows={3}
                className="friends-modal-input"
              />
            </label>
            <label>
              <span>Emails</span>
              <textarea
                value={contactsEmails}
                onChange={(e) => setContactsEmails(e.target.value)}
                placeholder="friend@example.com"
                rows={2}
                className="friends-modal-input"
              />
            </label>
            <div className="friends-modal-actions">
              <button type="button" className="friends-btn-secondary" onClick={() => setContactsModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="friends-btn-primary"
                onClick={handleUploadContacts}
                disabled={contactsSubmitting || (!contactsPhones.trim() && !contactsEmails.trim())}
              >
                {contactsSubmitting ? 'Syncing…' : 'Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
