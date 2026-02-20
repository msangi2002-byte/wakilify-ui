import { Skeleton, SkeletonCircle } from './Skeleton';

/** Skeleton for group feed list only (posts loading). */
export function GroupFeedListSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="user-app-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <SkeletonCircle size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton style={{ height: 14, width: '40%', marginBottom: 6 }} />
              <Skeleton style={{ height: 12, width: '25%' }} />
            </div>
          </div>
          <Skeleton style={{ height: 14, width: '100%', marginBottom: 6 }} />
          <Skeleton style={{ height: 14, width: '85%', marginBottom: 12 }} />
          <Skeleton style={{ height: 200, width: '100%', marginBottom: 12, borderRadius: 8 }} />
          <div style={{ display: 'flex', gap: 24 }}>
            <Skeleton style={{ height: 20, width: 64 }} />
            <Skeleton style={{ height: 20, width: 64 }} />
          </div>
        </div>
      ))}
    </>
  );
}

/** Skeleton for group detail page: mobile bar + header (cover, name, meta, actions) + feed section. */
export function GroupDetailSkeleton() {
  return (
    <div className="groups-feed">
      <div className="groups-detail-mobile-bar" style={{ pointerEvents: 'none' }}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: 8 }} />
        <Skeleton style={{ height: 20, width: 140, borderRadius: 4 }} />
      </div>
      <div className="group-detail-header" style={{ pointerEvents: 'none' }}>
        <div className="group-detail-cover" style={{ background: 'var(--skeleton-bg, #e4e6eb)' }} />
        <div className="group-detail-info">
          <Skeleton style={{ height: 28, width: '70%', marginBottom: 12, borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '100%', marginBottom: 8, borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '60%', marginBottom: 16, borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Skeleton style={{ height: 20, width: 100, borderRadius: 4 }} />
            <Skeleton style={{ height: 20, width: 120, borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Skeleton style={{ height: 36, width: 100, borderRadius: 8 }} />
            <Skeleton style={{ height: 36, width: 88, borderRadius: 8 }} />
          </div>
        </div>
      </div>
      <div className="groups-feed-header">
        <Skeleton style={{ height: 22, width: 80, marginBottom: 6, borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: 160, borderRadius: 4 }} />
      </div>
      <div className="groups-feed-list">
        <GroupFeedListSkeleton count={3} />
      </div>
    </div>
  );
}
