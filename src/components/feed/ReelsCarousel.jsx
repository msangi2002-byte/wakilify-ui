import { Play } from 'lucide-react';
import { HorizontalScrollWidget } from './HorizontalScrollWidget';
import { ReelsWidgetSkeleton } from './FeedWidgetSkeletons';

function getReelThumbnail(item) {
  return item?.thumbnailUrl ?? item?.media?.[0]?.thumbnailUrl ?? null;
}

function getReelVideoUrl(item) {
  const m = item?.media?.[0];
  if (!m?.url) return null;
  const type = (m?.type ?? '').toUpperCase();
  if (type === 'VIDEO') return m.url;
  return null;
}

export function ReelsCarousel({ items = [], loading, onReelClick }) {
  return (
    <HorizontalScrollWidget
      title="Reels & Short Videos"
      seeAllLink="/app/reels"
      seeAllLabel="See All"
      loading={loading}
      skeleton={
        <div className="feed-widget-scroll">
          <ReelsWidgetSkeleton count={4} />
        </div>
      }
      aria-label="Reels and short videos"
    >
      {items.map((item) => {
        const thumb = getReelThumbnail(item);
        const videoUrl = getReelVideoUrl(item);
        const title = (item?.caption ?? item?.description ?? item?.content ?? '').slice(0, 40) || 'Reel';
        const views = item?.viewsCount ?? item?.reactionsCount ?? item?.likesCount ?? 0;
        const handleClick = () => {
          if (onReelClick) onReelClick(item);
          else if (item?.id) window.location.href = `/app/reels?post=${item.id}`;
        };
        return (
          <div key={item.id} className="feed-widget-card feed-widget-card-reel" role="listitem">
            <button
              type="button"
              onClick={handleClick}
              style={{ border: 'none', padding: 0, cursor: 'pointer', display: 'block', width: '100%', background: 'none', textAlign: 'left' }}
            >
              <div className="feed-widget-reel-thumb" style={{ position: 'relative' }}>
                {thumb ? (
                  <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    preload="metadata"
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    aria-hidden
                  />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '9/16', background: 'var(--wk-bg-alt, #e4e6eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={32} color="#65676b" />
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '24px 8px 8px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                  {views > 0 && <span>{views.toLocaleString()} views</span>}
                </div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.9)' }}>
                  <Play size={28} fill="currentColor" />
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </HorizontalScrollWidget>
  );
}
