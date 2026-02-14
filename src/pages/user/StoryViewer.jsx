import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Eye, Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { getStories, recordStoryView, getStoryViewers, getPostById, likePost, unlikePost, getComments, addComment } from '@/lib/api/posts';
import { useAuthStore } from '@/store/auth.store';
import { parseApiDate, formatPostTime } from '@/lib/utils/dateUtils';
import '@/styles/user-app.css';

const STORY_DURATION_MS = 5000;

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

/**
 * Group flat list of story posts by author id.
 * Returns [{ authorId, author: { id, name, profilePic }, stories: [ ... ] }]
 * Sorted: current user first, then by latest story time.
 */
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

function getMediaUrl(story) {
  const media = story.media;
  if (!Array.isArray(media) || media.length === 0) return null;
  const first = media[0];
  return typeof first === 'string' ? first : first?.url ?? null;
}

function getMediaType(story) {
  const media = story.media;
  if (!Array.isArray(media) || media.length === 0) return 'image';
  const first = media[0];
  if (typeof first === 'string') return 'image';
  const t = (first?.type ?? '').toLowerCase();
  return t.includes('video') ? 'video' : 'image';
}

export default function StoryViewer() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewersCount, setViewersCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const viewedStoryIdsRef = useRef(new Set());
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const videoRef = useRef(null);
  const [videoMuted, setVideoMuted] = useState(false);
  const stallTimeoutRef = useRef(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getStories();
      const grouped = groupStoriesByAuthor(list, currentUser?.id ?? null);
      setGroups(grouped);
      if (userId && grouped.length > 0) {
        const idx = grouped.findIndex((g) => g.authorId === userId || g.author?.id === userId);
        setCurrentGroupIndex(idx >= 0 ? idx : 0);
        setCurrentStoryIndex(0);
      } else {
        setCurrentGroupIndex(0);
        setCurrentStoryIndex(0);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.id]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const currentGroup = groups[currentGroupIndex] ?? null;
  const currentStories = currentGroup?.stories ?? [];
  const currentStory = currentStories[currentStoryIndex] ?? null;
  const mediaUrl = currentStory ? getMediaUrl(currentStory) : null;
  const isVideo = currentStory ? getMediaType(currentStory) === 'video' : false;
  const isTextOnly = currentStory && !mediaUrl && (currentStory.caption ?? '').trim().length > 0;
  const isMyStory = currentUser?.id && currentGroup?.authorId === currentUser.id;

  // Fetch post details (likes, comments, viewers count) when story changes
  useEffect(() => {
    if (!currentStory?.id) {
      setLiked(false);
      setLikesCount(0);
      setCommentsCount(0);
      setViewersCount(0);
      setComments([]);
      return;
    }

    // Record view
    if (!viewedStoryIdsRef.current.has(currentStory.id)) {
      viewedStoryIdsRef.current.add(currentStory.id);
      recordStoryView(currentStory.id).catch(() => {});
    }

    // Fetch post details
    const fetchPostDetails = async () => {
      try {
        const post = await getPostById(currentStory.id);
        setLiked(post?.liked ?? false);
        setLikesCount(post?.reactionsCount ?? post?.likesCount ?? 0);
        setCommentsCount(post?.commentsCount ?? 0);
      } catch {
        // Use story data if available
        setLiked(currentStory?.liked ?? false);
        setLikesCount(currentStory?.reactionsCount ?? currentStory?.likesCount ?? 0);
        setCommentsCount(currentStory?.commentsCount ?? 0);
      }
    };

    // Fetch viewers count
    const fetchViewersCount = async () => {
      try {
        const list = await getStoryViewers(currentStory.id, { page: 0, size: 50 });
        // Check if it's a paginated response with totalElements
        if (list && typeof list === 'object' && !Array.isArray(list)) {
          const total = list.totalElements ?? list.total ?? (list.content?.length ?? 0);
          setViewersCount(total);
        } else {
          // It's an array, use length
          setViewersCount(Array.isArray(list) ? list.length : 0);
        }
      } catch {
        setViewersCount(0);
      }
    };

    fetchPostDetails();
    fetchViewersCount();
  }, [currentStory?.id]);

  const openViewers = useCallback(async () => {
    if (!currentStory?.id) return;
    setViewersOpen(true);
    setViewersLoading(true);
    try {
      const list = await getStoryViewers(currentStory.id, { page: 0, size: 50 });
      const viewersList = Array.isArray(list) ? list : list?.content ?? [];
      setViewers(viewersList);
      // Update count if we got pagination info
      if (list && typeof list === 'object' && !Array.isArray(list)) {
        const total = list.totalElements ?? list.total ?? viewersList.length;
        setViewersCount(total);
      }
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  }, [currentStory?.id]);

  const handleLikeClick = useCallback(async (e) => {
    e.stopPropagation();
    if (!currentStory?.id || likeLoading) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    setLikeLoading(true);
    try {
      if (next) {
        await likePost(currentStory.id);
      } else {
        await unlikePost(currentStory.id);
      }
    } catch {
      setLiked(!next);
      setLikesCount((c) => (next ? c - 1 : c + 1));
    } finally {
      setLikeLoading(false);
    }
  }, [currentStory?.id, liked, likeLoading]);

  const loadComments = useCallback(async () => {
    if (!currentStory?.id) return;
    setCommentsLoading(true);
    try {
      const list = await getComments(currentStory.id, { page: 0, size: 50 });
      setComments(Array.isArray(list) ? list : list?.content ?? []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [currentStory?.id]);

  const handleCommentClick = useCallback((e) => {
    e.stopPropagation();
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments.length === 0) loadComments();
  }, [commentsOpen, comments.length, loadComments]);

  const handleSubmitComment = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const content = commentText.trim();
    if (!currentStory?.id || !content || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(currentStory.id, content);
      setCommentText('');
      setCommentsCount((c) => c + 1);
      await loadComments();
    } finally {
      setCommentSubmitting(false);
    }
  }, [currentStory?.id, commentText, commentSubmitting, loadComments]);

  const goNext = useCallback(() => {
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex((i) => i + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex((i) => i + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      navigate(-1);
    }
  }, [currentStoryIndex, currentStories.length, currentGroupIndex, groups.length, navigate]);

  const goPrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => i - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else if (currentGroupIndex > 0) {
      const prevGroup = groups[currentGroupIndex - 1];
      const prevLen = prevGroup?.stories?.length ?? 0;
      setCurrentGroupIndex((i) => i - 1);
      setCurrentStoryIndex(Math.max(0, prevLen - 1));
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      navigate(-1);
    }
  }, [currentStoryIndex, currentGroupIndex, groups, navigate]);

  // Reset mute when switching to a new story so we try sound again
  useEffect(() => {
    if (isVideo && mediaUrl) setVideoMuted(false);
  }, [mediaUrl, isVideo]);

  // Ensure story video plays with sound when possible; avoid stuck playback
  useEffect(() => {
    if (!isVideo || !mediaUrl) return;
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = (muted = videoMuted) => {
      video.muted = muted;
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => {
          if (!muted) {
            setVideoMuted(true);
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      }
    };

    const onCanPlay = () => tryPlay();
    const onError = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      goNext();
    };
    const onStalled = () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = setTimeout(() => {
        const v = videoRef.current;
        if (v && v.readyState < 2) {
          v.load();
          v.play().catch(() => goNext());
        }
        stallTimeoutRef.current = null;
      }, 2500);
    };

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    video.addEventListener('stalled', onStalled);
    tryPlay(false);
    return () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      video.removeEventListener('stalled', onStalled);
    };
  }, [isVideo, mediaUrl, currentStoryIndex, currentGroupIndex, goNext, videoMuted]);

  useEffect(() => {
    if (!currentStory || paused) return;
    const duration = isVideo ? STORY_DURATION_MS * 2 : STORY_DURATION_MS;
    const start = startTimeRef.current ?? Date.now();
    startTimeRef.current = start;

    const tick = () => {
      if (paused) return;
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) goNext();
    };
    timerRef.current = setInterval(tick, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStory, currentStoryIndex, currentGroupIndex, mediaUrl, isVideo, paused, goNext]);

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x > width / 2) goNext();
    else goPrev();
  };

  if (loading) {
    return (
      <div className="story-viewer story-viewer-loading">
        <div className="story-viewer-loading-spinner" />
        <p>Loading stories…</p>
      </div>
    );
  }

  if (error || groups.length === 0) {
    return (
      <div className="story-viewer story-viewer-empty">
        <button type="button" className="story-viewer-close" onClick={() => navigate(-1)} aria-label="Close">
          <X size={28} />
        </button>
        <p>{error || 'No stories right now.'}</p>
        <button type="button" className="story-viewer-back-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="story-viewer" onClick={handleTap}>
      <button
        type="button"
        className="story-viewer-close"
        onClick={(e) => { e.stopPropagation(); navigate(-1); }}
        aria-label="Close"
      >
        <X size={28} />
      </button>

      <div className="story-viewer-progress-row">
        {currentStories.map((_, i) => (
          <div key={i} className="story-viewer-progress-track">
            <div
              className="story-viewer-progress-fill"
              style={{
                width: i < currentStoryIndex ? '100%' : i === currentStoryIndex ? `${progress * 100}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      <div className="story-viewer-header">
        <UserProfileMenu user={currentGroup.author} avatarSize={40} className="story-viewer-author" />
        <div className="story-viewer-meta">
          <span className="story-viewer-time">{formatPostTime(currentStory?.createdAt)}</span>
        </div>
        {currentStory?.id && (
          <div className="story-viewer-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {viewersCount > 0 && (
              <button
                type="button"
                className="story-viewer-action-btn"
                onClick={(e) => { e.stopPropagation(); openViewers(); }}
                aria-label="Viewers"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Eye size={16} />
                {viewersCount}
              </button>
            )}
            {isMyStory && (
              <button
                type="button"
                className="story-viewer-action-btn"
                onClick={(e) => { e.stopPropagation(); openViewers(); }}
                aria-label="Viewers"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Eye size={16} />
                Viewers
              </button>
            )}
          </div>
        )}
      </div>

      {viewersOpen && (
        <div className="story-viewer-modal-overlay" onClick={() => setViewersOpen(false)} role="dialog" aria-label="Story viewers">
          <div className="story-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-modal-header">
              <h3>Watu walioona story / Viewers</h3>
              <button type="button" className="story-viewer-modal-close" onClick={() => setViewersOpen(false)} aria-label="Close">
                <X size={24} />
              </button>
            </div>
            <div className="story-viewer-modal-body">
              {viewersLoading ? (
                <p>Loading…</p>
              ) : viewers.length === 0 ? (
                <p>Hakuna mtu ameona bado.</p>
              ) : (
                <ul className="story-viewer-viewers-list">
                  {viewers.map((v) => (
                    <li key={v.id} className="story-viewer-viewer-item">
                      <UserProfileMenu user={v} avatarSize={40} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="story-viewer-media-wrap">
        {mediaUrl && (
          isVideo ? (
            <video
              key={mediaUrl}
              ref={videoRef}
              src={mediaUrl}
              autoPlay
              playsInline
              muted={videoMuted}
              loop={false}
              onEnded={goNext}
              preload="auto"
              className="story-viewer-media"
            />
          ) : (
            <img key={mediaUrl} src={mediaUrl} alt="" className="story-viewer-media" />
          )
        )}
        {isTextOnly && (
          <div className="story-viewer-text-story" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #4c1d95 100%)' }}>
            <p className="story-viewer-text-story-content">{currentStory.caption}</p>
          </div>
        )}
      </div>

      {currentStory?.caption && mediaUrl && (
        <div className="story-viewer-caption">{currentStory.caption}</div>
      )}

      {/* Like, Comment, Viewers buttons - Right side like Facebook */}
      {currentStory?.id && (
        <div
          className="story-viewer-interactions"
          style={{
            position: 'absolute',
            right: '20px',
            bottom: '100px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like button with count */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={handleLikeClick}
              disabled={likeLoading}
              style={{
                background: liked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                color: '#fff',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: likeLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!likeLoading) e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              {likeLoading ? (
                <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Heart size={20} fill={liked ? '#fff' : 'transparent'} />
              )}
            </button>
            {likesCount > 0 && (
              <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                {likesCount}
              </div>
            )}
          </div>

          {/* Comment button with count */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={handleCommentClick}
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                color: '#fff',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label="Comments"
            >
              <MessageCircle size={20} />
            </button>
            {commentsCount > 0 && (
              <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                {commentsCount}
              </div>
            )}
          </div>

          {/* Viewers button with count */}
          {viewersCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openViewers(); }}
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: 'none',
                  color: '#fff',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                aria-label="Viewers"
              >
                <Eye size={20} />
              </button>
              <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                {viewersCount}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comments Drawer - Slides up from bottom like Reels */}
      {commentsOpen && (
        <div
          className="reels-comments-overlay"
          onClick={(e) => { e.stopPropagation(); setCommentsOpen(false); }}
          role="presentation"
        >
          <div
            className="reels-comments-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reels-comments-header">
              <h3 className="reels-comments-title">Comments {commentsCount > 0 && `(${commentsCount})`}</h3>
              <button
                type="button"
                className="reels-comments-close"
                onClick={(e) => { e.stopPropagation(); setCommentsOpen(false); }}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            <ul className="reels-comments-list">
              {commentsLoading ? (
                <li className="reels-comments-loading">Loading comments…</li>
              ) : comments.length === 0 ? (
                <li className="reels-comments-empty">No comments yet.</li>
              ) : (
                comments.map((comment) => (
                  <li
                    key={comment.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      padding: '12px 0',
                    }}
                  >
                    <UserProfileMenu user={comment.author} avatarSize={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#050505' }}>
                          {comment.author?.name ?? comment.author?.username ?? 'User'}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: '#65676b' }}>
                          {formatPostTime(comment.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9375rem', color: '#050505', lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {comment.content}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <form onSubmit={handleSubmitComment} className="reels-comments-input-wrap">
              <input
                type="text"
                className="reels-comments-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={2000}
                disabled={commentSubmitting}
                onFocus={(e) => e.stopPropagation()}
              />
              <button
                type="submit"
                className="reels-comments-submit"
                disabled={!commentText.trim() || commentSubmitting}
              >
                {commentSubmitting ? (
                  <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  'Post'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="story-viewer-tap-zones">
        <button type="button" className="story-viewer-tap-left" aria-label="Previous" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
        <button type="button" className="story-viewer-tap-right" aria-label="Next" onClick={(e) => { e.stopPropagation(); goNext(); }} />
      </div>
    </div>
  );
}
