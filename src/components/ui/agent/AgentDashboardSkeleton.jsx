import { Skeleton } from '../Skeleton';

/** Skeleton for agent dashboard: title + stats row + content cards + activity. */
export function AgentDashboardSkeleton() {
  return (
    <div className="agent-dashboard agent-dashboard-cards">
      <Skeleton style={{ height: 28, width: 200, marginBottom: 24, borderRadius: 4 }} />
      <div className="agent-dashboard-cards-row agent-dashboard-stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="agent-dashboard-card agent-dashboard-stat-card" style={{ pointerEvents: 'none' }}>
            <div className="agent-dashboard-stat-icon agent-dashboard-stat-icon-wallet" />
            <div className="agent-dashboard-stat-content">
              <Skeleton style={{ height: 28, width: 100, marginBottom: 8, borderRadius: 4 }} />
              <Skeleton style={{ height: 14, width: 120, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="agent-dashboard-cards-row agent-dashboard-content-cards">
        <div className="agent-dashboard-card" style={{ pointerEvents: 'none' }}>
          <Skeleton style={{ height: 22, width: 140, marginBottom: 12, borderRadius: 4 }} />
          <Skeleton style={{ height: 18, width: '60%', marginBottom: 16, borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 16 }}>
            <Skeleton style={{ height: 36, width: 80, borderRadius: 4 }} />
            <Skeleton style={{ height: 36, width: 80, borderRadius: 4 }} />
          </div>
        </div>
        <div className="agent-dashboard-card" style={{ pointerEvents: 'none' }}>
          <Skeleton style={{ height: 22, width: 120, marginBottom: 16, borderRadius: 4 }} />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} style={{ height: 40, width: '100%', marginBottom: 8, borderRadius: 6 }} />
          ))}
        </div>
        <div className="agent-dashboard-card" style={{ pointerEvents: 'none' }}>
          <Skeleton style={{ height: 22, width: 130, marginBottom: 12, borderRadius: 4 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Skeleton style={{ width: 36, height: 36, borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <Skeleton style={{ height: 14, width: '70%', marginBottom: 4 }} />
                <Skeleton style={{ height: 12, width: '50%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
