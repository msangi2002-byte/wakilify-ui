import { Skeleton } from './Skeleton';

/** Skeleton for login activity list – time + meta per row. */
export function SettingsActivitySkeleton({ rows = 5 }) {
  return (
    <ul className="settings-activity-list" style={{ pointerEvents: 'none' }}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="settings-activity-item">
          <Skeleton style={{ height: 14, width: 140, marginBottom: 6, borderRadius: 4 }} />
          <Skeleton style={{ height: 12, width: '80%', borderRadius: 4 }} />
        </li>
      ))}
    </ul>
  );
}
