import { Skeleton } from '../Skeleton';

/** Skeleton for request detail page (header + form + map). */
export function AgentRequestDetailSkeleton() {
  return (
    <div className="agent-dashboard agent-dashboard-cards agent-page-centered" style={{ pointerEvents: 'none' }}>
      <Skeleton style={{ height: 24, width: 180, marginBottom: 8, borderRadius: 4 }} />
      <Skeleton style={{ height: 14, width: 300, marginBottom: 24, borderRadius: 4 }} />
      <div className="agent-dashboard-cards-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="agent-dashboard-card">
          <Skeleton style={{ height: 20, width: 120, marginBottom: 16, borderRadius: 4 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <Skeleton style={{ height: 14, width: 80, marginBottom: 6, borderRadius: 4 }} />
              <Skeleton style={{ height: 40, width: '100%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
        <div className="agent-dashboard-card">
          <Skeleton style={{ height: 20, width: 100, marginBottom: 12, borderRadius: 4 }} />
          <Skeleton style={{ height: 280, width: '100%', borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}
