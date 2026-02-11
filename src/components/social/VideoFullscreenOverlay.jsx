/**
 * Fullscreen overlay for video posts: no native controls, center play/pause,
 * top bar, bottom bar with description on right and like/comment/share/save.
 * Optional onSwipeUp / onSwipeDown to go to next/previous video (scroll up = next).
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, ThumbsUp, MessageCircle, Share2, Bookmark } from 'lucide-react';

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
  const [progress, setProgress] = useState(0);
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
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }
    setLiked(!!initialLiked);
    setLikesCount(initialLikesCount ?? 0);
    setSaved(!!initialSaved);
    setProgress(0);
    const t = setTimeout(() => {
      const v = videoRef.current;
      if (v && videoUrl) {
        v.play().then(() => setPlaying(true)).catch(() => {});
      }
    }, 100);
    return () => clearTimeout(t);
  }, [isOpen, initialLiked, initialLikesCount, initialSaved, videoUrl]);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;
    const v = videoRef.current;
    const onTimeUpdate = () => setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    v.addEventListener('timeupdate', onTimeUpdate);
    return () => v.removeEventListener('timeupdate', onTimeUpdate);
  }, [isOpen, videoUrl]);

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

  const formatCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
  const authorName = author?.name ?? author?.username ?? 'User';
  const authorPic = author?.profilePic ?? author?.avatar;

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

      {/* Reels-style: right-side vertical actions */}
      <div className="video-fullscreen-actions-right">
        <button
          type="button"
          className={`video-fullscreen-action-btn ${liked ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <ThumbsUp size={32} />
          <span>{formatCount(likesCount)}</span>
        </button>
        <button type="button" className="video-fullscreen-action-btn" onClick={(e) => { e.stopPropagation(); onComment?.(); }} aria-label="Comment">
          <MessageCircle size={32} />
          <span>{formatCount(commentsCount)}</span>
        </button>
        <button type="button" className="video-fullscreen-action-btn" onClick={(e) => { e.stopPropagation(); onShare?.(); }} aria-label="Share">
          <Share2 size={32} />
          <span>Share</span>
        </button>
        <button
          type="button"
          className={`video-fullscreen-action-btn ${saved ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleSave(); }}
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <Bookmark size={28} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Reels-style: bottom-left author + caption */}
      <div className="video-fullscreen-info">
        <div className="video-fullscreen-info-author">
          <div className="video-fullscreen-info-avatar">
            {authorPic ? (
              <img src={authorPic} alt="" />
            ) : (
              <span>{authorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="video-fullscreen-info-username">{authorName}</span>
        </div>
        {description && <p className="video-fullscreen-info-caption">{description}</p>}
      </div>

      <div className="video-fullscreen-progress-wrap">
        <div className="video-fullscreen-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
