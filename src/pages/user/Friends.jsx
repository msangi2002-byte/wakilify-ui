import { useState, useEffect } from 'react';
import { getFriends, followUser, unfollowUser } from '@/lib/api/friends';

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
  };
}

export default function Friends() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getFriends({ page: 0, size: 20 })
      .then((list) => {
        if (!cancelled) setUsers(Array.isArray(list) ? list.map(normalizeFriend) : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load friends');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleFollowToggle = async (user) => {
    if (loadingId) return;
    setLoadingId(user.id);
    const nextFollowing = !user.isFollowing;
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isFollowing: nextFollowing } : u)));
    try {
      if (nextFollowing) await followUser(user.id);
      else await unfollowUser(user.id);
    } catch {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isFollowing: user.isFollowing } : u)));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="user-app-card">
      <div className="friends-list-header">
        <h1 className="friends-list-title">Friends</h1>
        <p className="friends-list-subtitle">People you follow and connect with</p>
      </div>
      {error && (
        <div className="friends-list-error" role="alert">
          {error}
        </div>
      )}
      {loading && (
        <p className="friends-list-loading">Loading friends…</p>
      )}
      {!loading && !error && users.length === 0 && (
        <p className="friends-list-empty">No friends yet. Find people to follow from the feed.</p>
      )}
      {!loading && users.length > 0 && (
        <ul className="friends-list">
          {users.map((user) => (
            <li key={user.id} className="friends-list-item">
              <UserAvatar user={user} size={48} />
              <div className="friends-list-info">
                <span className="friends-list-name">{user.name}</span>
                <span className="friends-list-username">@{user.username}</span>
              </div>
              <button
                type="button"
                className={`friends-list-follow-btn ${user.isFollowing ? 'following' : ''}`}
                onClick={() => handleFollowToggle(user)}
                disabled={loadingId === user.id}
              >
                {loadingId === user.id ? '…' : user.isFollowing ? 'Following' : 'Follow'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
