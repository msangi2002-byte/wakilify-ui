import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { HorizontalScrollWidget } from './HorizontalScrollWidget';
import { GroupsWidgetSkeleton } from './FeedWidgetSkeletons';

export function SuggestedGroupsCarousel({ items = [], loading, onJoin, onRemove, joinLoadingId }) {
  return (
    <HorizontalScrollWidget
      title="Communities for You"
      seeAllLink="/app/groups"
      seeAllLabel="See All"
      loading={loading}
      skeleton={
        <div className="feed-widget-scroll">
          <GroupsWidgetSkeleton count={4} />
        </div>
      }
      aria-label="Suggested groups"
    >
      {items.map((g) => {
        const name = g.name ?? 'Group';
        const membersCount = g.membersCount ?? g.members_count ?? 0;
        const coverUrl = g.coverImageUrl ?? g.coverImage ?? g.image;
        return (
          <div key={g.id} className="feed-widget-card feed-widget-card-group" role="listitem">
            <Link to={`/app/groups/${g.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt=""
                  style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Users size={24} />
                </div>
              )}
              <span className="feed-widget-card-name" style={{ marginTop: 8, fontWeight: 600, fontSize: 14, textAlign: 'center' }}>
                {name}
              </span>
              {membersCount > 0 && (
                <span className="feed-widget-card-meta" style={{ fontSize: 12, color: 'var(--wk-text-muted, #65676b)', marginTop: 2 }}>
                  {membersCount.toLocaleString()} members
                </span>
              )}
            </Link>
            <button
              type="button"
              className="feed-widget-card-btn feed-widget-card-btn-primary"
              onClick={() => onJoin?.(g)}
              disabled={joinLoadingId === g.id}
              style={{ marginTop: 8 }}
            >
              {joinLoadingId === g.id ? '…' : 'Join'}
            </button>
            <button
              type="button"
              className="feed-widget-card-btn feed-widget-card-btn-secondary"
              onClick={() => onRemove?.(g)}
              style={{ marginTop: 4 }}
            >
              Remove
            </button>
          </div>
        );
      })}
    </HorizontalScrollWidget>
  );
}
