import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getFollowing, followUser, unfollowUser } from '@/lib/api/friends';
import { searchUsers, getSuggestedUsers } from '@/lib/api/users';

function UserAvatar({ user, size = 48 }) {
  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="friends-list-avatar"
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

function normalizeFriend(item) {
  const user = item.user ?? item;
  return {
    id: user.id,
    name: user.name ?? user.username ?? 'User',
    username: user.username ?? user.name?.replace(/\s+/g, '_').toLowerCase(),
    profilePic: user.profilePic ?? user.avatar ?? user.image,
    isFollowing: item.isFollowing ?? true,
    region: user.region,
    country: user.country,
    age: user.age,
    interests: user.interests,
  };
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);

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
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load people you follow');
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
      if (nextFollowing) await followUser(user.id);
      else await unfollowUser(user.id);
    } catch {
      setList((prev) => prev.map((u) => (u.id === user.id ? { ...u, isFollowing: user.isFollowing } : u)));
    } finally {
      setLoadingId(null);
    }
  };

  const renderUserRow = (user, setList) => (
    <li key={user.id} className="friends-list-item">
      <UserAvatar user={user} size={48} />
      <div className="friends-list-info">
        <span className="friends-list-name">{user.name}</span>
        <span className="friends-list-username">@{user.username}</span>
        {(user.region || user.country || user.age != null) && (
          <span className="friends-list-meta">
            {[user.region, user.country].filter(Boolean).join(', ')}
            {user.age != null ? ` · ${user.age} yrs` : ''}
          </span>
        )}
      </div>
      <button
        type="button"
        className={`friends-list-follow-btn ${user.isFollowing ? 'following' : ''}`}
        onClick={() => handleFollowToggle(user, setList)}
        disabled={loadingId === user.id}
      >
        {loadingId === user.id ? '…' : user.isFollowing ? 'Following' : 'Follow'}
      </button>
    </li>
  );

  return (
    <div className="user-app-card">
      <div className="friends-list-header">
        <h1 className="friends-list-title">Friends</h1>
        <p className="friends-list-subtitle">People you follow and connect with</p>
      </div>

      <div className="friends-search-wrap">
        <input
          type="search"
          className="friends-search-input"
          placeholder="Search any user (A–Z)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search users"
        />
        {searching && <span className="friends-search-loading">Searching…</span>}
      </div>

      {searchQuery.trim() && (
        <section className="friends-section" aria-label="Search results">
          <h2 className="friends-section-title">Search results</h2>
          {searching && searchResults.length === 0 && (
            <p className="friends-list-loading">Searching…</p>
          )}
          {!searching && searchResults.length === 0 && (
            <p className="friends-list-empty">No users found. Try another name.</p>
          )}
          {!searching && searchResults.length > 0 && (
            <ul className="friends-list">
              {searchResults.map((u) => renderUserRow(u, setSearchResults))}
            </ul>
          )}
        </section>
      )}

      <section className="friends-section" aria-label="People you may know">
        <h2 className="friends-section-title">People you may know</h2>
        {suggestedLoading && <p className="friends-list-loading">Loading…</p>}
        {!suggestedLoading && suggested.length === 0 && (
          <p className="friends-list-empty">No suggestions right now. Try searching for users above.</p>
        )}
        {!suggestedLoading && suggested.length > 0 && (
          <ul className="friends-list">
            {suggested.map((u) => renderUserRow(u, setSuggested))}
          </ul>
        )}
      </section>

      <section className="friends-section" aria-label="People you follow">
        <h2 className="friends-section-title">People you follow</h2>
      </section>
      {error && (
        <div className="friends-list-error" role="alert">
          {error}
        </div>
      )}
      {loading && (
        <p className="friends-list-loading">Loading friends…</p>
      )}
      {!loading && !error && users.length === 0 && (
        <p className="friends-list-empty">You don't follow anyone yet. Find people from the search or suggestions above.</p>
      )}
      {!loading && users.length > 0 && (
        <ul className="friends-list">
          {users.map((user) => renderUserRow(user, setUsers))}
        </ul>
      )}
    </div>
  );
}
