import { Skeleton } from './Skeleton';

/**
 * Skeleton for chat messages area when loading – bubble placeholders only (parent shows header + input).
 */
export function MessagesChatSkeleton() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton style={{ height: 44, width: '70%', maxWidth: 280, borderRadius: 18, alignSelf: 'flex-start' }} />
      <Skeleton style={{ height: 44, width: '60%', maxWidth: 240, borderRadius: 18, alignSelf: 'flex-end' }} />
      <Skeleton style={{ height: 44, width: '75%', maxWidth: 260, borderRadius: 18, alignSelf: 'flex-start' }} />
      <Skeleton style={{ height: 44, width: '55%', maxWidth: 200, borderRadius: 18, alignSelf: 'flex-end' }} />
      <Skeleton style={{ height: 44, width: '65%', maxWidth: 220, borderRadius: 18, alignSelf: 'flex-start' }} />
    </div>
  );
}
