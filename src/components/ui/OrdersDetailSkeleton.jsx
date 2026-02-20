import { Skeleton } from './Skeleton';

/** Skeleton for order card expanded details (items, seller, summary). */
export function OrdersDetailSkeleton() {
  return (
    <div className="orders-card-expanded" style={{ pointerEvents: 'none' }}>
      <div className="orders-card-section">
        <Skeleton style={{ height: 18, width: 80, marginBottom: 12, borderRadius: 4 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skeleton style={{ width: 60, height: 60, borderRadius: 6 }} />
              <div style={{ flex: 1 }}>
                <Skeleton style={{ height: 16, width: '70%', marginBottom: 6, borderRadius: 4 }} />
                <Skeleton style={{ height: 12, width: 120, borderRadius: 4 }} />
              </div>
              <Skeleton style={{ height: 18, width: 64, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="orders-card-section">
        <Skeleton style={{ height: 18, width: 120, marginBottom: 12, borderRadius: 4 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Skeleton style={{ width: 40, height: 40, borderRadius: 8 }} />
          <Skeleton style={{ height: 16, width: 100, borderRadius: 4 }} />
        </div>
        <Skeleton style={{ height: 14, width: 140, marginBottom: 6, borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: 160, borderRadius: 4 }} />
      </div>
      <div className="orders-card-section">
        <Skeleton style={{ height: 18, width: 100, marginBottom: 12, borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: '100%', marginBottom: 6, borderRadius: 4 }} />
        <Skeleton style={{ height: 14, width: '80%', marginBottom: 6, borderRadius: 4 }} />
        <Skeleton style={{ height: 18, width: 120, borderRadius: 4 }} />
      </div>
    </div>
  );
}
