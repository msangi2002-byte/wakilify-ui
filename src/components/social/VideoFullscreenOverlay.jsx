/**
 * Fullscreen overlay for video posts: no native controls, center play/pause,
 * top bar, bottom bar with description on right and like/comment/share/save.
 * Optional onSwipeUp / onSwipeDown to go to next/previous video (scroll up = next).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, ThumbsUp, MessageCircle, Share2, Bookmark, ChevronUp, ChevronDown } from 'lucide-react';

const SWIPE_THRESHOLD = 50;

export function VideoFullscreenOverlay({
  isOpen,
  onClose,
  videoUrl,
  description,
  author,
  postId,
  liked: initialLiked,
  likesCount: initialLikesCount = 0,
  commentsCount = 0,
  saved: initialSaved,
  onLike,
  onComment,
  onShare,
  onSave,
  onSwipeUp,
  onSwipeDown,
  hasNext = false,
  hasPrev = false,
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(!!initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [saved, setSaved] = useState(!!initialSaved);
  const touchStartY = useRef(0);

  const goNext = useCallback(() => {
    if (hasNext && onSwipeUp) onSwipeUp();
  }, [hasNext, onSwipeUp]);

  const goPrev = useCallback(() => {
    if (hasPrev && onSwipeDown) onSwipeDown();
  }, [hasPrev, onSwipeDown]);

  const handleWheel = useCallback((e) => {
    if (!onSwipeUp && !onSwipeDown) return;
    if (e.deltaY < -SWIPE_THRESHOLD) {
      e.preventDefault();
      goNext();
    } else if (e.deltaY > SWIPE_THRESHOLD) {
      e.preventDefault();
      goPrev();
    }
  }, [onSwipeUp, onSwipeDown, goNext, goPrev]);

  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const endY = e.changedTouches[0].clientY;
    const dy = touchStartY.current - endY;
    if (dy > SWIPE_THRESHOLD) goNext();
    else if (dy < -SWIPE_THRESHOLD) goPrev();
  }, [goNext, goPrev]);

  useEffect(() => {
    if (!isOpen) {
      setPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }
    setLiked(!!initialLiked);
    setLikesCount(initialLikesCount ?? 0);
    setSaved(!!initialSaved);
  }, [isOpen, initialLiked, initialLikesCount, initialSaved]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleLike = () => {
    if (!onLike) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      onLike();
    } catch (_) {}
  };

  const handleSave = () => {
    if (!onSave) return;
    setSaved((s) => !s);
    try {
      onSave();
    } catch (_) {}
  };

  if (!isOpen) return null;
  if (!videoUrl) return null;

  return (
    <div
      className="video-fullscreen-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Video"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="video-fullscreen-topbar">
        <button type="button" className="video-fullscreen-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
        <span className="video-fullscreen-title">{author?.name ?? 'Post'}</span>
      </div>

      {hasPrev && (
        <button type="button" className="video-fullscreen-nav video-fullscreen-nav-prev" onClick={goPrev} aria-label="Previous video">
          <ChevronDown size={32} />
        </button>
      )}
      {hasNext && (
        <button type="button" className="video-fullscreen-nav video-fullscreen-nav-next" onClick={goNext} aria-label="Next video">
          <ChevronUp size={32} />
        </button>
      )}

      <div className="video-fullscreen-video-wrap" onClick={handlePlayPause}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="video-fullscreen-video"
          loop
          playsInline
          muted={false}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        />
        {!playing && (
          <div className="video-fullscreen-play-btn" aria-hidden>
            <Play size={72} fill="currentColor" />
          </div>
        )}
      </div>

      <div className="video-fullscreen-bottombar">
        <div className="video-fullscreen-description">{description || 'No description.'}</div>
        <div className="video-fullscreen-actions">
          <button
            type="button"
            className={`video-fullscreen-action ${liked ? 'active' : ''}`}
            onClick={handleLike}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <ThumbsUp size={28} />
            <span>{likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}</span>
          </button>
          <button type="button" className="video-fullscreen-action" onClick={() => { try { onComment?.(); } catch (_) {} }} aria-label="Comment">
            <MessageCircle size={28} />
            <span>{commentsCount >= 1000 ? `${(commentsCount / 1000).toFixed(1)}K` : commentsCount}</span>
          </button>
          <button type="button" className="video-fullscreen-action" onClick={() => { try { onShare?.(); } catch (_) {} }} aria-label="Share">
            <Share2 size={28} />
          </button>
          <button
            type="button"
            className={`video-fullscreen-action ${saved ? 'active' : ''}`}
            onClick={handleSave}
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            <Bookmark size={28} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
