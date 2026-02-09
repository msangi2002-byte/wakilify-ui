import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getStories } from '@/lib/api/posts';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/user-app.css';

function groupStoriesByAuthor(stories, currentUserId) {
  const map = new Map();
  for (const s of stories) {
    const author = s.author ?? {};
    const id = author.id ?? s.authorId;
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, { authorId: id, author: { id: author.id, name: author.name, profilePic: author.profilePic }, stories: [] });
    }
    map.get(id).stories.push(s);
  }
  const list = Array.from(map.values());
  for (const g of list) {
    g.stories.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
  }
  list.sort((a, b) => {
    const aIsMe = a.authorId === currentUserId ? 1 : 0;
    const bIsMe = b.authorId === currentUserId ? 1 : 0;
    if (aIsMe !== bIsMe) return bIsMe - aIsMe;
    const aTime = a.stories[0]?.createdAt ?? '';
    const bTime = b.stories[0]?.createdAt ?? '';
    return new Date(bTime) - new Date(aTime);
  });
  return list;
}

function getStoryThumbnail(story) {
  const media = story?.media;
  if (!Array.isArray(media) || media.length === 0) return null;
  const first = media[0];
  return typeof first === 'string' ? first : first?.url ?? first?.thumbnailUrl ?? null;
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

export default function Stories() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStories()
      .then((list) => {
        if (!cancelled) setGroups(groupStoriesByAuthor(list ?? [], user?.id ?? null));
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <div className="user-app-card" style={{ padding: 16 }}>
      <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 600 }}>Stories</h2>
      {loading && (
        <p style={{ color: '#65676b', textAlign: 'center', padding: 24 }}>Loading stories…</p>
      )}
      {!loading && (
        <div className="stories-all-grid">
          <Link to="/app/stories/create" className="stories-all-card stories-all-card-create">
            <div className="stories-all-card-avatar-wrap">
              <Avatar user={user} size={64} />
              <span className="stories-all-card-plus">
                <Plus size={20} strokeWidth={3} />
              </span>
            </div>
            <span className="stories-all-card-label">Create story</span>
          </Link>
          {groups.map((group) => {
            const thumb = getStoryThumbnail(group.stories[0]);
            const authorId = group.authorId ?? group.author?.id;
            return (
              <Link key={authorId} to={`/app/stories/view/${authorId}`} className="stories-all-card">
                {thumb && (
                  <div
                    className="stories-all-card-bg"
                    style={{ backgroundImage: `url(${thumb})` }}
                  />
                )}
                {!thumb && <div className="stories-all-card-bg stories-all-card-bg-gradient" />}
                <div className="stories-all-card-inner">
                  <Avatar user={group.author} size={56} className="stories-all-card-avatar" />
                  <span className="stories-all-card-name">{group.author?.name ?? 'User'}</span>
                  <span className="stories-all-card-count">{group.stories.length} story{group.stories.length !== 1 ? 'ies' : ''}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {!loading && groups.length === 0 && (
        <p style={{ color: '#65676b', textAlign: 'center', padding: 24 }}>
          No stories yet. Create one from the card above or check back later.
        </p>
      )}
    </div>
  );
}
