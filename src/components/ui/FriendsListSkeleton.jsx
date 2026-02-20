import { Skeleton, SkeletonCircle } from './Skeleton';

/** Skeleton for Following tab – list of rows (avatar + name + actions). */
export function FriendsListSkeleton({ rows = 6 }) {
  return (
    <div className="friends-fb-list">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="friends-fb-row" style={{ pointerEvents: 'none' }}>
          <div className="friends-fb-row-left">
            <SkeletonCircle size={48} />
            <div className="friends-fb-row-info" style={{ gap: 6 }}>
              <Skeleton style={{ height: 16, width: 120 }} />
              <Skeleton style={{ height: 14, width: 80 }} />
            </div>
          </div>
          <div className="friends-fb-row-actions" style={{ display: 'flex', gap: 8 }}>
            <Skeleton style={{ height: 32, width: 88, borderRadius: 6 }} />
            <Skeleton style={{ height: 32, width: 80, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
