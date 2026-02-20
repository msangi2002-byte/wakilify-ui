import { Skeleton, SkeletonCircle, SkeletonText } from './Skeleton';

/**
 * Facebook-style feed loading: skeleton cards that mirror post layout.
 */
export function FeedSkeleton({ postCount = 3 }) {
  return (
    <>
      {Array.from({ length: postCount }, (_, i) => (
        <div key={i} className="user-app-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <SkeletonCircle size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton style={{ height: 14, width: '40%', marginBottom: 6 }} />
              <Skeleton style={{ height: 12, width: '25%' }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
          <SkeletonText lines={2} />
        </div>
          <Skeleton style={{ height: 280, width: '100%', marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 24 }}>
            <Skeleton style={{ height: 20, width: 64 }} />
            <Skeleton style={{ height: 20, width: 64 }} />
            <Skeleton style={{ height: 20, width: 64 }} />
          </div>
        </div>
      ))}
    </>
  );
}
