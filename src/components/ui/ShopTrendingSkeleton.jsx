import { Skeleton } from './Skeleton';

/**
 * Skeleton for trending row – horizontal compact product cards.
 */
export function ShopTrendingSkeleton({ cards = 6 }) {
  return (
    <div className="shop-mp-trending">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="shop-mp-card compact" style={{ pointerEvents: 'none', flex: '0 0 140px' }}>
          <div className="shop-mp-card-image">
            <Skeleton style={{ width: '100%', height: '100%', aspectRatio: '1', borderRadius: 0 }} />
          </div>
          <div className="shop-mp-card-body">
            <Skeleton style={{ height: 14, width: '85%', marginBottom: 6 }} />
            <Skeleton style={{ height: 16, width: 70 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
