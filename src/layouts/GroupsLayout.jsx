import { useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, ChevronRight, Plus, Search, Loader2, Check, X } from 'lucide-react';
import { getAllCommunities, getMyInvites, acceptInvite, declineInvite } from '@/lib/api/communities';
import { GroupsListSkeleton } from '@/components/ui/GroupsListSkeleton';
import '@/styles/user-app.css';
import '@/styles/theme-dark.css';

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
  const queryClient = useQueryClient();
  const [groupSearch, setGroupSearch] = useState('');
  const [inviteActionId, setInviteActionId] = useState(null);

  const { data: groups = [], isLoading: loading, error: groupsError } = useQuery({
    queryKey: ['groups', 'list'],
    queryFn: () => getAllCommunities(),
    select: (page) => sortJoinedFirst(page?.content ?? []),
  });

  const { data: invites = [] } = useQuery({
    queryKey: ['groups', 'invites'],
    queryFn: () => getMyInvites({ page: 0, size: 20 }),
    select: (res) => res?.content ?? [],
  });

  const error = groupsError ? (groupsError?.response?.data?.message ?? 'Failed to load groups') : null;

  const handleAcceptInvite = async (inviteId) => {
    if (inviteActionId) return;
    setInviteActionId(inviteId);
    try {
      await acceptInvite(inviteId);
      queryClient.setQueryData(['groups', 'invites'], (prev = []) => prev.filter((i) => i.id !== inviteId));
      await queryClient.invalidateQueries({ queryKey: ['groups', 'list'] });
    } catch (_) {}
    finally { setInviteActionId(null); }
  };

  const handleDeclineInvite = async (inviteId) => {
    if (inviteActionId) return;
    setInviteActionId(inviteId);
    try {
      await declineInvite(inviteId);
      queryClient.setQueryData(['groups', 'invites'], (prev = []) => prev.filter((i) => i.id !== inviteId));
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
              <GroupsListSkeleton rows={6} />
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
