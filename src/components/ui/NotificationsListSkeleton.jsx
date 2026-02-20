import { Skeleton, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for notifications list – avatar + message + time per row.
 */
export function NotificationsListSkeleton({ rows = 8 }) {
  return (
    <ul className="notif-list" role="list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} style={{ borderBottom: '1px solid #e4e6eb', padding: '12px 16px' }}>
          <div className="notif-item" style={{ pointerEvents: 'none', cursor: 'default' }}>
            <SkeletonCircle size={44} className="notif-item-avatar" />
            <div className="notif-item-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton style={{ height: 16, width: '85%', maxWidth: 320 }} />
              <Skeleton style={{ height: 12, width: 80 }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
