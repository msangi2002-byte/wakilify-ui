import { Skeleton } from './Skeleton';

/**
 * Skeleton for Sponsored section (sidebar) – card thumb + title/desc.
 */
export function SponsoredSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="user-app-sponsored-card" style={{ cursor: 'default', pointerEvents: 'none' }}>
          <div className="thumb">
            <Skeleton style={{ width: '100%', height: '100%', borderRadius: 4 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton style={{ height: 10, width: 56, marginBottom: 6 }} />
            <Skeleton style={{ height: 14, width: '85%', marginBottom: 4 }} />
            <Skeleton style={{ height: 12, width: '70%' }} />
          </div>
        </div>
      ))}
    </>
  );
}
