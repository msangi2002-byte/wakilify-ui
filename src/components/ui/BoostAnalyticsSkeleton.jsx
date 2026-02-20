import { Skeleton } from './Skeleton';

/** Skeleton for Tangazo Analytics – 4 stat boxes + promo cards. */
export function BoostAnalyticsSkeleton() {
  return (
    <>
      <div className="boost-analytics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="boost-stat">
            <Skeleton style={{ height: 28, width: 64, marginBottom: 6, borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div>
        <Skeleton style={{ height: 18, width: 120, marginBottom: 12, borderRadius: 4 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: 'var(--card-bg, #1e1e2e)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Skeleton style={{ height: 16, width: '50%', borderRadius: 4 }} />
              <Skeleton style={{ height: 24, width: 24, borderRadius: 4 }} />
            </div>
            <Skeleton style={{ height: 12, width: '70%', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </>
  );
}
