import { Skeleton, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for profile page – cover, avatar, name, stats, bio, grid.
 */
export function ProfileSkeleton() {
  return (
    <div className="profile-fb">
      <div className="profile-fb-cover-wrap">
        <div style={{ width: '100%', height: 280, overflow: 'hidden' }}>
          <Skeleton style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        </div>
        <div className="profile-fb-hero">
          <div className="profile-fb-hero-avatar-wrap">
            <SkeletonCircle size={168} className="profile-fb-avatar" />
          </div>
        </div>
      </div>
      <div className="profile-fb-info">
        <div className="profile-fb-stats-col">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="profile-fb-stat-row">
              <Skeleton style={{ height: 14, width: 56, borderRadius: 4 }} />
              <Skeleton style={{ height: 20, width: 40, borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div className="profile-fb-bio-section">
          <Skeleton style={{ height: 18, width: 80, marginBottom: 8, borderRadius: 4 }} />
          <Skeleton style={{ height: 14, width: '100%', marginBottom: 6, borderRadius: 4 }} />
          <Skeleton style={{ height: 14, width: '70%', borderRadius: 4 }} />
        </div>
      </div>
      <div className="profile-fb-tabs-wrap" style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        <Skeleton style={{ height: 40, width: 80, borderRadius: 8 }} />
        <Skeleton style={{ height: 40, width: 80, borderRadius: 8 }} />
        <Skeleton style={{ height: 40, width: 80, borderRadius: 8 }} />
      </div>
      <div className="profile-fb-grid" style={{ padding: '0 16px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} style={{ aspectRatio: 1, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}
