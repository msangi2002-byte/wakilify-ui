import { Skeleton, SkeletonCircle } from './Skeleton';

/** Skeleton for Suggestions / Nearby / PYMK – grid of user cards. */
export function FriendsGridSkeleton({ cards = 6 }) {
  return (
    <div className="friends-fb-grid">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="friends-fb-card" style={{ pointerEvents: 'none' }}>
          <div className="friends-fb-card-avatar-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
            <SkeletonCircle size={72} />
          </div>
          <div className="friends-fb-card-body">
            <Skeleton style={{ height: 18, width: '70%', marginBottom: 8 }} />
            <Skeleton style={{ height: 14, width: 90, marginBottom: 8 }} />
            <Skeleton style={{ height: 12, width: '50%', marginBottom: 16 }} />
            <div className="friends-fb-card-actions" style={{ display: 'flex', gap: 8 }}>
              <Skeleton style={{ height: 36, width: 100, borderRadius: 6 }} />
              <Skeleton style={{ height: 36, width: 80, borderRadius: 6 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
