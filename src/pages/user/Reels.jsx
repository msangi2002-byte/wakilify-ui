import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Plus, Play, ChevronUp, ChevronDown, X, Bookmark } from 'lucide-react';
import { getReels, likePost, unlikePost, savePost, unsavePost } from '@/lib/api/posts';
import { formatPostTime } from '@/lib/utils/dateUtils';

function normalizeReel(post) {
  const author = post.author ?? post.user ?? {};
  const media = post.media ?? post.attachments ?? post.images ?? [];
  const urls = Array.isArray(media) ? media.map((m) => (typeof m === 'string' ? m : m?.url ?? m?.src)) : [];
  const videoUrl = urls.find((u) => u && /\.(mp4|webm|ogg)(\?|$)/i.test(u)) ?? urls[0] ?? null;
  return {
    id: post.id,
    author: { id: author.id, name: author.name ?? author.username ?? 'User', profilePic: author.profilePic ?? author.avatar },
    time: formatPostTime(post.createdAt ?? post.created_at),
    description: post.caption ?? post.content ?? post.description ?? '',
    videoUrl,
    likes: post.reactionsCount ?? post.likesCount ?? post.likes_count ?? post.likeCount ?? 0,
    comments: post.commentsCount ?? post.comments_count ?? post.commentCount ?? 0,
    shares: post.sharesCount ?? post.shares_count ?? 0,
    liked: !!post.userReaction,
    saved: !!post.saved,
  };
}

function Avatar({ user, size = 40, className = '' }) {
  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {user?.profilePic ? <img src={user.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  );
}

const SWIPE_THRESHOLD = 50;

/** List view: card per image – header (avatar, username, Following, time, more), video + play, footer (comment count left, Like Comment Share Save right) */
function ReelCard({ item, index, onPlay, onLikeChange, onSaveChange }) {
  const [liked, setLiked] = useState(!!item.liked);
  const [likesCount, setLikesCount] = useState(item.likes ?? 0);
  const [saved, setSaved] = useState(!!item.saved);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!item.id) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      if (next) await likePost(item.id);
      else await unlikePost(item.id);
      onLikeChange?.(item.id, next, next ? likesCount + 1 : likesCount - 1);
    } catch {
      setLiked(!next);
      setLikesCount((c) => (next ? c - 1 : c + 1));
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!item.id || saveLoading) return;
    const next = !saved;
    setSaveLoading(true);
    try {
      if (next) await savePost(item.id);
      else await unsavePost(item.id);
      setSaved(next);
      onSaveChange?.(item.id, next);
    } catch (_) {}
    finally {
      setSaveLoading(false);
    }
  };

  return (
    <article className="reels-card" onClick={() => onPlay(index)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(index); } }}>
      <div className="reels-card-header" onClick={(e) => e.stopPropagation()}>
        <Avatar user={item.author} size={40} className="reels-card-avatar" />
        <div className="reels-card-meta">
          <div className="reels-card-meta-row">
            <span className="reels-card-username">{item.author?.name ?? 'User'}</span>
            <span className="reels-card-following">Following</span>
          </div>
          <span className="reels-card-time">{item.time ?? ''}</span>
        </div>
        <button type="button" className="reels-card-more" aria-label="More options" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="reels-card-video-wrap">
        {item.videoUrl ? (
          <>
            <video src={item.videoUrl} className="reels-card-video" muted playsInline loop preload="metadata" />
            <div className="reels-card-play-btn" aria-hidden>
              <Play size={56} fill="currentColor" />
            </div>
          </>
        ) : (
          <div className="reels-card-placeholder">
            <Play size={48} />
            <span>No video</span>
          </div>
        )}
      </div>
      <div className="reels-card-footer" onClick={(e) => e.stopPropagation()}>
        <span className="reels-card-comment-count">{item.comments ?? 0} comments</span>
        <div className="reels-card-actions">
          <button type="button" className={`reels-card-action ${liked ? 'active' : ''}`} onClick={handleLike}>
            <ThumbsUp size={20} />
            <span>Like</span>
          </button>
          <button type="button" className="reels-card-action">
            <MessageCircle size={20} />
            <span>Comment</span>
          </button>
          <button type="button" className="reels-card-action">
            <Share2 size={20} />
            <span>Share</span>
          </button>
          <button type="button" className={`reels-card-action ${saved ? 'active' : ''}`} onClick={handleSave}>
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
            <span>Save</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function ReelSlide({ item, isActive, onLikeChange, onSaveChange, onNext, onPrev }) {
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(!!item.liked);
  const [likesCount, setLikesCount] = useState(item.likes ?? 0);
  const [saved, setSaved] = useState(!!item.saved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !videoRef.current) return;
    const v = videoRef.current;
    const onTimeUpdate = () => setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    v.addEventListener('timeupdate', onTimeUpdate);
    return () => v.removeEventListener('timeupdate', onTimeUpdate);
  }, [isActive]);

  const handleLike = async () => {
    if (!item.id) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      if (next) await likePost(item.id);
      else await unlikePost(item.id);
      onLikeChange?.(item.id, next, next ? likesCount + 1 : likesCount - 1);
    } catch {
      setLiked(!next);
      setLikesCount((c) => (next ? c - 1 : c + 1));
    }
  };

  const handleSave = async () => {
    if (!item.id || saveLoading) return;
    const next = !saved;
    setSaveLoading(true);
    try {
      if (next) await savePost(item.id);
      else await unsavePost(item.id);
      setSaved(next);
      onSaveChange?.(item.id, next);
    } catch (_) {}
    finally {
      setSaveLoading(false);
    }
  };

  const handlePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleWheel = (e) => {
    if (e.deltaY < -SWIPE_THRESHOLD) onNext?.();
    else if (e.deltaY > SWIPE_THRESHOLD) onPrev?.();
  };

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (dy > SWIPE_THRESHOLD) onNext?.();
    else if (dy < -SWIPE_THRESHOLD) onPrev?.();
  };

  const formatCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

  if (!item.videoUrl) {
    return (
      <div className="reels-slide reels-slide-placeholder">
        <Play size={64} />
        <span>No video</span>
      </div>
    );
  }

  return (
    <div
      className="reels-slide"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        src={item.videoUrl}
        className="reels-slide-video"
        loop
        playsInline
        muted={false}
        onClick={handlePlayPause}
      />
      {!playing && (
        <button type="button" className="reels-slide-play-btn" onClick={handlePlayPause} aria-label="Play">
          <Play size={72} fill="currentColor" />
        </button>
      )}

      <Link to="/app/create?type=reel" className="reels-fab" aria-label="Post reel">
        <Plus size={28} />
      </Link>

      <div className="reels-actions">
        <button type="button" className={`reels-action ${liked ? 'active' : ''}`} onClick={handleLike} aria-label={liked ? 'Unlike' : 'Like'}>
          <ThumbsUp size={32} />
          <span>{formatCount(likesCount)}</span>
        </button>
        <button type="button" className="reels-action" aria-label="Comments">
          <MessageCircle size={32} />
          <span>{formatCount(item.comments ?? 0)}</span>
        </button>
        <button type="button" className="reels-action" aria-label="Share">
          <Share2 size={32} />
          <span>{formatCount(item.shares ?? 0)}</span>
        </button>
        <button type="button" className="reels-action reels-action-more" aria-label="More">
          <MoreHorizontal size={28} />
        </button>
      </div>

      <div className="reels-info">
        <div className="reels-info-author">
          <Avatar user={item.author} size={40} className="reels-info-avatar" />
          <span className="reels-info-username">{item.author?.name ?? 'User'}</span>
          <button type="button" className="reels-info-follow">Follow</button>
        </div>
        {item.description && <p className="reels-info-caption">{item.description}</p>}
      </div>

      <div className="reels-progress-wrap">
        <div className="reels-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default function Reels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' = feed of cards, 'player' = full-height reel view
  const loadMoreRef = useRef(null);

  const loadPage = useCallback((pageNum) => {
    return getReels({ page: pageNum, size: 20 }).then((list) => {
      const next = Array.isArray(list) ? list.map(normalizeReel) : [];
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    loadPage(0)
      .then((list) => {
        if (!cancelled) {
          setItems(list);
          setHasMore(list.length >= 20);
          setPage(1);
          setCurrentIndex(0);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load reels');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loadPage]);

  useEffect(() => {
    if (!loadMoreRef.current || loading || loadingMore || !hasMore || items.length === 0) return;
    const el = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loadingMore || !hasMore) return;
        setLoadingMore(true);
        loadPage(page)
          .then((list) => {
            setItems((prev) => {
              const ids = new Set(prev.map((i) => i.id));
              const added = list.filter((i) => !ids.has(i.id));
              return prev.concat(added);
            });
            setHasMore(list.length >= 20);
            setPage((p) => p + 1);
          })
          .catch(() => setHasMore(false))
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadingMore, loadPage]);

  const handleLikeChange = useCallback((id, liked, newCount) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, liked, likes: newCount } : i)));
  }, []);
  const handleSaveChange = useCallback((id, saved) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, saved } : i)));
  }, []);

  if (loading) {
    return (
      <div className="reels-page reels-page-loading">
        <div className="reels-loading-spinner" />
        <p>Loading reels…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reels-page">
        <div className="reels-page-header">
          <h1 className="reels-page-title">Reels</h1>
          <Link to="/app/create?type=reel" className="reels-page-create-btn" aria-label="Post reel">
            <Plus size={24} />
            <span>Post reel</span>
          </Link>
        </div>
        <div className="user-app-card" style={{ padding: 16, color: '#b91c1c' }}>{error}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="reels-page">
        <div className="reels-page-header">
          <h1 className="reels-page-title">Reels</h1>
          <Link to="/app/create?type=reel" className="reels-page-create-btn" aria-label="Post reel">
            <Plus size={24} />
            <span>Post reel</span>
          </Link>
        </div>
        <div className="reels-empty">
          <Play size={64} className="reels-empty-icon" />
          <p>No reels yet</p>
          <Link to="/app/create?type=reel" className="reels-page-create-btn">Post a reel</Link>
        </div>
      </div>
    );
  }

  // List view: feed of reel cards (like the reference image)
  if (viewMode === 'list') {
    return (
      <div className="reels-page reels-page-list">
        <div className="reels-page-header reels-list-header">
          <h1 className="reels-page-title">Reels</h1>
          <Link to="/app/create?type=reel" className="reels-page-create-btn" aria-label="Post reel">
            <Plus size={24} />
            <span>Post reel</span>
          </Link>
        </div>
        <div className="reels-feed-list">
          {items.map((item, index) => (
            <ReelCard
              key={item.id}
              item={item}
              index={index}
              onPlay={(idx) => {
                setCurrentIndex(idx);
                setViewMode('player');
              }}
              onLikeChange={handleLikeChange}
              onSaveChange={handleSaveChange}
            />
          ))}
          <div ref={loadMoreRef} className="reels-load-more-sentinel" aria-hidden />
          {loadingMore && (
            <div className="reels-loading-more" style={{ padding: 16, textAlign: 'center', color: '#65676b' }}>
              Loading more…
            </div>
          )}
        </div>
      </div>
    );
  }

  // Player view: full-height reel (current design), with back to list
  const current = items[currentIndex];
  const hasNext = currentIndex < items.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <div className="reels-page reels-page-feed">
      <button
        type="button"
        className="reels-player-back"
        onClick={() => setViewMode('list')}
        aria-label="Back to reels list"
      >
        <X size={24} />
      </button>
      <ReelSlide
        key={current.id}
        item={current}
        isActive
        onLikeChange={handleLikeChange}
        onSaveChange={handleSaveChange}
        onNext={hasNext ? () => setCurrentIndex((i) => i + 1) : undefined}
        onPrev={hasPrev ? () => setCurrentIndex((i) => i - 1) : undefined}
      />
      {hasPrev && (
        <button type="button" className="reels-nav reels-nav-prev" onClick={() => setCurrentIndex((i) => i - 1)} aria-label="Previous reel">
          <ChevronDown size={28} />
        </button>
      )}
      {hasNext && (
        <button type="button" className="reels-nav reels-nav-next" onClick={() => setCurrentIndex((i) => i + 1)} aria-label="Next reel">
          <ChevronUp size={28} />
        </button>
      )}
      <div ref={loadMoreRef} className="reels-load-more-sentinel" aria-hidden />
    </div>
  );
}
