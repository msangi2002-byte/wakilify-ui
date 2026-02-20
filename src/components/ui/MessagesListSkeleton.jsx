import { Skeleton, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for conversations sidebar – list of conversation rows (avatar + name + preview).
 */
export function MessagesListSkeleton({ rows = 6 }) {
  return (
    <ul className="messages-conversation-list">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i}>
          <div className="messages-conversation-item" style={{ pointerEvents: 'none' }}>
            <div className="messages-conv-avatar-wrap">
              <SkeletonCircle size={44} />
            </div>
            <div className="messages-conv-meta" style={{ flex: 1, minWidth: 0 }}>
              <Skeleton style={{ height: 16, width: '70%', marginBottom: 8 }} />
              <Skeleton style={{ height: 14, width: '90%' }} />
            </div>
            <div className="messages-conv-right">
              <Skeleton style={{ height: 12, width: 36, borderRadius: 4 }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
