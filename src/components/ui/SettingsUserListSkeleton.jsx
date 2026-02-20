import { Skeleton, SkeletonCircle } from './Skeleton';

/** Skeleton for blocked/restricted user list – avatar + name + button per row. */
export function SettingsUserListSkeleton({ rows = 4 }) {
  return (
    <ul className="settings-blocked-list" style={{ pointerEvents: 'none' }}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="settings-blocked-item">
          <div className="settings-blocked-info">
            <SkeletonCircle size={40} />
            <Skeleton style={{ height: 16, width: 100, borderRadius: 4 }} />
          </div>
          <Skeleton style={{ height: 36, width: 72, borderRadius: 6 }} />
        </li>
      ))}
    </ul>
  );
}
