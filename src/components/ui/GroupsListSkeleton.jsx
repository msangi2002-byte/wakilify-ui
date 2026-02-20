import { Skeleton, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for groups sidebar list – avatar + name + members per row.
 * Renders only <li> items; parent must wrap in <ul className="groups-list">.
 */
export function GroupsListSkeleton({ rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i}>
          <div className="groups-list-item" style={{ pointerEvents: 'none' }}>
            <div className="groups-list-avatar">
              <SkeletonCircle size={40} />
            </div>
            <div className="groups-list-info" style={{ flex: 1, minWidth: 0 }}>
              <Skeleton style={{ height: 16, width: '70%', marginBottom: 6, borderRadius: 4 }} />
              <Skeleton style={{ height: 12, width: 80, borderRadius: 4 }} />
            </div>
          </div>
        </li>
      ))}
    </>
  );
}
