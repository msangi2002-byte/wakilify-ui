import { Skeleton } from './Skeleton';

/**
 * Skeleton for profile grid (posts/saved) – 3-column grid of thumbnails.
 */
export function ProfileGridSkeleton({ cells = 6 }) {
  return (
    <div className="profile-fb-grid profile-fb-grid-multi" style={{ padding: '0 16px 24px' }}>
      {Array.from({ length: cells }, (_, i) => (
        <div key={i} className="profile-fb-grid-multi-item" style={{ aspectRatio: 1 }}>
          <Skeleton style={{ width: '100%', height: '100%', borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}
