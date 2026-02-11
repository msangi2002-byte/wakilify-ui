import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Plus, Play, X, Bookmark, Radio } from 'lucide-react';
import { getReels, likePost, unlikePost, savePost, unsavePost, getComments, addComment, deleteComment, likeComment, unlikeComment, sharePostToStory, createPost } from '@/lib/api/posts';
import { followUser, unfollowUser } from '@/lib/api/friends';
import { formatPostTime, formatCommentTime } from '@/lib/utils/dateUtils';
import { CommentItem } from '@/components/social/CommentItem';
import { useAuthStore } from '@/store/auth.store';

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
    authorIsFollowed: !!post.authorIsFollowed,
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

/** Comments drawer for a reel (post). Loads comments, add new, delete, like. Exported for use in Home video overlay. */
export function ReelCommentsDrawer({ postId, onClose, onCommentCountChange }) {
  const { user: currentUser } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const loadComments = useCallback(() => {
    if (!postId) return;
    setLoading(true);
    getComments(postId, { page: 0, size: 50 })
      .then((list) => setComments(Array.isArray(list) ? list : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!postId || !content || submitting) return;
    setSubmitting(true);
    try {
      await addComment(postId, content);
      setCommentText('');
      const list = await getComments(postId, { page: 0, size: 50 });
      const next = Array.isArray(list) ? list : [];
      setComments(next);
      onCommentCountChange?.(postId, next.length);
    } catch (_) {}
    finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    const content = replyText.trim();
    if (!postId || !content || !parentId || submitting) return;
    setSubmitting(true);
    try {
      await addComment(postId, content, parentId);
      setReplyText('');
      setReplyingTo(null);
      const list = await getComments(postId, { page: 0, size: 50 });
      const next = Array.isArray(list) ? list : [];
      setComments(next);
      onCommentCountChange?.(postId, next.length);
    } catch (_) {}
    finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      const list = await getComments(postId, { page: 0, size: 50 });
      const next = Array.isArray(list) ? list : [];
      setComments(next);
      onCommentCountChange?.(postId, next.length);
    } catch (_) {}
  };

  const handleLike = async (commentId, currentlyLiked) => {
    try {
      if (currentlyLiked) await unlikeComment(commentId);
      else await likeComment(commentId);
      const list = await getComments(postId, { page: 0, size: 50 });
      setComments(Array.isArray(list) ? list : []);
    } catch (_) {}
  };

  return (
    <div className="reels-comments-overlay" onClick={onClose} role="presentation">
      <div className="reels-comments-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="reels-comments-header">
          <h3 className="reels-comments-title">Comments</h3>
          <button type="button" className="reels-comments-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <ul className="reels-comments-list">
          {loading ? (
            <li className="reels-comments-loading">Loading…</li>
          ) : comments.length === 0 ? (
            <li className="reels-comments-empty">No comments yet.</li>
          ) : (
            comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUser={currentUser}
                onDelete={handleDelete}
                onLike={handleLike}
                onReply={(id) => setReplyingTo(id)}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                onSubmitReply={handleSubmitReply}
                commentSubmitting={submitting}
                formatTime={formatCommentTime}
              />
            ))
          )}
        </ul>
        <form onSubmit={handleSubmit} className="reels-comments-input-wrap">
          <input
            type="text"
            className="reels-comments-input"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={2000}
            disabled={submitting}
          />
          <button type="submit" className="reels-comments-submit" disabled={!commentText.trim() || submitting}>
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

/** Share menu for a reel: Copy link, Share to story, Repost to feed. Exported for use in Home video overlay. */
export function ReelShareMenu({ item, onClose }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // 'copied' | 'story' | 'repost'

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/app/post/${item?.id ?? ''}`;
      await navigator.clipboard.writeText(url);
      setDone('copied');
      setTimeout(onClose, 800);
    } catch (_) {
      onClose();
    }
  };

  const handleShareToStory = async () => {
    if (!item?.id || loading) return;
    setLoading(true);
    try {
      await sharePostToStory(item.id, '');
      setDone('story');
      setTimeout(onClose, 800);
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  const handleRepost = async () => {
    if (!item?.id || loading) return;
    setLoading(true);
    try {
      await createPost({ caption: '', originalPostId: item.id, postType: 'POST', visibility: 'PUBLIC', files: [] });
      setDone('repost');
      setTimeout(onClose, 800);
    } catch (_) {}
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="reels-share-overlay" onClick={onClose} role="presentation">
      <div className="reels-share-menu" onClick={(e) => e.stopPropagation()}>
        <div className="reels-share-header">
          <span className="reels-share-title">Share reel</span>
          <button type="button" className="reels-share-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="reels-share-actions">
          <button type="button" className="reels-share-action" onClick={handleCopyLink}>
            Copy link
          </button>
          <button type="button" className="reels-share-action" onClick={handleShareToStory} disabled={loading}>
            {loading && done === 'story' ? 'Shared!' : 'Share to story'}
          </button>
          <button type="button" className="reels-share-action" onClick={handleRepost} disabled={loading}>
            {loading && done === 'repost' ? 'Reposted!' : 'Repost to feed'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** List view: card – homepage-style inline comments and share dropdown (before user clicks video). */
function ReelCard({ item, index, onPlay, onLikeChange, onSaveChange, onCommentCountChange, onFollowChange }) {
  const { user: currentUser } = useAuthStore();
  const [liked, setLiked] = useState(!!item.liked);
  const [likesCount, setLikesCount] = useState(item.likes ?? 0);
  const [saved, setSaved] = useState(!!item.saved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [followed, setFollowed] = useState(!!item.authorIsFollowed);
  const [followLoading, setFollowLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [commentsCount, setCommentsCount] = useState(item.comments ?? 0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const isSelf = currentUser?.id && item.author?.id && currentUser.id === item.author.id;

  const loadComments = useCallback(async () => {
    if (!item.id) return;
    setCommentsLoading(true);
    try {
      const list = await getComments(item.id, { page: 0, size: 50 });
      setComments(Array.isArray(list) ? list : []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [item.id]);

  const handleCommentClick = (e) => {
    e.stopPropagation();
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) loadComments();
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!item.id || !content || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(item.id, content);
      setCommentText('');
      setCommentsCount((c) => c + 1);
      onCommentCountChange?.(item.id, commentsCount + 1);
      await loadComments();
    } catch (_) {}
    finally {
      setCommentSubmitting(false);
    }
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    const content = replyText.trim();
    if (!item.id || !content || !parentId || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(item.id, content, parentId);
      setReplyText('');
      setReplyingTo(null);
      setCommentsCount((c) => c + 1);
      onCommentCountChange?.(item.id, commentsCount + 1);
      await loadComments();
    } catch (_) {}
    finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setCommentsCount((c) => Math.max(0, c - 1));
      onCommentCountChange?.(item.id, Math.max(0, commentsCount - 1));
      await loadComments();
    } catch (_) {}
  };

  const handleLikeComment = async (commentId, currentlyLiked) => {
    try {
      if (currentlyLiked) await unlikeComment(commentId);
      else await likeComment(commentId);
      const list = await getComments(item.id, { page: 0, size: 50 });
      setComments(Array.isArray(list) ? list : []);
    } catch (_) {}
  };

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

  const handleShareToStory = async () => {
    if (!item.id || shareLoading) return;
    setShareLoading(true);
    setShareOpen(false);
    try {
      await sharePostToStory(item.id, '');
    } catch (_) {}
    finally {
      setShareLoading(false);
    }
  };

  const handleRepost = async () => {
    if (!item.id || shareLoading) return;
    setShareLoading(true);
    setShareOpen(false);
    try {
      await createPost({ caption: '', originalPostId: item.id, postType: 'POST', visibility: 'PUBLIC', files: [] });
    } catch (_) {}
    finally {
      setShareLoading(false);
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

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!item.author?.id || isSelf || followLoading) return;
    const next = !followed;
    setFollowLoading(true);
    const prev = followed;
    try {
      if (next) await followUser(String(item.author.id));
      else await unfollowUser(String(item.author.id));
      setFollowed(next);
      onFollowChange?.(item.author.id, next);
    } catch (_) {
      setFollowed(prev);
    }
    finally {
      setFollowLoading(false);
    }
  };

  return (
    <article className="reels-card" onClick={() => onPlay(index)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(index); } }}>
      <div className="reels-card-header" onClick={(e) => e.stopPropagation()}>
        <Avatar user={item.author} size={40} className="reels-card-avatar" />
        <div className="reels-card-meta">
          <div className="reels-card-meta-row">
            <span className="reels-card-username">{item.author?.name ?? 'User'}</span>
            {!isSelf && (
              <button type="button" className={`reels-card-follow-btn ${followed ? 'following' : ''}`} onClick={handleFollow} disabled={followLoading}>
                {followed ? 'Following' : 'Follow'}
              </button>
            )}
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
      <div className="reels-card-engagement" onClick={(e) => e.stopPropagation()}>
        <div className="reels-card-counts">
          {likesCount > 0 && (
            <span className="reels-card-likes-count">
              <ThumbsUp size={16} fill="currentColor" />
              {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
            </span>
          )}
          <span className="reels-card-comments-share">
            <button type="button" className="reels-card-comments-link" onClick={handleCommentClick}>
              {commentsCount} comments
            </button>
            {(item.shares ?? 0) > 0 && <span>{item.shares} shares</span>}
          </span>
        </div>
        <div className="reels-card-actions">
          <button type="button" className={`reels-card-action ${liked ? 'active' : ''}`} onClick={handleLike}>
            <ThumbsUp size={20} />
            Like
          </button>
          <button type="button" className={`reels-card-action ${showComments ? 'active' : ''}`} onClick={handleCommentClick}>
            <MessageCircle size={20} />
            Comment
          </button>
          <div className="reels-card-share-wrap">
            <button type="button" className="reels-card-action" onClick={(e) => { e.stopPropagation(); setShareOpen((o) => !o); }} disabled={shareLoading}>
              <Share2 size={20} />
              Share
            </button>
            {shareOpen && (
              <div className="reels-card-share-menu">
                <button type="button" onClick={handleRepost} disabled={shareLoading}>Repost to feed</button>
                <button type="button" onClick={handleShareToStory} disabled={shareLoading}>Share to story</button>
              </div>
            )}
          </div>
          <button type="button" className={`reels-card-action ${saved ? 'active' : ''}`} onClick={handleSave}>
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
            Save
          </button>
        </div>
      </div>
      {showComments && (
        <div className="reels-card-comments" onClick={(e) => e.stopPropagation()}>
          {commentsLoading ? (
            <p className="reels-card-comments-loading">Loading comments…</p>
          ) : (
            <ul className="reels-card-comments-list">
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUser={currentUser}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                  onReply={(id) => setReplyingTo(id)}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  onSubmitReply={handleSubmitReply}
                  commentSubmitting={commentSubmitting}
                  formatTime={formatCommentTime}
                />
              ))}
            </ul>
          )}
          <form onSubmit={handleSubmitComment} className="reels-card-comment-form">
            <Avatar user={currentUser} size={36} className="reels-card-comment-form-avatar" />
            <div className="reels-card-comment-form-wrap">
              <input
                type="text"
                className="reels-card-comment-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
                disabled={commentSubmitting}
              />
            </div>
            <button type="submit" className="reels-card-comment-submit" disabled={!commentText.trim() || commentSubmitting} aria-label="Post comment">
              {commentSubmitting ? '…' : <MessageCircle size={20} />}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function ReelSlide({ item, isActive, onLikeChange, onSaveChange, onCommentClick, onShareClick, onFollowChange, onNext, onPrev }) {
  const { user: currentUser } = useAuthStore();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(!!item.liked);
  const [likesCount, setLikesCount] = useState(item.likes ?? 0);
  const [saved, setSaved] = useState(!!item.saved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [followed, setFollowed] = useState(!!item.authorIsFollowed);
  const [followLoading, setFollowLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStartY = useRef(0);
  const isSelf = currentUser?.id && item.author?.id && currentUser.id === item.author.id;

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

  const handleFollow = async () => {
    if (!item.author?.id || isSelf || followLoading) return;
    const next = !followed;
    setFollowLoading(true);
    const prev = followed;
    try {
      if (next) await followUser(String(item.author.id));
      else await unfollowUser(String(item.author.id));
      setFollowed(next);
      onFollowChange?.(item.author.id, next);
    } catch (_) {
      setFollowed(prev);
    }
    finally {
      setFollowLoading(false);
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

      <div className="reels-fab-row">
        <Link to="/app/create?type=reel" className="reels-fab" aria-label="Post reel">
          <Plus size={22} />
        </Link>
        <Link to="/app/live" className="reels-fab reels-fab-golive" aria-label="Go live">
          <Radio size={20} />
          <span className="reels-fab-golive-label">Go live</span>
        </Link>
      </div>

      <div className="reels-actions">
        <button type="button" className={`reels-action ${liked ? 'active' : ''}`} onClick={handleLike} aria-label={liked ? 'Unlike' : 'Like'}>
          <ThumbsUp size={32} />
          <span>{formatCount(likesCount)}</span>
        </button>
        <button type="button" className="reels-action" onClick={() => onCommentClick?.(item)} aria-label="Comments">
          <MessageCircle size={32} />
          <span>{formatCount(item.comments ?? 0)}</span>
        </button>
        <button type="button" className="reels-action" onClick={() => onShareClick?.(item)} aria-label="Share">
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
          {!isSelf && (
            <button type="button" className={`reels-info-follow ${followed ? 'following' : ''}`} onClick={handleFollow} disabled={followLoading}>
              {followed ? 'Following' : 'Follow'}
            </button>
          )}
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
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [shareItem, setShareItem] = useState(null);
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
  const handleCommentCountChange = useCallback((postId, newCount) => {
    setItems((prev) => prev.map((i) => (i.id === postId ? { ...i, comments: newCount } : i)));
  }, []);
  const handleFollowChange = useCallback((authorId, followed) => {
    setItems((prev) => prev.map((i) => (i.author?.id === authorId ? { ...i, authorIsFollowed: followed } : i)));
  }, []);
  const openComments = useCallback((item) => setCommentsPostId(item?.id ?? null), []);
  const openShare = useCallback((item) => setShareItem(item ?? null), []);

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
          <div className="reels-page-header-actions">
<Link to="/app/create?type=reel" className="reels-page-create-btn" aria-label="Post reel">
            <Plus size={18} />
            <span>Post reel</span>
          </Link>
            <Link to="/app/live" className="reels-page-golive-btn" aria-label="Go live">
              <Radio size={18} />
              <span>Go live</span>
            </Link>
          </div>
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
          <div className="reels-page-header-actions">
<Link to="/app/create?type=reel" className="reels-page-create-btn" aria-label="Post reel">
            <Plus size={18} />
            <span>Post reel</span>
          </Link>
            <Link to="/app/live" className="reels-page-golive-btn" aria-label="Go live">
              <Radio size={18} />
              <span>Go live</span>
            </Link>
          </div>
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
      <>
      <div className="reels-page reels-page-list">
        <div className="reels-page-header reels-list-header">
          <h1 className="reels-page-title">Reels</h1>
          <div className="reels-page-header-actions">
<Link to="/app/create?type=reel" className="reels-page-create-btn" aria-label="Post reel">
            <Plus size={18} />
            <span>Post reel</span>
          </Link>
            <Link to="/app/live" className="reels-page-golive-btn" aria-label="Go live">
              <Radio size={18} />
              <span>Go live</span>
            </Link>
          </div>
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
              onCommentCountChange={handleCommentCountChange}
              onFollowChange={handleFollowChange}
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
      </>
    );
  }

  // Player view: reel video with top/bottom nav visible on mobile (no close/prev/next buttons)
  const current = items[currentIndex];

  return (
    <>
    <div className="reels-page reels-page-feed">
      <ReelSlide
        key={current.id}
        item={current}
        isActive
        onLikeChange={handleLikeChange}
        onSaveChange={handleSaveChange}
        onCommentClick={openComments}
        onShareClick={openShare}
        onFollowChange={handleFollowChange}
        onNext={currentIndex < items.length - 1 ? () => setCurrentIndex((i) => i + 1) : undefined}
        onPrev={currentIndex > 0 ? () => setCurrentIndex((i) => i - 1) : undefined}
      />
      <div ref={loadMoreRef} className="reels-load-more-sentinel" aria-hidden />
    </div>
    {commentsPostId && (
      <ReelCommentsDrawer
        postId={commentsPostId}
        onClose={() => setCommentsPostId(null)}
        onCommentCountChange={handleCommentCountChange}
      />
    )}
    {shareItem && <ReelShareMenu item={shareItem} onClose={() => setShareItem(null)} />}
    </>
  );
}
