import { Skeleton } from './Skeleton';

/** Skeleton for My Orders list – card-style rows (title + status + meta + actions). */
export function OrdersListSkeleton({ cards = 4 }) {
  return (
    <div>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="orders-card" style={{ pointerEvents: 'none' }}>
          <div className="orders-card-header">
            <div className="orders-card-header-left">
              <div className="orders-card-title-row" style={{ marginBottom: 8 }}>
                <Skeleton style={{ height: 20, width: 160, borderRadius: 4 }} />
                <Skeleton style={{ height: 22, width: 72, borderRadius: 6 }} />
              </div>
              <div className="orders-card-meta" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Skeleton style={{ height: 14, width: 120, borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: 100, borderRadius: 4 }} />
                <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
              </div>
            </div>
            <div className="orders-card-actions" style={{ display: 'flex', gap: 8 }}>
              <Skeleton style={{ height: 36, width: 72, borderRadius: 6 }} />
              <Skeleton style={{ height: 36, width: 80, borderRadius: 6 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
