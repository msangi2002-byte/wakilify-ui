import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Users, Video, MoreHorizontal, Plus, ThumbsUp, MessageCircle, Share2, Play } from 'lucide-react';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { CommentItem } from '@/components/social/CommentItem';
import { VideoFullscreenOverlay } from '@/components/social/VideoFullscreenOverlay';
import { useAuthStore } from '@/store/auth.store';
import { getFeed, getPublicFeed, getStories, likePost, unlikePost, savePost, unsavePost, sharePostToStory, getComments, addComment, deleteComment, createPost, likeComment, unlikeComment } from '@/lib/api/posts';
import { followUser, unfollowUser } from '@/lib/api/friends';
import { blockUser } from '@/lib/api/users';
import { createReport } from '@/lib/api/reports';
import { parseApiDate, formatPostTime, formatCommentTime } from '@/lib/utils/dateUtils';

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
    g.stories.sort((a, b) => (parseApiDate(b.createdAt)?.getTime() ?? 0) - (parseApiDate(a.createdAt)?.getTime() ?? 0));
  }
  list.sort((a, b) => {
    const aIsMe = a.authorId === currentUserId ? 1 : 0;
    const bIsMe = b.authorId === currentUserId ? 1 : 0;
    if (aIsMe !== bIsMe) return bIsMe - aIsMe;
    const aTime = parseApiDate(a.stories[0]?.createdAt)?.getTime() ?? 0;
    const bTime = parseApiDate(b.stories[0]?.createdAt)?.getTime() ?? 0;
    return bTime - aTime;
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

function FeedPost({ id, author, time, description, media = [], hashtags = [], liked: initialLiked = false, likesCount: initialLikesCount = 0, commentsCount: initialCommentsCount = 0, sharesCount = 0, saved: initialSaved = false, authorIsFollowed: initialAuthorIsFollowed = false, onFollowChange, onSaveChange, videoIndex, onOpenVideo }) {
  const { user: currentUser } = useAuthStore();
  const isSelf = currentUser?.id && author?.id && currentUser.id === author.id;
  const [liked, setLiked] = useState(!!initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saved, setSaved] = useState(!!initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [authorIsFollowed, setAuthorIsFollowed] = useState(!!initialAuthorIsFollowed);
  const [followLoading, setFollowLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [videoFullscreenOpen, setVideoFullscreenOpen] = useState(false);
  const [feedVideoPlaying, setFeedVideoPlaying] = useState(false);
  const feedVideoRef = useRef(null);
  const feedVideoWrapRef = useRef(null);
  const shortDesc = description && description.length > 120 ? description.slice(0, 120) + '...' : description;
  const showSeeMore = description && description.length > 120 && !expanded;
  const rawVideoUrl = media?.length === 1 && media[0]?.isVideo
    ? (typeof media[0] === 'string' ? media[0] : media[0]?.url)
    : null;
  const videoUrl = typeof rawVideoUrl === 'string' && rawVideoUrl.trim() ? rawVideoUrl.trim() : null;
  const hasSingleVideo = !!videoUrl && media?.length === 1 && media[0]?.isVideo;

  useEffect(() => {
    if (!hasSingleVideo || !feedVideoWrapRef.current || !feedVideoRef.current) return;
    const wrap = feedVideoWrapRef.current;
    const video = feedVideoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e || !video) return;
        if (e.isIntersecting) {
          video.muted = true;
          video.play().then(() => setFeedVideoPlaying(true)).catch(() => {});
        } else {
          video.pause();
          setFeedVideoPlaying(false);
        }
      },
      { rootMargin: '0px', threshold: 0.25 }
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [hasSingleVideo, videoUrl]);

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

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    const content = replyText.trim();
    if (!id || !content || !parentId || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(id, content, parentId);
      setReplyText('');
      setReplyingTo(null);
      setCommentsCount((c) => c + 1);
      await loadComments();
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setCommentsCount((c) => Math.max(0, c - 1));
      await loadComments();
    } catch (_) {}
  };

  const handleLikeComment = async (commentId, currentlyLiked) => {
    try {
      const res = currentlyLiked ? await unlikeComment(commentId) : await likeComment(commentId);
      const newCount = res?.likesCount;
      const updateComment = (list, cid, liked, count) => list.map((c) => {
        if (c.id === cid) return { ...c, userLiked: liked, likesCount: count ?? c.likesCount };
        if (Array.isArray(c.replies) && c.replies.length) {
          return { ...c, replies: updateComment(c.replies, cid, liked, count) };
        }
        return c;
      });
      setComments((prev) => updateComment(prev, commentId, !currentlyLiked, newCount));
    } catch (_) {}
  };

  const handleFollowClick = async () => {
    if (!author?.id || isSelf || followLoading) return;
    setFollowLoading(true);
    const prevFollowed = authorIsFollowed;
    try {
      if (authorIsFollowed) {
        await unfollowUser(String(author.id));
        setAuthorIsFollowed(false);
        onFollowChange?.(author.id, false);
      } else {
        await followUser(String(author.id));
        setAuthorIsFollowed(true);
        onFollowChange?.(author.id, true);
      }
    } catch (err) {
      setAuthorIsFollowed(prevFollowed);
      const msg = err.response?.data?.message || err.message || 'Action failed';
      alert(msg);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveClick = async () => {
    if (!id || saveLoading) return;
    const next = !saved;
    setSaveLoading(true);
    try {
      if (next) await savePost(id);
      else await unsavePost(id);
      setSaved(next);
      onSaveChange?.(id, next);
    } catch (_) {}
    finally {
      setSaveLoading(false);
    }
  };

  const handleRepost = async () => {
    if (!id || shareLoading) return;
    setShareLoading(true);
    setShareOpen(false);
    try {
      await createPost({ caption: '', originalPostId: id, postType: 'POST', visibility: 'PUBLIC', files: [] });
      onFollowChange?.('reload');
    } catch (_) {}
    finally {
      setShareLoading(false);
    }
  };

  const handleShareToStory = async () => {
    if (!id || shareLoading) return;
    setShareLoading(true);
    setShareOpen(false);
    try {
      await sharePostToStory(id, '');
      onFollowChange?.('reload');
    } catch (_) {}
    finally {
      setShareLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!author?.id || isSelf) return;
    setOptionsOpen(false);
    try {
      await blockUser(author.id);
      onFollowChange?.('blocked', author.id);
    } catch (_) {}
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!id || reportSubmitting) return;
    const reason = reportReason || 'SPAM';
    setReportSubmitting(true);
    try {
      await createReport({ type: 'POST', targetId: id, reason, description: reportDesc });
      setReportOpen(false);
      setReportReason('');
      setReportDesc('');
    } catch (_) {}
    finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="user-app-card feed-post">
      <div className="feed-post-header">
        <UserProfileMenu user={author} avatarSize={40} className="feed-post-avatar-wrap" />
        <div className="feed-post-meta">
          <div className="feed-post-meta-top">
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
        <div className="feed-post-options-wrap">
          <button
            type="button"
            className="feed-post-options"
            aria-label="Post options"
            onClick={() => { setOptionsOpen((o) => !o); setShareOpen(false); }}
          >
            <MoreHorizontal size={20} />
          </button>
          {optionsOpen && (
            <div className="feed-post-options-menu">
              {!isSelf && author?.id && (
                <button type="button" className="feed-post-option-item feed-post-option-danger" onClick={handleBlockUser}>
                  Block user
                </button>
              )}
              <button type="button" className="feed-post-option-item" onClick={() => { setReportOpen(true); setOptionsOpen(false); }}>
                Report post
              </button>
            </div>
          )}
        </div>
      </div>

      {reportOpen && (
        <div className="feed-post-report-overlay" onClick={() => setReportOpen(false)} role="dialog">
          <div className="feed-post-report-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Report post</h3>
            <form onSubmit={handleReportSubmit}>
              <label className="feed-post-report-label">
                Reason
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} required>
                  <option value="">Chagua</option>
                  <option value="SPAM">Spam</option>
                  <option value="HARASSMENT">Harassment</option>
                  <option value="HATE_SPEECH">Hate speech</option>
                  <option value="VIOLENCE">Violence</option>
                  <option value="NUDITY">Nudity</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="feed-post-report-label">
                Description (optional)
                <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} rows={3} placeholder="Maelezo zaidi..." />
              </label>
              <div className="feed-post-report-actions">
                <button type="button" className="settings-btn settings-btn-secondary" onClick={() => setReportOpen(false)}>Cancel</button>
                <button type="submit" className="settings-btn settings-btn-primary" disabled={reportSubmitting}>{reportSubmitting ? '…' : 'Submit report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {description && (
        <div className="feed-post-description">
          {expanded ? description : shortDesc}
          {showSeeMore && (
            <button type="button" className="feed-post-see-more" onClick={() => setExpanded(true)}>
              See more
            </button>
          )}
          {Array.isArray(hashtags) && hashtags.length > 0 && (
            <span className="feed-post-hashtags">
              {' '}
              {hashtags.map((tag) => (
                <Link key={tag} to={`/app/explore/hashtag/${tag}`} className="feed-post-hashtag">
                  #{tag}
                </Link>
              ))}
            </span>
          )}
        </div>
      )}
      {(media?.length > 0) && (
        <div className="feed-post-body">
          {hasSingleVideo ? (
            <div
              ref={feedVideoWrapRef}
              className="feed-post-video-wrap"
              onClick={() => { if (onOpenVideo != null && videoIndex != null) onOpenVideo(videoIndex); else setVideoFullscreenOpen(true); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (onOpenVideo != null && videoIndex != null) onOpenVideo(videoIndex); else setVideoFullscreenOpen(true); } }}
              onFocus={() => { const v = feedVideoRef.current; if (v) { v.muted = true; v.play().catch(() => {}); } }}
              aria-label="Play video"
            >
              <video
                ref={feedVideoRef}
                src={videoUrl}
                playsInline
                className="feed-post-video"
                muted
                loop
                onError={() => {}}
                onPlay={() => setFeedVideoPlaying(true)}
                onPause={() => setFeedVideoPlaying(false)}
              />
              <div className={`feed-post-video-play-overlay ${feedVideoPlaying ? 'feed-post-video-play-overlay-hidden' : ''}`}>
                <Play size={72} className="feed-post-video-play-icon" fill="currentColor" />
              </div>
            </div>
          ) : (
            media.map((item, i) => {
              const url = typeof item === 'string' ? item : item?.url;
              const isVideo = typeof item === 'object' && item?.isVideo;
              if (!url) return null;
              return isVideo ? (
                <video key={i} src={url} controls playsInline className="feed-post-video" />
              ) : (
                <img key={i} src={url} alt="" loading="lazy" />
              );
            })
          )}
        </div>
      )}
      {hasSingleVideo && onOpenVideo == null && (
        <VideoFullscreenOverlay
          isOpen={videoFullscreenOpen}
          onClose={() => setVideoFullscreenOpen(false)}
          videoUrl={videoUrl}
          description={description}
          author={author}
          postId={id}
          liked={liked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          saved={saved}
          onLike={handleLikeClick}
          onComment={() => { setVideoFullscreenOpen(false); handleCommentClick(); }}
          onShare={() => { setVideoFullscreenOpen(false); setShareOpen(true); }}
          onSave={handleSaveClick}
        />
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
          <div className="feed-post-share-wrap">
            <button
              type="button"
              className="feed-post-action"
              onClick={() => setShareOpen((o) => !o)}
              disabled={shareLoading}
            >
              <Share2 size={20} />
              Share
            </button>
            {shareOpen && (
              <div className="feed-post-share-menu">
                <button type="button" onClick={handleRepost}>Repost to feed</button>
                <button type="button" onClick={handleShareToStory}>Share to story</button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={`feed-post-action ${saved ? 'active' : ''}`}
            onClick={handleSaveClick}
            disabled={saveLoading}
            title={saved ? 'Saved' : 'Save'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Save
          </button>
        </div>
      </div>
      {showComments && (
        <div className="feed-post-comments">
          {commentsLoading ? (
            <p className="feed-post-comments-loading">Loading comments…</p>
          ) : (
            <ul className="feed-post-comments-list">
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUser={currentUser}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                  onReply={(parentId) => setReplyingTo(parentId)}
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
          <form onSubmit={handleSubmitComment} className="feed-post-comment-form">
            <Avatar user={currentUser} size={36} className="feed-post-comment-form-avatar" />
            <div className="feed-post-comment-form-wrap">
              <input
                type="text"
                className="feed-post-comment-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
              />
              <button type="button" className="feed-post-comment-gif" aria-label="GIF">GIF</button>
            </div>
            <button type="submit" className="feed-post-comment-submit-btn" disabled={!commentText.trim() || commentSubmitting} aria-label="Post comment">
              {commentSubmitting ? '…' : <MessageCircle size={20} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function isVideoMedia(m) {
  if (!m) return false;
  const t = (m.type ?? '').toString().toLowerCase();
  if (t.includes('video')) return true;
  const u = typeof m === 'string' ? m : (m?.url ?? m?.src ?? '');
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u);
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
  const mediaItems = Array.isArray(media)
    ? media
        .map((m) => {
          const url = typeof m === 'string' ? m : m?.url ?? m?.src;
          if (!url) return null;
          return { url, isVideo: isVideoMedia(m) };
        })
        .filter(Boolean)
    : [];
  return {
    id: post.id,
    author: { id: author.id, name, profilePic },
    time: formatPostTime(post.createdAt ?? post.created_at),
    description: post.caption ?? post.content ?? post.description ?? '',
    media: mediaItems,
    hashtags: post.hashtags ?? [],
    liked: !!post.userReaction,
    likesCount: post.reactionsCount ?? post.likesCount ?? post.likes_count ?? post.likeCount ?? 0,
    commentsCount: post.commentsCount ?? post.comments_count ?? post.commentCount ?? 0,
    sharesCount: post.sharesCount ?? post.shares_count ?? 0,
    saved: !!post.saved,
    authorIsFollowed: !!post.authorIsFollowed,
  };
}

function getVideoUrl(post) {
  const m = post?.media?.[0];
  const url = typeof m === 'string' ? m : m?.url;
  return typeof url === 'string' && url.trim() ? url.trim() : null;
}

function isSingleVideoPost(post) {
  return post?.media?.length === 1 && post.media[0]?.isVideo && getVideoUrl(post);
}

export default function Home() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storyGroups, setStoryGroups] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [videoOverlayOpen, setVideoOverlayOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videoPosts = posts.filter(isSingleVideoPost);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const fetchFeed = user?.id ? getFeed : getPublicFeed;
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
          <Link to="/app/friends" className="user-app-composer-btn trade" title="Find people">
            <Users size={24} />
            Find People
          </Link>
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
          <p>No posts yet. Be the first to post!</p>
          <Link to="/app/friends" className="home-discover-link" style={{ marginTop: 12, display: 'inline-block', color: '#7c3aed', fontWeight: 600 }}>
            Find people to follow →
          </Link>
        </div>
      )}
      {user?.id && !loading && posts.length > 0 && (
        <div className="user-app-card home-discover-card" style={{ padding: '12px 16px', marginBottom: 12 }}>
          <Link to="/app/friends" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
            <Users size={20} className="home-discover-icon" style={{ color: '#7c3aed' }} />
            <span style={{ flex: 1, fontSize: 14 }}>Discover people near you</span>
            <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>Find People →</span>
          </Link>
        </div>
      )}
      {!loading && posts.length > 0 && posts.map((p) => {
        const videoIndex = videoPosts.findIndex((v) => v.id === p.id);
        return (
          <FeedPost
            key={p.id ?? p.time + p.description?.slice(0, 20)}
            id={p.id}
            author={p.author}
            time={p.time}
            description={p.description}
            media={p.media}
            hashtags={p.hashtags}
            liked={p.liked}
            likesCount={p.likesCount}
            commentsCount={p.commentsCount}
            sharesCount={p.sharesCount}
            saved={p.saved}
            authorIsFollowed={p.authorIsFollowed}
            videoIndex={videoIndex >= 0 ? videoIndex : undefined}
            onOpenVideo={videoIndex >= 0 ? (idx) => { setCurrentVideoIndex(idx); setVideoOverlayOpen(true); } : undefined}
          />
        );
      })}

      {videoOverlayOpen && videoPosts.length > 0 && (() => {
        const current = videoPosts[currentVideoIndex];
        if (!current) return null;
        const videoUrl = getVideoUrl(current);
        if (!videoUrl) return null;
        const handleOverlayLike = async () => {
          const next = !current.liked;
          setPosts((prev) => prev.map((p) => (p.id === current.id ? { ...p, liked: next, likesCount: next ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) } : p)));
          try {
            if (next) await likePost(current.id);
            else await unlikePost(current.id);
          } catch (_) {}
        };
        const handleOverlaySave = async () => {
          setPosts((prev) => prev.map((p) => (p.id === current.id ? { ...p, saved: !p.saved } : p)));
          try {
            if (current.saved) await unsavePost(current.id);
            else await savePost(current.id);
          } catch (_) {}
        };
        return (
          <VideoFullscreenOverlay
            key={current.id}
            isOpen={videoOverlayOpen}
            onClose={() => setVideoOverlayOpen(false)}
            videoUrl={videoUrl}
            description={current.description}
            author={current.author}
            postId={current.id}
            liked={current.liked}
            likesCount={current.likesCount}
            commentsCount={current.commentsCount}
            saved={current.saved}
            onLike={handleOverlayLike}
            onComment={() => { setVideoOverlayOpen(false); }}
            onShare={() => setVideoOverlayOpen(false)}
            onSave={handleOverlaySave}
            hasNext={currentVideoIndex < videoPosts.length - 1}
            hasPrev={currentVideoIndex > 0}
            onSwipeUp={() => setCurrentVideoIndex((i) => Math.min(i + 1, videoPosts.length - 1))}
            onSwipeDown={() => setCurrentVideoIndex((i) => Math.max(0, i - 1))}
          />
        );
      })()}
    </>
  );
}
