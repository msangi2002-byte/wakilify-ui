import { Skeleton } from './Skeleton';

/** Skeleton for business registration plans (radio/list). */
export function SettingsPlansSkeleton({ rows = 3 }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Skeleton style={{ width: 20, height: 20, borderRadius: '50%' }} />
          <Skeleton style={{ height: 18, width: 120, borderRadius: 4 }} />
          <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}
