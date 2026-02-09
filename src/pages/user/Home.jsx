import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Users, Video, MoreHorizontal, Plus, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getFeed, getPublicFeed, getStories, likePost, unlikePost, getComments, addComment, deleteComment } from '@/lib/api/posts';
import { followUser, unfollowUser } from '@/lib/api/friends';

function groupStoriesByAuthor(stories, currentUserId) {
  const map = new Map();
  for (const s of stories) {
    const author = s.author ?? {};
    const id = author.id ?? s.authorId;
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, { authorId: id, author: { id: author.id, name: author.name, profilePic: author.profilePic }, stories: [] });
    }
    map.get(id).stories.push(s);
  }
  const list = Array.from(map.values());
  for (const g of list) {
    g.stories.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
  }
  list.sort((a, b) => {
    const aIsMe = a.authorId === currentUserId ? 1 : 0;
    const bIsMe = b.authorId === currentUserId ? 1 : 0;
    if (aIsMe !== bIsMe) return bIsMe - aIsMe;
    const aTime = a.stories[0]?.createdAt ?? '';
    const bTime = b.stories[0]?.createdAt ?? '';
    return new Date(bTime) - new Date(aTime);
  });
  return list;
}

function getStoryThumbnail(story) {
  const media = story?.media;
  if (!Array.isArray(media) || media.length === 0) return null;
  const first = media[0];
  return typeof first === 'string' ? first : first?.url ?? first?.thumbnailUrl ?? null;
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

function formatPostTime(createdAt) {
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

function FeedPost({ id, author, time, description, media = [], liked: initialLiked = false, likesCount: initialLikesCount = 0, commentsCount: initialCommentsCount = 0, sharesCount = 0, authorIsFollowed: initialAuthorIsFollowed = false, onFollowChange }) {
  const { user: currentUser } = useAuthStore();
  const isSelf = currentUser?.id && author?.id && currentUser.id === author.id;
  const [liked, setLiked] = useState(!!initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [authorIsFollowed, setAuthorIsFollowed] = useState(!!initialAuthorIsFollowed);
  const [followLoading, setFollowLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const shortDesc = description && description.length > 120 ? description.slice(0, 120) + '...' : description;
  const showSeeMore = description && description.length > 120 && !expanded;

  const handleLikeClick = async () => {
    if (!id || likeLoading) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
    setLikeLoading(true);
    try {
      if (nextLiked) await likePost(id);
      else await unlikePost(id);
    } catch {
      setLiked(!nextLiked);
      setLikesCount((c) => (nextLiked ? c - 1 : c + 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const list = await getComments(id, { page: 0, size: 20 });
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
    if (!id || !content || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(id, content);
      setCommentText('');
      setCommentsCount((c) => c + 1);
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
    } catch (_) {}
  };

  const handleFollowClick = async () => {
    if (!author?.id || isSelf || followLoading) return;
    setFollowLoading(true);
    try {
      if (authorIsFollowed) {
        await unfollowUser(author.id);
        setAuthorIsFollowed(false);
        onFollowChange?.(author.id, false);
      } else {
        await followUser(author.id);
        setAuthorIsFollowed(true);
        onFollowChange?.(author.id, true);
      }
    } catch (_) {}
    finally {
      setFollowLoading(false);
    }
  };

  return (
    <div className="user-app-card feed-post">
      <div className="feed-post-header">
        <Avatar user={author} size={40} className="feed-post-avatar" />
        <div className="feed-post-meta">
          <div className="feed-post-meta-top">
            <span className="feed-post-name">{author?.name || 'User'}</span>
            {!isSelf && author?.id && (
              <button
                type="button"
                className={`feed-post-follow ${authorIsFollowed ? 'following' : ''}`}
                onClick={handleFollowClick}
                disabled={followLoading}
              >
                {followLoading ? '…' : authorIsFollowed ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <span className="feed-post-time">{time}</span>
        </div>
        <button type="button" className="feed-post-options" aria-label="Post options">
          <MoreHorizontal size={20} />
        </button>
      </div>
      {description && (
        <div className="feed-post-description">
          {expanded ? description : shortDesc}
          {showSeeMore && (
            <button type="button" className="feed-post-see-more" onClick={() => setExpanded(true)}>
              See more
            </button>
          )}
        </div>
      )}
      {(media?.length > 0) && (
        <div className="feed-post-body">
          {media.map((url, i) => (
            <img key={i} src={url} alt="" />
          ))}
        </div>
      )}
      <div className="feed-post-engagement">
        <div className="feed-post-counts">
          {likesCount > 0 && (
            <span className="feed-post-likes-count">
              <ThumbsUp size={16} fill="currentColor" />
              {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
            </span>
          )}
          <span className="feed-post-comments-share">
            <button type="button" className="feed-post-comments-link" onClick={handleCommentClick}>
              {commentsCount} comments
            </button>
            {sharesCount > 0 && <span>{sharesCount} shares</span>}
          </span>
        </div>
        <div className="feed-post-actions">
          <button
            type="button"
            className={`feed-post-action ${liked ? 'active' : ''}`}
            onClick={handleLikeClick}
            disabled={likeLoading}
          >
            <ThumbsUp size={20} />
            Like
          </button>
          <button
            type="button"
            className={`feed-post-action ${showComments ? 'active' : ''}`}
            onClick={handleCommentClick}
          >
            <MessageCircle size={20} />
            Comment
          </button>
          <button type="button" className="feed-post-action">
            <Share2 size={20} />
            Share
          </button>
        </div>
      </div>
      {showComments && (
        <div className="feed-post-comments">
          {commentsLoading ? (
            <p className="feed-post-comments-loading">Loading comments…</p>
          ) : (
            <ul className="feed-post-comments-list">
              {comments.map((c) => {
                const commentAuthor = c.author ?? c.user ?? {};
                const name = commentAuthor.name ?? commentAuthor.username ?? 'User';
                const profilePic = commentAuthor.profilePic ?? commentAuthor.avatar ?? commentAuthor.image;
                const isOwn = currentUser?.id && (commentAuthor.id === currentUser.id || c.userId === currentUser.id);
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

function normalizePost(post) {
  const author = post.author ?? post.user ?? {};
  const name = author.name ?? author.username ?? 'User';
  const profilePic = author.profilePic ?? author.avatar ?? author.image;
  const media =
    post.media ??
    post.attachments ??
    post.images ??
    (post.mediaUrls ? (Array.isArray(post.mediaUrls) ? post.mediaUrls : [post.mediaUrls]) : []);
  const urls = Array.isArray(media)
    ? media.map((m) => (typeof m === 'string' ? m : m?.url ?? m?.src))
    : [];
  return {
    id: post.id,
    author: { id: author.id, name, profilePic },
    time: formatPostTime(post.createdAt ?? post.created_at),
    description: post.caption ?? post.content ?? post.description ?? '',
    media: urls.filter(Boolean),
    liked: !!post.userReaction,
    likesCount: post.reactionsCount ?? post.likesCount ?? post.likes_count ?? post.likeCount ?? 0,
    commentsCount: post.commentsCount ?? post.comments_count ?? post.commentCount ?? 0,
    sharesCount: post.sharesCount ?? post.shares_count ?? 0,
    authorIsFollowed: !!post.authorIsFollowed,
  };
}

export default function Home() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storyGroups, setStoryGroups] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const fetchFeed = currentUser?.id ? getFeed : getPublicFeed;
    fetchFeed({ page: 0, size: 20 })
      .then((list) => {
        if (!cancelled) setPosts(Array.isArray(list) ? list.map(normalizePost) : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load posts');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    setStoriesLoading(true);
    getStories()
      .then((list) => {
        if (!cancelled) setStoryGroups(groupStoriesByAuthor(list ?? [], user?.id ?? null));
      })
      .catch(() => {
        if (!cancelled) setStoryGroups([]);
      })
      .finally(() => {
        if (!cancelled) setStoriesLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <>
      {/* Stories */}
      <div className="user-app-card">
        <div className="user-app-stories-header">
          <h3>Stories</h3>
          <Link to="/app/stories">See All</Link>
        </div>
        <div className="user-app-stories-row">
          <Link to="/app/stories/create" className="user-app-story-card create">
            <div className="avatar-wrap">
              <Avatar user={user} size={56} />
              <span className="plus-icon">
                <Plus size={14} strokeWidth={3} />
              </span>
            </div>
            <span className="label">Create Story</span>
          </Link>
          {!storiesLoading && storyGroups.map((group) => {
            const thumb = getStoryThumbnail(group.stories[0]);
            const authorId = group.authorId ?? group.author?.id;
            return (
              <Link key={authorId} to={`/app/stories/view/${authorId}`} className="user-app-story-card">
                {thumb && <div className="story-bg story-bg-img" style={{ backgroundImage: `url(${thumb})` }} />}
                {!thumb && <div className="story-bg" />}
                <div className="story-ring-inner">
                  <Avatar user={group.author} size={40} className="story-avatar" />
                </div>
                <span className="story-name">{group.author?.name ?? 'User'}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* What's on your mind? */}
      <div className="user-app-card">
        <Link to="/app/create" className="user-app-composer">
          <Avatar user={user} size={40} className="user-app-composer-avatar" />
          <span className="user-app-composer-input user-app-composer-placeholder">What's on your mind?</span>
        </Link>
        <div className="user-app-composer-actions">
          <Link to="/app/create" className="user-app-composer-btn post">
            <ImagePlus size={24} />
            Post
          </Link>
          <button type="button" className="user-app-composer-btn trade">
            <Users size={24} />
            Trade
          </button>
          <button type="button" className="user-app-composer-btn video">
            <Video size={24} />
            Video
          </button>
          <button type="button" className="user-app-post-options" aria-label="More options">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Feed posts */}
      {error && (
        <div className="user-app-card" style={{ padding: 16, color: '#b91c1c' }}>
          {error}
        </div>
      )}
      {loading && (
        <div className="user-app-card" style={{ padding: 24, textAlign: 'center', color: '#65676b' }}>
          Loading posts…
        </div>
      )}
      {!loading && !error && posts.length === 0 && (
        <div className="user-app-card" style={{ padding: 24, textAlign: 'center', color: '#65676b' }}>
          No posts yet. Be the first to post!
        </div>
      )}
      {!loading && posts.length > 0 && posts.map((p) => (
        <FeedPost
          key={p.id ?? p.time + p.description?.slice(0, 20)}
          id={p.id}
          author={p.author}
          time={p.time}
          description={p.description}
          media={p.media}
          liked={p.liked}
          likesCount={p.likesCount}
          commentsCount={p.commentsCount}
          sharesCount={p.sharesCount}
          authorIsFollowed={p.authorIsFollowed}
        />
      ))}
    </>
  );
}
