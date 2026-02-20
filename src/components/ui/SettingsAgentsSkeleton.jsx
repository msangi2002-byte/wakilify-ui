import { Skeleton, SkeletonCircle } from './Skeleton';

/** Skeleton for agents list in "Become a business" modal. */
export function SettingsAgentsSkeleton({ rows = 5 }) {
  return (
    <div className="settings-agent-results" style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8, marginBottom: 6 }}
        >
          <SkeletonCircle size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton style={{ height: 16, width: '60%', marginBottom: 6, borderRadius: 4 }} />
            <Skeleton style={{ height: 12, width: '90%', borderRadius: 4 }} />
          </div>
          <Skeleton style={{ height: 36, width: 72, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
