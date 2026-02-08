import { useState } from 'react';

// Mock users to follow – replace with API (e.g. /api/v1/users/search) later
const MOCK_USERS = [
  { id: '1', name: 'Sarah Mwangi', username: 'sarah_m', isFollowing: false },
  { id: '2', name: 'Juma Bakari', username: 'juma_b', isFollowing: true },
  { id: '3', name: 'Amina Hassan', username: 'amina_h', isFollowing: false },
  { id: '4', name: 'Peter Okello', username: 'peter_o', isFollowing: false },
  { id: '5', name: 'Grace Kimaro', username: 'grace_k', isFollowing: false },
  { id: '6', name: 'David Mushi', username: 'david_m', isFollowing: false },
];

function UserAvatar({ user, size = 48 }) {
  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
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

export default function Friends() {
  const [users, setUsers] = useState(MOCK_USERS);

  const handleFollow = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isFollowing: !u.isFollowing } : u))
    );
  };

  return (
    <div className="user-app-card">
      <div className="friends-list-header">
        <h1 className="friends-list-title">People to follow</h1>
        <p className="friends-list-subtitle">Discover and connect with others</p>
      </div>
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
              onClick={() => handleFollow(user.id)}
            >
              {user.isFollowing ? 'Following' : 'Follow'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
