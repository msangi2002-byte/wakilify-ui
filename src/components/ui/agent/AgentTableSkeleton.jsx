import { Skeleton } from '../Skeleton';

/** Skeleton for agent table (commissions / withdrawals). */
export function AgentTableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="agent-table-wrap">
      <table className="agent-table">
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i}><Skeleton style={{ height: 14, width: 60, borderRadius: 4 }} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }, (_, j) => (
                <td key={j}><Skeleton style={{ height: 14, width: j === 0 ? 100 : 70, borderRadius: 4 }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
