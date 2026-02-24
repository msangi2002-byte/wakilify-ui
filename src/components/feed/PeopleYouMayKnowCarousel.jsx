import { Link } from 'react-router-dom';
import { HorizontalScrollWidget } from './HorizontalScrollWidget';
import { PymkWidgetSkeleton } from './FeedWidgetSkeletons';

function Avatar({ user, size = 56 }) {
  const src = user?.profilePic;
  const name = user?.name || user?.username || 'User';
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
      }}
    >
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  );
}

export function PeopleYouMayKnowCarousel({ items = [], loading, onAdd, onRemove, addLoadingId }) {
  return (
    <HorizontalScrollWidget
      title="People You May Know"
      seeAllLink="/app/friends"
      seeAllLabel="See All"
      loading={loading}
      skeleton={
        <div className="feed-widget-scroll">
          <PymkWidgetSkeleton count={5} />
        </div>
      }
      aria-label="People you may know"
    >
      {items.map((u) => (
        <div key={u.id} className="feed-widget-card feed-widget-card-pymk" role="listitem">
          <Link to={`/app/profile/${u.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
            <Avatar user={u} size={56} />
            <span className="feed-widget-card-name" style={{ marginTop: 8, fontWeight: 600, fontSize: 14, textAlign: 'center' }}>
              {u.name ?? u.username ?? 'User'}
            </span>
            {(u.mutualFriendsCount != null && u.mutualFriendsCount > 0) && (
              <span className="feed-widget-card-meta" style={{ fontSize: 12, color: 'var(--wk-text-muted, #65676b)', marginTop: 2 }}>
                {u.mutualFriendsCount} mutual friend{u.mutualFriendsCount !== 1 ? 's' : ''}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="feed-widget-card-btn feed-widget-card-btn-primary"
            onClick={() => onAdd?.(u)}
            disabled={addLoadingId === u.id}
          >
            {addLoadingId === u.id ? '…' : 'Add'}
          </button>
          <button
            type="button"
            className="feed-widget-card-btn feed-widget-card-btn-secondary"
            onClick={() => onRemove?.(u)}
            style={{ marginTop: 4 }}
          >
            Remove
          </button>
        </div>
      ))}
    </HorizontalScrollWidget>
  );
}
