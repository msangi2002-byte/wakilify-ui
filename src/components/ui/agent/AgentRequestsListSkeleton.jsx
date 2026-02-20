import { Skeleton } from '../Skeleton';

/** Skeleton for agent request cards list (Requests / Activate pages). */
export function AgentRequestsListSkeleton({ cards = 4 }) {
  return (
    <ul className="agent-requests-list" style={{ pointerEvents: 'none' }}>
      {Array.from({ length: cards }, (_, i) => (
        <li key={i} className="agent-request-card">
          <div className="agent-request-header">
            <Skeleton style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton style={{ height: 18, width: '60%', marginBottom: 8, borderRadius: 4 }} />
              <Skeleton style={{ height: 14, width: '40%', borderRadius: 4 }} />
            </div>
            <Skeleton style={{ height: 24, width: 72, borderRadius: 6 }} />
          </div>
          <div className="agent-request-details">
            <Skeleton style={{ height: 14, width: '80%', marginBottom: 6, borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: '60%', borderRadius: 4 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
