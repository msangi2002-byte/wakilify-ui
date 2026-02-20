/**
 * One slide in the feed video reels scroll: video + overlay UI (like/comment/share/save, author, caption).
 * Plays only when isActive. Used inside a vertical scroll container so scrolling moves to next/previous.
 */
import { useState, useRef, useEffect } from 'react';
import { Play, ThumbsUp, MessageCircle, Share2, Bookmark } from 'lucide-react';

export function FeedVideoReelSlide({
  videoUrl,
  description,
  author,
  postId,
  liked: initialLiked,
  likesCount: initialLikesCount = 0,
  commentsCount = 0,
  saved: initialSaved,
  isActive,
  onLike,
  onComment,
  onShare,
  onSave,
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(!!initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [saved, setSaved] = useState(!!initialSaved);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      setPlaying(false);
      if (videoRef.current) videoRef.current.pause();
      return;
    }
    setLiked(!!initialLiked);
    setLikesCount(initialLikesCount);
    setSaved(!!initialSaved);
    const v = videoRef.current;
    if (v && videoUrl) v.play().then(() => setPlaying(true)).catch(() => {});
  }, [isActive, initialLiked, initialLikesCount, initialSaved, videoUrl]);

  useEffect(() => {
    if (!isActive || !videoRef.current) return;
    const v = videoRef.current;
    const onTimeUpdate = () => setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    v.addEventListener('timeupdate', onTimeUpdate);
    return () => v.removeEventListener('timeupdate', onTimeUpdate);
  }, [isActive, videoUrl]);

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {});
    else {
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

  if (!videoUrl) return null;

  return (
    <div className="feed-video-reel-slide">
      <div className="feed-video-reel-slide-video-wrap" onClick={handlePlayPause}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="feed-video-reel-slide-video"
          loop
          playsInline
          muted={false}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        />
        {!playing && (
          <div className="feed-video-reel-slide-play-btn" aria-hidden>
            <Play size={72} fill="currentColor" />
          </div>
        )}
      </div>

      <div className="feed-video-reel-slide-actions">
        <button
          type="button"
          className={`feed-video-reel-slide-action ${liked ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <ThumbsUp size={32} />
          <span>{formatCount(likesCount)}</span>
        </button>
        <button type="button" className="feed-video-reel-slide-action" onClick={(e) => { e.stopPropagation(); onComment?.(); }} aria-label="Comment">
          <MessageCircle size={32} />
          <span>{formatCount(commentsCount)}</span>
        </button>
        <button type="button" className="feed-video-reel-slide-action" onClick={(e) => { e.stopPropagation(); onShare?.(); }} aria-label="Share">
          <Share2 size={32} />
          <span>Share</span>
        </button>
        <button
          type="button"
          className={`feed-video-reel-slide-action ${saved ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleSave(); }}
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <Bookmark size={28} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="feed-video-reel-slide-info">
        <div className="feed-video-reel-slide-info-author">
          <div className="feed-video-reel-slide-info-avatar">
            {authorPic ? <img src={authorPic} alt="" /> : <span>{authorName.charAt(0).toUpperCase()}</span>}
          </div>
          <span className="feed-video-reel-slide-info-username">{authorName}</span>
        </div>
        {description && <p className="feed-video-reel-slide-info-caption">{description}</p>}
      </div>

      <div className="feed-video-reel-slide-progress-wrap">
        <div className="feed-video-reel-slide-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
