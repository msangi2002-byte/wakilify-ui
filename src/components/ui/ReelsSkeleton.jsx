import { Skeleton, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for Reels list – card layout (header + video area + engagement).
 */
export function ReelsSkeleton({ cards = 3 }) {
  return (
    <div className="reels-feed-list">
      {Array.from({ length: cards }, (_, i) => (
        <article key={i} className="reels-card" style={{ pointerEvents: 'none' }}>
          <div className="reels-card-header">
            <SkeletonCircle size={40} className="reels-card-avatar" />
            <div className="reels-card-meta" style={{ flex: 1, minWidth: 0 }}>
              <Skeleton style={{ height: 16, width: 100, marginBottom: 6 }} />
              <Skeleton style={{ height: 12, width: 60 }} />
            </div>
            <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />
          </div>
          <div className="reels-card-video-wrap" style={{ aspectRatio: '9/16', maxHeight: 360 }}>
            <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
          </div>
          <div className="reels-card-engagement" style={{ padding: '8px 16px 12px' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
              <Skeleton style={{ height: 20, width: 64 }} />
              <Skeleton style={{ height: 20, width: 80 }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Skeleton style={{ height: 36, width: 72, borderRadius: 6 }} />
              <Skeleton style={{ height: 36, width: 88, borderRadius: 6 }} />
              <Skeleton style={{ height: 36, width: 68, borderRadius: 6 }} />
              <Skeleton style={{ height: 36, width: 56, borderRadius: 6 }} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
