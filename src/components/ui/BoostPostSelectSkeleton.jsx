import { Skeleton } from './Skeleton';

/** Skeleton for "Chagua Post" dropdown – single bar like a select. */
export function BoostPostSelectSkeleton() {
  return (
    <div className="boost-select-skeleton" style={{ padding: '10px 12px', minHeight: 44 }}>
      <Skeleton style={{ height: 18, width: '85%', borderRadius: 4 }} />
    </div>
  );
}
