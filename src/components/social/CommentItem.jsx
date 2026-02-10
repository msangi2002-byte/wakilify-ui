/**
 * Single comment with Like, Reply, nested replies. Used in FeedPost and GroupPost.
 */
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';

export function CommentItem({
  comment,
  currentUser,
  onDelete,
  onLike,
  onReply,
  replyingTo,
  replyText,
  setReplyText,
  onSubmitReply,
  commentSubmitting,
  formatTime,
}) {
  const author = comment.author ?? comment.user ?? {};
  const isOwn = currentUser?.id && (author.id === currentUser.id || comment.userId === currentUser.id);
  const liked = !!comment.userLiked;
  const replies = comment.replies ?? [];

  return (
    <li className={`feed-post-comment-item ${replies.length ? 'feed-post-comment-has-replies' : ''}`}>
      <UserProfileMenu user={author} avatarSize={32} className="feed-post-comment-avatar-wrap" showName={false} />
      <div className="feed-post-comment-body">
        <div className="feed-post-comment-bubble">
          <UserProfileMenu user={author} showAvatar={false} className="feed-post-comment-author-inline" />
          {' '}
          <span className="feed-post-comment-content">{comment.content ?? comment.text ?? ''}</span>
        </div>
        <div className="feed-post-comment-actions">
          <span className="feed-post-comment-time">{formatTime(comment.createdAt ?? comment.created_at)}</span>
          <button
            type="button"
            className={`feed-post-comment-action ${liked ? 'active' : ''}`}
            onClick={() => onLike(comment.id, liked)}
          >
            {liked ? 'Liked' : 'Like'}
          </button>
          <button type="button" className="feed-post-comment-action" onClick={() => onReply(comment.id)}>
            Reply
          </button>
          {comment.likesCount > 0 && (
            <span className="feed-post-comment-likes-count">{comment.likesCount}</span>
          )}
          {isOwn && (
            <button type="button" className="feed-post-comment-delete" onClick={() => onDelete(comment.id)}>
              Delete
            </button>
          )}
        </div>
        {replyingTo === comment.id && (
          <form onSubmit={(e) => onSubmitReply(e, comment.id)} className="feed-post-reply-form">
            <input
              type="text"
              className="feed-post-comment-input"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={2000}
              autoFocus
            />
            <button type="submit" className="feed-post-comment-submit" disabled={!replyText.trim() || commentSubmitting}>
              Reply
            </button>
            <button type="button" className="feed-post-reply-cancel" onClick={() => { onReply(null); setReplyText(''); }}>
              Cancel
            </button>
          </form>
        )}
        {replies.length > 0 && (
          <ul className="feed-post-comments-replies">
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                currentUser={currentUser}
                onDelete={onDelete}
                onLike={onLike}
                onReply={onReply}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                onSubmitReply={onSubmitReply}
                commentSubmitting={commentSubmitting}
                formatTime={formatTime}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
