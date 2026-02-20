import { Skeleton } from './Skeleton';

/**
 * Skeleton for marketplace product grid – cards with image + title + seller + price.
 */
export function ShopGridSkeleton({ cards = 8 }) {
  return (
    <div className="shop-mp-grid">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="shop-mp-card" style={{ pointerEvents: 'none' }}>
          <div className="shop-mp-card-image">
            <Skeleton style={{ width: '100%', height: '100%', minHeight: 140, borderRadius: 0 }} />
          </div>
          <div className="shop-mp-card-body">
            <Skeleton style={{ height: 16, width: '90%', marginBottom: 8 }} />
            <Skeleton style={{ height: 14, width: '60%', marginBottom: 6 }} />
            <Skeleton style={{ height: 12, width: '50%', marginBottom: 8 }} />
            <Skeleton style={{ height: 18, width: 80 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
