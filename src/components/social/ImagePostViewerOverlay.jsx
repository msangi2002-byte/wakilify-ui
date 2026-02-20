/**
 * Facebook-style fullscreen viewer for image posts: click image in feed to open.
 * Shows image(s) large, close button, author + caption, like/comment/share/save.
 */
import { useState, useEffect } from 'react';
import { X, ThumbsUp, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';

export function ImagePostViewerOverlay({
  isOpen,
  onClose,
  media = [],
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
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(!!initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [saved, setSaved] = useState(!!initialSaved);

  useEffect(() => {
    if (isOpen) {
      setLiked(!!initialLiked);
      setLikesCount(initialLikesCount);
      setSaved(!!initialSaved);
      setCurrentIndex(0);
    }
  }, [isOpen, initialLiked, initialLikesCount, initialSaved]);

  const imageUrls = media
    .filter((item) => {
      const isVideo = typeof item === 'object' && item?.isVideo;
      return !isVideo;
    })
    .map((item) => (typeof item === 'string' ? item : item?.url))
    .filter(Boolean);

  const hasMultiple = imageUrls.length > 1;
  const currentUrl = imageUrls[currentIndex] ?? null;

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
  if (imageUrls.length === 0) return null;

  return (
    <div
      className="image-post-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Post"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <button
        type="button"
        className="image-post-viewer-close"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div className="image-post-viewer-content" onClick={(e) => e.stopPropagation()}>
        {hasMultiple && currentIndex > 0 && (
          <button
            type="button"
            className="image-post-viewer-nav image-post-viewer-nav-prev"
            onClick={() => setCurrentIndex((i) => i - 1)}
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <div className="image-post-viewer-image-wrap">
          <img src={currentUrl} alt="" className="image-post-viewer-image" />
        </div>

        {hasMultiple && currentIndex < imageUrls.length - 1 && (
          <button
            type="button"
            className="image-post-viewer-nav image-post-viewer-nav-next"
            onClick={() => setCurrentIndex((i) => i + 1)}
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Dots for multiple images */}
      {hasMultiple && (
        <div className="image-post-viewer-dots">
          {imageUrls.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`image-post-viewer-dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Right-side actions (Facebook/Reels style) */}
      <div className="image-post-viewer-actions">
        <button
          type="button"
          className={`image-post-viewer-action ${liked ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <ThumbsUp size={28} />
          <span>{formatCount(likesCount)}</span>
        </button>
        <button
          type="button"
          className="image-post-viewer-action"
          onClick={(e) => { e.stopPropagation(); onComment?.(); }}
          aria-label="Comment"
        >
          <MessageCircle size={28} />
          <span>{formatCount(commentsCount)}</span>
        </button>
        <button
          type="button"
          className="image-post-viewer-action"
          onClick={(e) => { e.stopPropagation(); onShare?.(); }}
          aria-label="Share"
        >
          <Share2 size={28} />
          <span>Share</span>
        </button>
        <button
          type="button"
          className={`image-post-viewer-action ${saved ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleSave(); }}
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <Bookmark size={26} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Bottom: author + caption */}
      <div className="image-post-viewer-info">
        <div className="image-post-viewer-info-author">
          <div className="image-post-viewer-info-avatar">
            {authorPic ? (
              <img src={authorPic} alt="" />
            ) : (
              <span>{authorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="image-post-viewer-info-username">{authorName}</span>
        </div>
        {description && <p className="image-post-viewer-info-caption">{description}</p>}
      </div>
    </div>
  );
}
