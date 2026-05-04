import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { FriendsListSkeleton } from '@/components/ui/FriendsListSkeleton';
import { FriendsGridSkeleton } from '@/components/ui/FriendsGridSkeleton';

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

function updateUserFollowingState(oldData, targetUserId, nextFollowing) {
  const applyToList = (list) =>
    list.map((u) => (u.id === targetUserId ? { ...u, isFollowing: nextFollowing } : u));

  if (Array.isArray(oldData)) {
    return applyToList(oldData);
  }

  if (oldData && Array.isArray(oldData.content)) {
    return { ...oldData, content: applyToList(oldData.content) };
  }

  if (oldData?.data && Array.isArray(oldData.data.content)) {
    return { ...oldData, data: { ...oldData.data, content: applyToList(oldData.data.content) } };
  }

  return oldData;
}

export default function Friends() {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('following');
  const [loadingId, setLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [contactsPhones, setContactsPhones] = useState('');
  const [contactsEmails, setContactsEmails] = useState('');
  const [contactsSubmitting, setContactsSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: users = [], isLoading: loading, error: followError } = useQuery({
    queryKey: ['friends', 'following', currentUser?.id],
    queryFn: () => getFollowing(currentUser.id, { page: 0, size: 50 }),
    select: (res) => (res?.content ?? []).map(normalizeUser),
    enabled: !!currentUser?.id,
  });

  const { data: suggested = [], isLoading: suggestedLoading } = useQuery({
    queryKey: ['friends', 'suggested'],
    queryFn: () => getSuggestedUsers({ page: 0, size: 20 }),
    select: (res) => (res?.content ?? []).map(normalizeUser),
  });

  const { data: nearby = [], isLoading: nearbyLoading } = useQuery({
    queryKey: ['friends', 'nearby'],
    queryFn: () => getNearbyUsers({ page: 0, size: 20 }),
    select: (res) => (res?.content ?? []).map(normalizeUser),
  });

  const { data: peopleYouMayKnow = [], isLoading: pymkLoading } = useQuery({
    queryKey: ['friends', 'pymk'],
    queryFn: () => getPeopleYouMayKnow({ page: 0, size: 20 }),
    select: (res) => {
      const list = res?.content ?? (Array.isArray(res) ? res : []);
      return list.map(normalizeUser);
    },
  });

  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ['friends', 'search', debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch, { page: 0, size: 30 }),
    select: (res) => (res?.content ?? []).map(normalizeUser),
    enabled: debouncedSearch.length > 0,
  });

  const error = followError ? (followError.response?.data?.message || followError.message || 'Failed to load') : '';

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
      await queryClient.invalidateQueries({ queryKey: ['friends', 'pymk'] });
    } catch {
      // keep modal open and allow retry
    }
    finally {
      setContactsSubmitting(false);
    }
  };

  const handleFollowToggle = async (user, queryKey) => {
    if (loadingId) return;
    setLoadingId(user.id);
    const nextFollowing = !user.isFollowing;
    try {
      queryClient.setQueryData(queryKey, (old) => updateUserFollowingState(old, user.id, nextFollowing));
      if (nextFollowing) await followUser(String(user.id));
      else await unfollowUser(String(user.id));
    } catch (err) {
      queryClient.setQueryData(queryKey, (old) => updateUserFollowingState(old, user.id, user.isFollowing));
      alert(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setLoadingId(null);
    }
  };

  const handleMessage = (user) => {
    navigate('/app/messages', { state: { openUser: user } });
  };

  const UserCard = ({ user, queryKey }) => (
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
            onClick={() => handleFollowToggle(user, queryKey)}
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

  const UserRow = ({ user, queryKey }) => (
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
          onClick={() => handleFollowToggle(user, queryKey)}
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
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`friends-fb-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={22} />
              <span>{tab.label}</span>
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
            {loading && <FriendsListSkeleton rows={6} />}
            {!loading && !error && users.length === 0 && (
              <p className="friends-fb-empty">You don&apos;t follow anyone yet. Find people in Suggestions or search.</p>
            )}
            {!loading && users.length > 0 && (
              <div className="friends-fb-list">
                {users.map((u) => (
                  <UserRow key={u.id} user={u} queryKey={['friends', 'following', currentUser?.id]} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'suggestions' && (
          <section className="friends-fb-section">
            <h2 className="friends-fb-section-title">Suggestions for you</h2>
            <p className="friends-fb-section-desc">People with similar location or interests</p>
            {suggestedLoading && <FriendsGridSkeleton cards={6} />}
            {!suggestedLoading && suggested.length === 0 && (
              <p className="friends-fb-empty">No suggestions right now. Add your location in profile.</p>
            )}
            {!suggestedLoading && suggested.length > 0 && (
              <div className="friends-fb-grid">
                {suggested.map((u) => (
                  <UserCard key={u.id} user={u} queryKey={['friends', 'suggested']} />
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
                {(searching || searchQuery.trim() !== debouncedSearch) && <FriendsGridSkeleton cards={6} />}
                {!searching && searchQuery.trim() === debouncedSearch && searchResults.length === 0 && (
                  <p className="friends-fb-empty">No users found. Try another search.</p>
                )}
                {!searching && searchQuery.trim() === debouncedSearch && searchResults.length > 0 && (
                  <div className="friends-fb-grid">
                    {searchResults.map((u) => (
                      <UserCard key={u.id} user={u} queryKey={['friends', 'search', debouncedSearch]} />
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
                {nearbyLoading && <FriendsGridSkeleton cards={6} />}
                {!nearbyLoading && nearby.length === 0 && (
                  <p className="friends-fb-empty">No one nearby. Add city/region in your profile.</p>
                )}
                {!nearbyLoading && nearby.length > 0 && (
                  <div className="friends-fb-grid">
                    {nearby.map((u) => (
                      <UserCard key={u.id} user={u} queryKey={['friends', 'nearby']} />
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
                {pymkLoading && <FriendsGridSkeleton cards={6} />}
                {!pymkLoading && peopleYouMayKnow.length === 0 && (
                  <p className="friends-fb-empty">Sync your contacts to find friends on Wakify.</p>
                )}
                {!pymkLoading && peopleYouMayKnow.length > 0 && (
                  <div className="friends-fb-grid">
                    {peopleYouMayKnow.map((u) => (
                      <UserCard key={u.id} user={u} queryKey={['friends', 'pymk']} />
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
