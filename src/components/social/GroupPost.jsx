import { useState } from 'react';
import { MoreHorizontal, ThumbsUp, MessageCircle, Share2, X } from 'lucide-react';
import { likePost, unlikePost, getComments, addComment, deleteComment } from '@/lib/api/posts';
import { useAuthStore } from '@/store/auth.store';

function formatCommentTime(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

function Avatar({ user, size = 40, className = '' }) {
  const src = user?.profilePic;
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
      }}
    >
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  );
}

function MediaGrid({ images = [] }) {
  if (!images.length) return null;
  const count = images.length;

  const gridClass =
    count === 1
      ? 'group-post-media-single'
      : count === 2
        ? 'group-post-media-two'
        : count === 3
          ? 'group-post-media-three'
          : 'group-post-media-four';

  return (
    <div className={`group-post-media-grid ${gridClass}`}>
      {images.slice(0, 4).map((img, i) => (
        <div key={i} className="group-post-media-item">
          {img.url ? (
            <img src={img.url} alt="" />
          ) : (
            <div className="group-post-media-placeholder" />
          )}
          {count > 4 && i === 3 && (
            <span className="group-post-media-more">+{count - 4}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function GroupPost({
  postId,
  author,
  groupName,
  time,
  description,
  images = [],
  likesCount: initialLikesCount = 0,
  commentsCount: initialCommentsCount = 0,
  sharesCount = 0,
  showGroupContext = true,
  initialLiked = false,
  onLikeChange,
  onCommentCountChange,
}) {
  const { user: currentUser } = useAuthStore();
  const [liked, setLiked] = useState(!!initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const shortDesc = description && description.length > 120 ? description.slice(0, 120) + '...' : description;
  const showSeeMore = description && description.length > 120 && !expanded;

  const handleLikeClick = async () => {
    if (!postId || likeLoading) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    setLikeLoading(true);
    try {
      if (next) await likePost(postId);
      else await unlikePost(postId);
      onLikeChange?.(postId, next);
    } catch {
      setLiked(!next);
      setLikesCount((c) => (next ? c - 1 : c + 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    if (!postId) return;
    setCommentsLoading(true);
    try {
      const list = await getComments(postId, { page: 0, size: 50 });
      setComments(Array.isArray(list) ? list : []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCommentClick = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) loadComments();
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!postId || !content || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(postId, content);
      setCommentText('');
      setCommentsCount((c) => c + 1);
      onCommentCountChange?.(postId);
      await loadComments();
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((c) => Math.max(0, c - 1));
      onCommentCountChange?.(postId);
    } catch (_) {}
  };

  return (
    <div className="user-app-card group-post">
      <div className="group-post-header">
        <Avatar user={author} size={40} className="group-post-avatar" />
        <div className="group-post-meta">
          <div className="group-post-meta-top">
            <span className="group-post-name">{author?.name || 'User'}</span>
            {showGroupContext && groupName && (
              <span className="group-post-group-context">
                <span className="group-post-group-sep"> · </span>
                <span className="group-post-group-name">{groupName}</span>
              </span>
            )}
          </div>
          <span className="group-post-time">{time}</span>
        </div>
        <div className="group-post-header-actions">
          <button type="button" className="group-post-option" aria-label="Options">
            <MoreHorizontal size={20} />
          </button>
          <button type="button" className="group-post-option" aria-label="Close">
            <X size={20} />
          </button>
        </div>
      </div>
      {description && (
        <div className="group-post-description">
          {expanded ? description : shortDesc}
          {showSeeMore && (
            <button type="button" className="group-post-see-more" onClick={() => setExpanded(true)}>
              See more
            </button>
          )}
        </div>
      )}
      <div className="group-post-body">
        <MediaGrid images={images} />
      </div>
      <div className="group-post-engagement">
        <div className="group-post-counts">
          {likesCount > 0 && (
            <span className="group-post-likes-count">
              <ThumbsUp size={16} fill="currentColor" />
              {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount} reactions
            </span>
          )}
          <span className="group-post-comments-share">
            {commentsCount > 0 && (
              <span>
                {postId ? (
                  <button type="button" className="feed-post-comments-link" onClick={handleCommentClick}>
                    {commentsCount} comments
                  </button>
                ) : (
                  `${commentsCount} comments`
                )}
              </span>
            )}
            {sharesCount > 0 && <span>{sharesCount} shares</span>}
          </span>
        </div>
        <div className="group-post-actions">
          {postId ? (
            <>
              <button
                type="button"
                className={`group-post-action ${liked ? 'active' : ''}`}
                onClick={handleLikeClick}
                disabled={likeLoading}
              >
                <ThumbsUp size={20} />
                Like
              </button>
              <button
                type="button"
                className={`group-post-action ${showComments ? 'active' : ''}`}
                onClick={handleCommentClick}
              >
                <MessageCircle size={20} />
                Comment
              </button>
            </>
          ) : (
            <>
              <button type="button" className={`group-post-action ${liked ? 'active' : ''}`} onClick={() => setLiked(!liked)}>
                <ThumbsUp size={20} />
                Like
              </button>
              <button type="button" className="group-post-action">
                <MessageCircle size={20} />
                Comment
              </button>
            </>
          )}
          <button type="button" className="group-post-action">
            <Share2 size={20} />
            Share
          </button>
        </div>
      </div>
      {postId && showComments && (
        <div className="feed-post-comments">
          {commentsLoading ? (
            <p className="feed-post-comments-loading">Loading comments…</p>
          ) : (
            <ul className="feed-post-comments-list">
              {comments.map((c) => {
                const commentAuthor = c.author ?? c.user ?? {};
                const name = commentAuthor.name ?? commentAuthor.username ?? 'User';
                const profilePic = commentAuthor.profilePic ?? commentAuthor.avatar ?? commentAuthor.image;
                const isOwn = currentUser?.id && (commentAuthor.id === currentUser.id || String(c.userId) === String(currentUser.id));
                return (
                  <li key={c.id} className="feed-post-comment-item">
                    <Avatar user={{ name, profilePic }} size={32} className="feed-post-comment-avatar" />
                    <div className="feed-post-comment-body">
                      <div className="feed-post-comment-bubble">
                        <span className="feed-post-comment-author">{name}</span>
                        <span className="feed-post-comment-content">{c.content ?? c.text ?? ''}</span>
                      </div>
                      <div className="feed-post-comment-meta">
                        <span className="feed-post-comment-time">{formatCommentTime(c.createdAt ?? c.created_at)}</span>
                        {isOwn && (
                          <button
                            type="button"
                            className="feed-post-comment-delete"
                            onClick={() => handleDeleteComment(c.id)}
                            aria-label="Delete comment"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <form onSubmit={handleSubmitComment} className="feed-post-comment-form">
            <Avatar user={currentUser} size={32} className="feed-post-comment-form-avatar" />
            <div className="feed-post-comment-form-wrap">
              <input
                type="text"
                className="feed-post-comment-input"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
              />
              <button type="submit" className="feed-post-comment-submit" disabled={!commentText.trim() || commentSubmitting}>
                {commentSubmitting ? '…' : 'Comment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
