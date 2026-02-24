import { Skeleton, SkeletonCircle } from '@/components/ui/Skeleton';

const CARD_WIDTH_PYMK = 160;
const CARD_WIDTH_REEL = 120;
const CARD_WIDTH_GROUP = 160;

/** Horizontal row of skeleton cards for People You May Know widget */
export function PymkWidgetSkeleton({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="feed-widget-card feed-widget-card-pymk" style={{ width: CARD_WIDTH_PYMK }}>
          <SkeletonCircle size={56} />
          <Skeleton style={{ height: 14, width: '80%', marginTop: 8, borderRadius: 4 }} />
          <Skeleton style={{ height: 12, width: '50%', marginTop: 4, borderRadius: 4 }} />
          <Skeleton style={{ height: 32, width: '100%', marginTop: 10, borderRadius: 8 }} />
          <Skeleton style={{ height: 28, width: '100%', marginTop: 6, borderRadius: 8 }} />
        </div>
      ))}
    </>
  );
}

/** Horizontal row of skeleton cards for Reels widget (9:16 portrait) */
export function ReelsWidgetSkeleton({ count = 4 }) {
  const height = Math.round((CARD_WIDTH_REEL * 16) / 9);
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="feed-widget-card feed-widget-card-reel" style={{ width: CARD_WIDTH_REEL }}>
          <Skeleton style={{ width: '100%', height, borderRadius: 12 }} />
          <Skeleton style={{ height: 12, width: '70%', marginTop: 8, borderRadius: 4 }} />
        </div>
      ))}
    </>
  );
}

/** Horizontal row of skeleton cards for Suggested Groups widget */
export function GroupsWidgetSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="feed-widget-card feed-widget-card-group" style={{ width: CARD_WIDTH_GROUP }}>
          <Skeleton style={{ width: 48, height: 48, borderRadius: 12 }} />
          <Skeleton style={{ height: 14, width: '85%', marginTop: 8, borderRadius: 4 }} />
          <Skeleton style={{ height: 12, width: '55%', marginTop: 4, borderRadius: 4 }} />
          <Skeleton style={{ height: 32, width: '100%', marginTop: 10, borderRadius: 8 }} />
        </div>
      ))}
    </>
  );
}
