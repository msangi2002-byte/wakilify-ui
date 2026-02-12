import { useState, useEffect } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Users, ChevronRight, Plus, Search, Loader2, Check, X } from 'lucide-react';
import { getAllCommunities, getMyInvites, acceptInvite, declineInvite } from '@/lib/api/communities';
import '@/styles/user-app.css';

/** Sort so joined groups (isMember/member true) come first, then others. */
function sortJoinedFirst(list) {
  return [...list].sort((a, b) => {
    const aJoined = a.isMember === true || a.member === true;
    const bJoined = b.isMember === true || b.member === true;
    if (aJoined === bJoined) return 0;
    return aJoined ? -1 : 1;
  });
}

export default function GroupsLayout() {
  const { id } = useParams();
  const [groupSearch, setGroupSearch] = useState('');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [inviteActionId, setInviteActionId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const page = await getAllCommunities();
        const content = page.content ?? [];
        if (!cancelled) setGroups(sortJoinedFirst(content));
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message ?? 'Failed to load groups');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMyInvites({ page: 0, size: 20 })
      .then((res) => {
        if (!cancelled) setInvites(res?.content ?? []);
      })
      .catch(() => { if (!cancelled) setInvites([]); })
      .finally(() => { if (!cancelled) setInvitesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleAcceptInvite = async (inviteId) => {
    if (inviteActionId) return;
    setInviteActionId(inviteId);
    try {
      await acceptInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      const page = await getAllCommunities();
      setGroups(sortJoinedFirst(page.content ?? []));
    } catch (_) {}
    finally { setInviteActionId(null); }
  };

  const handleDeclineInvite = async (inviteId) => {
    if (inviteActionId) return;
    setInviteActionId(inviteId);
    try {
      await declineInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (_) {}
    finally { setInviteActionId(null); }
  };

  const filteredGroups = groups.filter((g) =>
    (g.name || '').toLowerCase().includes(groupSearch.trim().toLowerCase())
  );

  /* On mobile: show only list or only detail (like chat). Any :id route (group or create) = detail view. */
  const isDetailView = !!id;

  return (
    <div className={`groups-page ${isDetailView ? 'groups-mobile-detail-open' : ''}`}>
      <div className="groups-layout">
        <aside className="groups-sidebar">
          <div className="groups-sidebar-header">
            <h2 className="groups-sidebar-title">Groups</h2>
            <Link to="/app/groups/discover" className="groups-sidebar-see-all">
              See all
              <ChevronRight size={18} />
            </Link>
          </div>
          {invites.length > 0 && (
            <div className="groups-invites-section">
              <h3 className="groups-invites-title">Group invites</h3>
              <ul className="groups-invites-list">
                {invites.map((inv) => (
                  <li key={inv.id} className="groups-invites-item">
                    <div className="groups-invites-info">
                      <span className="groups-invites-group">{inv.communityName ?? 'Group'}</span>
                      <span className="groups-invites-inviter">{inv.inviterName ?? 'Someone'} invited you</span>
                    </div>
                    <div className="groups-invites-actions">
                      <button
                        type="button"
                        className="groups-invites-btn groups-invites-accept"
                        onClick={() => handleAcceptInvite(inv.id)}
                        disabled={inviteActionId === inv.id}
                        title="Accept"
                      >
                        {inviteActionId === inv.id ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <Check size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="groups-invites-btn groups-invites-decline"
                        onClick={() => handleDeclineInvite(inv.id)}
                        disabled={inviteActionId === inv.id}
                        title="Decline"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="groups-sidebar-search">
            <Search size={18} className="groups-search-icon" />
            <input
              type="text"
              placeholder="Search groups"
              aria-label="Search groups"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
            />
          </div>
          <ul className="groups-list">
            {loading ? (
              <li className="groups-list-empty">Loading groups…</li>
            ) : error ? (
              <li className="groups-list-empty">{error}</li>
            ) : filteredGroups.length === 0 ? (
              <li className="groups-list-empty">
                {groupSearch.trim() ? 'No groups match your search.' : 'No groups yet.'}
              </li>
            ) : (
              filteredGroups.map((g) => (
                <li key={g.id}>
                  <Link
                    to={`/app/groups/${g.id}`}
                    className={`groups-list-item ${id === g.id ? 'active' : ''}`}
                  >
                    <div className="groups-list-avatar">
                      {g.coverImage ? (
                        <img src={g.coverImage} alt="" />
                      ) : (
                        <Users size={24} />
                      )}
                    </div>
                    <div className="groups-list-info">
                      <span className="groups-list-name">{g.name}</span>
                      <span className="groups-list-meta">
                        {(g.membersCount ?? 0).toLocaleString()} members
                      </span>
                    </div>
                    <ChevronRight size={18} className="groups-list-chevron" />
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link to="/app/groups/create" className="groups-create-btn">
            <Plus size={20} />
            Create group
          </Link>
        </aside>

        <main className="groups-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
