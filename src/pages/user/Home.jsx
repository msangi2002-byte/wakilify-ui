import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Users, Video, MoreHorizontal, Plus, ThumbsUp, Heart, MessageCircle, Share2, Play, Sparkles, Globe, Lock, Film } from 'lucide-react';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { CommentItem } from '@/components/social/CommentItem';
import { VideoFullscreenOverlay } from '@/components/social/VideoFullscreenOverlay';
import { ReelCommentsDrawer, ReelShareMenu } from '@/pages/user/Reels';
import { useAuthStore } from '@/store/auth.store';
import { getFeed, getPublicFeed, getStories, likePost, reactToPost, unlikePost, savePost, unsavePost, sharePostToStory, getComments, addComment, deleteComment, createPost, likeComment, unlikeComment } from '@/lib/api/posts';
import { followUser, unfollowUser } from '@/lib/api/friends';
import { blockUser } from '@/lib/api/users';
import { createReport } from '@/lib/api/reports';
import { parseApiDate, formatPostTime, formatCommentTime } from '@/lib/utils/dateUtils';
import { ROLES } from '@/types/roles';

/** Reaction types for posts (must match backend ReactionType). Label + icon/emoji for picker. */
const REACTIONS = [
  { type: 'LIKE', label: 'Like', Icon: ThumbsUp },
  { type: 'LOVE', label: 'Love', Icon: Heart },
  { type: 'HAHA', label: 'Haha', emoji: '😂' },
  { type: 'WOW', label: 'Wow', emoji: '😮' },
  { type: 'SAD', label: 'Sad', emoji: '😢' },
  { type: 'ANGRY', label: 'Angry', emoji: '😠' },
];

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

function FeedPost({ id, author, time, description, media = [], hashtags = [], visibility, location, feelingActivity, taggedUsers = [], topReactors = [], liked: initialLiked = false, userReaction: initialUserReaction = null, likesCount: initialLikesCount = 0, commentsCount: initialCommentsCount = 0, sharesCount = 0, saved: initialSaved = false, authorIsFollowed: initialAuthorIsFollowed = false, onFollowChange, onSaveChange, videoIndex, onOpenVideo }) {
  const { user: currentUser } = useAuthStore();
  const isSelf = currentUser?.id && author?.id && currentUser.id === author.id;
  const resolvedInitialReaction = initialUserReaction || (initialLiked ? 'LIKE' : null);
  const [userReaction, setUserReaction] = useState(resolvedInitialReaction);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const reactionPickerRef = useRef(null);
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

  const handleReact = async (type) => {
    if (!id || reactionLoading) return;
    const isRemoving = userReaction === type;
    const nextReaction = isRemoving ? null : type;
    const countDelta = isRemoving ? -1 : (userReaction ? 0 : 1);
    setUserReaction(nextReaction);
    setLikesCount((c) => Math.max(0, c + countDelta));
    setReactionPickerOpen(false);
    setReactionLoading(true);
    try {
      if (isRemoving) {
        const res = await unlikePost(id);
        if (res?.reactionsCount != null) setLikesCount(res.reactionsCount);
      } else {
        const res = await reactToPost(id, type);
        if (res?.reactionsCount != null) setLikesCount(res.reactionsCount);
      }
    } catch {
      setUserReaction(userReaction);
      setLikesCount((c) => Math.max(0, c - countDelta));
    } finally {
      setReactionLoading(false);
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

  const handleEmojiClick = async (emoji) => {
    if (!id || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(id, emoji);
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
          {visibility && (
            <span className="feed-post-visibility" title={visibility === 'PUBLIC' ? 'Public' : visibility === 'FRIENDS' ? 'Friends' : visibility} aria-hidden>
              {visibility === 'PUBLIC' ? <Globe size={12} /> : visibility === 'FRIENDS' ? <Lock size={12} /> : <Globe size={12} />}
            </span>
          )}
          {(location || feelingActivity) && (
            <span className="feed-post-meta-extra">
              {location && <span className="feed-post-location">{location}</span>}
              {location && feelingActivity && ' · '}
              {feelingActivity && <span className="feed-post-feeling">{feelingActivity}</span>}
            </span>
          )}
          {Array.isArray(taggedUsers) && taggedUsers.length > 0 && (
            <span className="feed-post-tagged">
              {' with '}
              {taggedUsers.slice(0, 2).map((u) => u?.name).filter(Boolean).join(', ')}
              {taggedUsers.length > 2 && ` and ${taggedUsers.length - 2} others`}
            </span>
          )}
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
              <button
                type="button"
                className="feed-post-option-item"
                onClick={() => { handleSaveClick(); setOptionsOpen(false); }}
                disabled={saveLoading}
              >
                {saved ? 'Unsave post' : 'Save post'}
              </button>
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
          liked={!!userReaction}
          likesCount={likesCount}
          commentsCount={commentsCount}
          saved={saved}
          onLike={() => handleReact('LIKE')}
          onComment={() => { setVideoFullscreenOpen(false); handleCommentClick(); }}
          onShare={() => { setVideoFullscreenOpen(false); setShareOpen(true); }}
          onSave={handleSaveClick}
        />
      )}
      <div className="feed-post-engagement">
        <div className="feed-post-counts">
          {likesCount > 0 && (
            <span className="feed-post-likes-count">
              {(() => {
                const r = REACTIONS.find((x) => x.type === userReaction);
                if (r?.Icon) return <r.Icon size={16} fill="currentColor" />;
                if (r?.emoji) return <span className="feed-post-reaction-emoji" aria-hidden>{r.emoji}</span>;
                return <ThumbsUp size={16} fill="currentColor" />;
              })()}
              {Array.isArray(topReactors) && topReactors.length > 0
                ? (() => {
                    const names = topReactors.slice(0, 2).map((u) => u?.name).filter(Boolean);
                    const rest = likesCount - names.length;
                    if (names.length === 1 && rest > 0) return `${names[0]} and ${rest} other${rest === 1 ? '' : 's'}`;
                    if (names.length === 2 && rest > 0) return `${names[0]} and ${names[1]} and ${rest} others`;
                    if (names.length === 2) return `${names[0]} and ${names[1]}`;
                    return names[0] || likesCount;
                  })()
                : (likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount)}
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
          <div className="feed-post-reaction-wrap" ref={reactionPickerRef}>
            {reactionPickerOpen && (
              <div className="feed-post-reaction-picker" role="toolbar">
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    type="button"
                    className="feed-post-reaction-picker-btn"
                    title={r.label}
                    onClick={() => handleReact(r.type)}
                    disabled={reactionLoading}
                  >
                    {r.Icon ? <r.Icon size={22} /> : <span className="feed-post-reaction-emoji">{r.emoji}</span>}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className={`feed-post-action ${userReaction ? 'active' : ''}`}
              onClick={() => (userReaction ? handleReact(userReaction) : handleReact('LIKE'))}
              onMouseEnter={() => setReactionPickerOpen(true)}
              onMouseLeave={() => setReactionPickerOpen(false)}
              disabled={reactionLoading}
              aria-expanded={reactionPickerOpen}
              aria-haspopup="true"
            >
              {(() => {
                const r = REACTIONS.find((x) => x.type === userReaction);
                if (r?.Icon) return <r.Icon size={18} />;
                if (r?.emoji) return <span className="feed-post-reaction-emoji" aria-hidden>{r.emoji}</span>;
                return <ThumbsUp size={18} />;
              })()}
              {REACTIONS.find((x) => x.type === userReaction)?.label ?? 'Like'}
            </button>
          </div>
          <button
            type="button"
            className={`feed-post-action ${showComments ? 'active' : ''}`}
            onClick={handleCommentClick}
          >
            <MessageCircle size={18} />
            Comment
          </button>
          <div className="feed-post-share-wrap">
            <button
              type="button"
              className="feed-post-action"
              onClick={() => setShareOpen((o) => !o)}
              disabled={shareLoading}
            >
              <Share2 size={18} />
              Share
            </button>
            {shareOpen && (
              <div className="feed-post-share-menu">
                <button type="button" onClick={handleRepost}>Repost to feed</button>
                <button type="button" onClick={handleShareToStory}>Share to story</button>
              </div>
            )}
          </div>
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
          <div className="feed-post-comment-emoji-bar">
            <button type="button" className="feed-post-comment-emoji" aria-label="Heart" onClick={() => handleEmojiClick('❤️')}>❤️</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Clap" onClick={() => handleEmojiClick('🙌')}>🙌</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Fire" onClick={() => handleEmojiClick('🔥')}>🔥</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Sad" onClick={() => handleEmojiClick('😢')}>😢</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Love" onClick={() => handleEmojiClick('🥰')}>🥰</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Surprise" onClick={() => handleEmojiClick('😮')}>😮</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Laugh" onClick={() => handleEmojiClick('😂')}>😂</button>
          </div>
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
  const userReaction = post.userReaction ? String(post.userReaction).toUpperCase() : null;
  const tagged = post.taggedUsers ?? [];
  const taggedUsers = Array.isArray(tagged) ? tagged.map((u) => (typeof u === 'object' && u !== null ? { id: u.id, name: u.name ?? u.username, profilePic: u.profilePic } : null)).filter(Boolean) : [];
  const topR = post.topReactors ?? [];
  const topReactors = Array.isArray(topR) ? topR.map((u) => (typeof u === 'object' && u !== null ? { id: u.id, name: u.name ?? u.username, profilePic: u.profilePic } : null)).filter(Boolean) : [];
  return {
    id: post.id,
    author: { id: author.id, name, profilePic },
    time: formatPostTime(post.createdAt ?? post.created_at),
    description: post.caption ?? post.content ?? post.description ?? '',
    media: mediaItems,
    hashtags: post.hashtags ?? [],
    visibility: post.visibility ? String(post.visibility).toUpperCase() : null,
    location: post.location ? String(post.location).trim() : null,
    feelingActivity: post.feelingActivity ? String(post.feelingActivity).trim() : null,
    taggedUsers,
    topReactors,
    liked: !!userReaction,
    userReaction: userReaction && /^(LIKE|LOVE|HAHA|WOW|SAD|ANGRY)$/.test(userReaction) ? userReaction : null,
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
  const [videoCommentsPostId, setVideoCommentsPostId] = useState(null);
  const [videoSharePost, setVideoSharePost] = useState(null);

  const videoPosts = posts.filter(isSingleVideoPost);

  useEffect(() => {
    if (!videoOverlayOpen) {
      setVideoCommentsPostId(null);
      setVideoSharePost(null);
    }
  }, [videoOverlayOpen]);

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

  /* Facebook-style order: Composer first, then Stories, then Feed */
  return (
    <>
      {/* 1. What's on your mind? (Composer) - mobile style: avatar | input | icons in one row */}
      <div className="user-app-card user-app-composer-row">
        <Link to="/app/create" className="user-app-composer">
          <Avatar user={user} size={40} className="user-app-composer-avatar" />
          <span className="user-app-composer-input user-app-composer-placeholder">
            What&apos;s on your mind?
          </span>
        </Link>
        <div className="user-app-composer-actions-inline">
          <Link to="/app/create" className="user-app-composer-icon video" title="Live / Video" aria-label="Video">
            <Video size={22} />
          </Link>
          <Link to="/app/create" className="user-app-composer-icon post" title="Photo" aria-label="Photo">
            <ImagePlus size={22} />
          </Link>
          <Link to="/app/create" className="user-app-composer-icon reel" title="Reel" aria-label="Reel">
            <Film size={22} />
          </Link>
          <button type="button" className="user-app-composer-icon more" aria-label="More options">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* 2. Stories carousel - below composer like Facebook */}
      <div className="user-app-card">
        <div className="user-app-stories-header">
          <h3>Stories</h3>
          <Link to="/app/stories">See All</Link>
        </div>
        <div className="user-app-stories-row">
          <Link to="/app/stories/create" className="user-app-story-card create">
            <div
              className="story-create-bg"
              style={user?.profilePic ? { backgroundImage: `url(${user.profilePic})` } : undefined}
            />
            <span className="story-create-plus">
              <Plus size={24} strokeWidth={3} />
            </span>
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
                  <Avatar user={group.author} size={36} className="story-avatar" />
                </div>
                <span className="story-name">{group.author?.name ?? 'User'}</span>
              </Link>
            );
          })}
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
      {/* Discover card: once above feed when there are posts (no duplicate in empty state) */}
      {user?.id && !loading && posts.length > 0 && (
        <div className="user-app-card home-discover-card" style={{ padding: '12px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/app/friends" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
            <Users size={20} className="home-discover-icon" style={{ color: '#7c3aed' }} />
            <span style={{ flex: 1, fontSize: 14 }}>Discover people near you</span>
            <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>Find People →</span>
          </Link>
          {String(user?.role ?? '').toLowerCase() !== ROLES.AGENT && (
            <Link to="/app/register-agent" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit', paddingTop: 8, borderTop: '1px solid #e4e6eb' }}>
              <Sparkles size={20} style={{ color: '#7c3aed' }} />
              <span style={{ flex: 1, fontSize: 14 }}>Become an agent</span>
              <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>Register →</span>
            </Link>
          )}
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
            visibility={p.visibility ?? null}
            location={p.location ?? null}
            feelingActivity={p.feelingActivity ?? null}
            taggedUsers={p.taggedUsers ?? []}
            topReactors={p.topReactors ?? []}
            liked={p.liked}
            userReaction={p.userReaction ?? null}
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
          const nextReaction = current.userReaction === 'LIKE' ? null : 'LIKE';
          const countDelta = nextReaction ? (current.userReaction ? 0 : 1) : -1;
          setPosts((prev) => prev.map((p) => (p.id === current.id ? { ...p, userReaction: nextReaction, liked: !!nextReaction, likesCount: Math.max(0, p.likesCount + countDelta) } : p)));
          try {
            if (nextReaction) await reactToPost(current.id, 'LIKE');
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
        const handleOverlayCommentCount = (postId, newCount) => {
          setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentsCount: newCount } : p)));
        };
        return (
          <>
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
              onComment={() => setVideoCommentsPostId(current.id)}
              onShare={() => setVideoSharePost(current)}
              onSave={handleOverlaySave}
              hasNext={currentVideoIndex < videoPosts.length - 1}
              hasPrev={currentVideoIndex > 0}
              onSwipeUp={() => setCurrentVideoIndex((i) => Math.min(i + 1, videoPosts.length - 1))}
              onSwipeDown={() => setCurrentVideoIndex((i) => Math.max(0, i - 1))}
            />
            {videoCommentsPostId && (
              <ReelCommentsDrawer
                postId={videoCommentsPostId}
                onClose={() => setVideoCommentsPostId(null)}
                onCommentCountChange={handleOverlayCommentCount}
              />
            )}
            {videoSharePost && (
              <ReelShareMenu
                item={videoSharePost}
                onClose={() => setVideoSharePost(null)}
              />
            )}
          </>
        );
      })()}
    </>
  );
}
