import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable horizontal carousel for in-feed widgets (PYMK, Reels, Suggested Groups).
 * - Same width as feed posts; scroll-snap; mobile = swipe, desktop = arrows.
 */
export function HorizontalScrollWidget({
  title,
  seeAllLink,
  seeAllLabel = 'See All',
  children,
  loading,
  skeleton,
  className = '',
  'aria-label': ariaLabel,
}) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeft(scrollLeft > 8);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
    setTimeout(updateArrows, 300);
  };

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(updateArrows, 100);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && skeleton) {
    return (
      <div className={`feed-widget user-app-card ${className}`.trim()} aria-label={ariaLabel}>
        <div className="feed-widget-header">
          <h3 className="feed-widget-title">{title}</h3>
        </div>
        <div className="feed-widget-scroll-wrap">
          {skeleton}
        </div>
      </div>
    );
  }

  return (
    <div className={`feed-widget user-app-card ${className}`.trim()} aria-label={ariaLabel}>
      <div className="feed-widget-header">
        <h3 className="feed-widget-title">{title}</h3>
        {seeAllLink && (
          <Link to={seeAllLink} className="feed-widget-see-all">
            {seeAllLabel}
          </Link>
        )}
      </div>
      <div className="feed-widget-scroll-wrap">
        <button
          type="button"
          className="feed-widget-arrow feed-widget-arrow-left"
          aria-label="Scroll left"
          onClick={() => scroll('left')}
          style={{ opacity: showLeft ? 1 : 0, pointerEvents: showLeft ? 'auto' : 'none' }}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          className="feed-widget-arrow feed-widget-arrow-right"
          aria-label="Scroll right"
          onClick={() => scroll('right')}
          style={{ opacity: showRight ? 1 : 0, pointerEvents: showRight ? 'auto' : 'none' }}
        >
          <ChevronRight size={24} />
        </button>
        <div
          ref={scrollRef}
          className="feed-widget-scroll"
          onScroll={updateArrows}
          role="list"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
