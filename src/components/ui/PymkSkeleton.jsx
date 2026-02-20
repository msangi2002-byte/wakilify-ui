import { Skeleton, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for "People you may know" section – avatar + name + follow button.
 */
export function PymkSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="user-app-contact-row" style={{ pointerEvents: 'none' }}>
          <div className="user-app-contact" style={{ flex: 1 }}>
            <span className="user-app-avatar-wrap">
              <SkeletonCircle size={36} />
            </span>
            <Skeleton style={{ height: 14, width: 80, borderRadius: 4 }} />
          </div>
          <Skeleton style={{ height: 28, width: 64, borderRadius: 6 }} />
        </div>
      ))}
    </>
  );
}
