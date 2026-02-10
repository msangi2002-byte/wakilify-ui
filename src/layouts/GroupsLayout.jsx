import { useState, useEffect } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { Users, ChevronRight, Plus, Search } from 'lucide-react';
import { getAllCommunities } from '@/lib/api/communities';
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
                      <Users size={24} />
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
