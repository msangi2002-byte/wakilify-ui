import { Skeleton } from './Skeleton';

/** Skeleton for budget price box – total + per person line. */
export function BoostPriceSkeleton() {
  return (
    <div className="boost-price-box" style={{ pointerEvents: 'none' }}>
      <Skeleton style={{ height: 24, width: 140, marginBottom: 6, borderRadius: 4 }} />
      <Skeleton style={{ height: 14, width: 100, borderRadius: 4 }} />
    </div>
  );
}
