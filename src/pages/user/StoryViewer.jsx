import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Eye, Heart, MessageCircle, Send, Loader2, Volume2, VolumeX, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import {
  getStories,
  recordStoryView,
  getStoryViewers,
  getPostById,
  reactToPost,
  unlikePost,
  getComments,
  addComment,
  getPostInsights,
} from '@/lib/api/posts';
import { sendMessage } from '@/lib/api/messages';
import { trackPromotionClick } from '@/lib/api/promotions';
import { useAuthStore } from '@/store/auth.store';
import { parseApiDate, formatPostTime } from '@/lib/utils/dateUtils';
import { normalizeCtaLink, isInternalCtaLink } from '@/lib/utils/urlUtils';
import MentionInput, { getSubmitContent, MentionContent } from '@/components/ui/MentionInput';
import '@/styles/user-app.css';

const STORY_DURATION_MS = 5000;

// Facebook-style reaction types with emoji
const REACTIONS = [
  { type: 'LIKE', emoji: '👍', label: 'Like' },
  { type: 'LOVE', emoji: '❤️', label: 'Love' },
  { type: 'HAHA', emoji: '😂', label: 'Haha' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Sad' },
  { type: 'ANGRY', emoji: '😠', label: 'Angry' },
];

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
  const [userReaction, setUserReaction] = useState(null); // 'LIKE' | 'LOVE' | etc or null
  const [reactionsCount, setReactionsCount] = useState(0);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [emojiOverlay, setEmojiOverlay] = useState(null); // { emoji, type } for animate-on-react
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const commentMentionOrderRef = useRef([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState('');
  const [quickReplySending, setQuickReplySending] = useState(false);
  const [quickReplyFocused, setQuickReplyFocused] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [storyDurationMs, setStoryDurationMs] = useState(STORY_DURATION_MS);
  const viewedStoryIdsRef = useRef(new Set());
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const videoRef = useRef(null);
  const stallTimeoutRef = useRef(null);
  const holdTimerRef = useRef(null);
  const reactionPickerTimeoutRef = useRef(null);

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
  const author = currentGroup?.author ?? null;

  useEffect(() => {
    if (!currentStory?.id) {
      setUserReaction(null);
      setReactionsCount(0);
      setCommentsCount(0);
      setViewersCount(0);
      setComments([]);
      setCommentsOpen(false);
      setQuickReplyText('');
      return;
    }

    setComments([]);
    setCommentsOpen(false);

    if (!viewedStoryIdsRef.current.has(currentStory.id)) {
      viewedStoryIdsRef.current.add(currentStory.id);
      recordStoryView(currentStory.id).catch(() => {});
    }

    const fetchPostDetails = async () => {
      try {
        const post = await getPostById(currentStory.id);
        setUserReaction(post?.userReaction ?? null);
        setReactionsCount(post?.reactionsCount ?? post?.likesCount ?? 0);
        setCommentsCount(post?.commentsCount ?? 0);
      } catch {
        setUserReaction(currentStory?.userReaction ?? null);
        setReactionsCount(currentStory?.reactionsCount ?? currentStory?.likesCount ?? 0);
        setCommentsCount(currentStory?.commentsCount ?? 0);
      }
    };

    const fetchViewersCount = async () => {
      try {
        const list = await getStoryViewers(currentStory.id, { page: 0, size: 50 });
        if (list && typeof list === 'object' && !Array.isArray(list)) {
          setViewersCount(list.totalElements ?? list.total ?? (list.content?.length ?? 0));
        } else {
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
      if (list && typeof list === 'object' && !Array.isArray(list)) {
        setViewersCount(list.totalElements ?? list.total ?? viewersList.length);
      }
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  }, [currentStory?.id]);

  const openInsights = useCallback(async () => {
    if (!currentStory?.id) return;
    setInsightsOpen(true);
    setInsightsLoading(true);
    try {
      const data = await getPostInsights(currentStory.id);
      setInsights(data);
    } catch {
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }, [currentStory?.id]);

  const handleReact = useCallback(
    async (type) => {
      if (!currentStory?.id || reactionLoading) return;
      const r = REACTIONS.find((x) => x.type === type);
      if (!r) return;
      const prev = userReaction;
      setUserReaction(type);
      setReactionsCount((c) => (prev ? c : c + 1));
      setReactionPickerOpen(false);
      setEmojiOverlay({ emoji: r.emoji, type });
      setTimeout(() => setEmojiOverlay(null), 1800);
      setReactionLoading(true);
      try {
        await reactToPost(currentStory.id, type);
      } catch {
        setUserReaction(prev);
        setReactionsCount((c) => (prev ? c : Math.max(0, c - 1)));
      } finally {
        setReactionLoading(false);
      }
    },
    [currentStory?.id, userReaction, reactionLoading]
  );

  const handleRemoveReaction = useCallback(async () => {
    if (!currentStory?.id || reactionLoading) return;
    const prev = userReaction;
    setUserReaction(null);
    setReactionsCount((c) => Math.max(0, c - 1));
    setReactionPickerOpen(false);
    setReactionLoading(true);
    try {
      await unlikePost(currentStory.id);
    } catch {
      setUserReaction(prev);
      setReactionsCount((c) => c + 1);
    } finally {
      setReactionLoading(false);
    }
  }, [currentStory?.id, userReaction, reactionLoading]);

  const handleReactionBtnPointerDown = useCallback(() => {
    holdTimerRef.current = setTimeout(() => {
      setReactionPickerOpen(true);
    }, 400);
  }, []);

  const handleReactionBtnPointerUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (reactionPickerTimeoutRef.current) {
      clearTimeout(reactionPickerTimeoutRef.current);
      reactionPickerTimeoutRef.current = null;
    }
  }, []);

  const handleReactionBtnClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (reactionPickerOpen) return;
      if (userReaction) {
        handleRemoveReaction();
      } else {
        handleReact('LIKE');
      }
    },
    [reactionPickerOpen, userReaction, handleReact, handleRemoveReaction]
  );

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

  const handleCommentClick = useCallback(
    (e) => {
      e.stopPropagation();
      const next = !commentsOpen;
      setCommentsOpen(next);
      if (next && comments.length === 0) loadComments();
    },
    [commentsOpen, comments.length, loadComments]
  );

  const handleSubmitComment = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const trimmed = commentText.trim();
      if (!currentStory?.id || !trimmed || commentSubmitting) return;
      const { content, taggedUserIds } = getSubmitContent(trimmed, commentMentionOrderRef.current || []);
      setCommentSubmitting(true);
      try {
        await addComment(currentStory.id, content, null, taggedUserIds?.length ? taggedUserIds : null);
        setCommentText('');
        setCommentsCount((c) => c + 1);
        await loadComments();
      } finally {
        setCommentSubmitting(false);
      }
    },
    [currentStory?.id, commentText, commentSubmitting, loadComments]
  );

  const handleQuickReplySubmit = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = quickReplyText.trim();
      if (!author?.id || !text || quickReplySending || isMyStory) return;
      setQuickReplySending(true);
      try {
        await sendMessage(author.id, text);
        navigate('/app/messages', { state: { openUser: author } });
      } catch {
        // Fallback: just navigate with openUser
        navigate('/app/messages', { state: { openUser: author } });
      } finally {
        setQuickReplySending(false);
      }
    },
    [author, quickReplyText, quickReplySending, isMyStory, navigate]
  );

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

  useEffect(() => {
    if (isVideo && mediaUrl) setVideoMuted(false);
  }, [mediaUrl, isVideo]);

  const isPaused = paused || commentsOpen || viewersOpen || insightsOpen || quickReplyFocused;

  // Set duration: image/text use fixed; video will be updated when metadata loads
  useEffect(() => {
    if (!currentStory) return;
    if (!isVideo) {
      setStoryDurationMs(STORY_DURATION_MS);
    } else {
      setStoryDurationMs(STORY_DURATION_MS * 2); // fallback until video loadedmetadata
    }
  }, [currentStory, currentStoryIndex, currentGroupIndex, isVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPaused, isVideo]);

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

    const onLoadedMetadata = () => {
      if (video.duration != null && isFinite(video.duration) && video.duration > 0) {
        const ms = Math.round(video.duration * 1000);
        setStoryDurationMs(Math.max(1000, Math.min(60000, ms)));
      }
    };
    const onTimeUpdate = () => {
      const dur = video.duration;
      if (dur != null && isFinite(dur) && dur > 0) {
        const p = Math.min(1, video.currentTime / dur);
        setProgress(p);
      }
    };
    const onEnded = () => {
      goNext();
    };
    const onCanPlay = () => {
      if (!isPaused) tryPlay();
    };
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

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    video.addEventListener('stalled', onStalled);
    if (!isPaused) tryPlay(false);
    if (video.duration != null && isFinite(video.duration) && video.duration > 0) {
      onLoadedMetadata();
    }
    onTimeUpdate();
    return () => {
      if (stallTimeoutRef.current) clearTimeout(stallTimeoutRef.current);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      video.removeEventListener('stalled', onStalled);
    };
  }, [isVideo, mediaUrl, currentStoryIndex, currentGroupIndex, goNext, videoMuted, isPaused]);

  // Timer only for image/text stories; video progress is driven by video timeupdate/ended
  useEffect(() => {
    if (!currentStory || isPaused || isVideo) return;
    const duration = storyDurationMs;
    const start = startTimeRef.current ?? Date.now();
    startTimeRef.current = start;

    const tick = () => {
      if (isPaused || isVideo) return;
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) goNext();
    };
    timerRef.current = setInterval(tick, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStory, currentStoryIndex, currentGroupIndex, mediaUrl, isVideo, isPaused, goNext, storyDurationMs]);

  const handleTap = (e) => {
    setReactionPickerOpen(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    if (x > width / 2) goNext();
    else goPrev();
  };

  const handlePointerDown = () => setPaused(true);
  const handlePointerUp = () => setPaused(false);

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

  const currentReactionEmoji = userReaction ? REACTIONS.find((r) => r.type === userReaction)?.emoji : null;

  return (
    <div
      className="story-viewer story-viewer-fb"
      onClick={handleTap}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <button
        type="button"
        className="story-viewer-close"
        onClick={(e) => {
          e.stopPropagation();
          navigate(-1);
        }}
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Progress bars - Facebook style */}
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

      {/* Header */}
      <div className="story-viewer-header story-viewer-header-fb">
        <UserProfileMenu user={currentGroup?.author ?? null} avatarSize={40} className="story-viewer-author" />
        <div className="story-viewer-meta">
          <span className="story-viewer-name">{currentGroup?.author?.name ?? 'User'}</span>
          {currentStory?.isSponsored && <span className="story-viewer-sponsored-badge">Sponsored</span>}
          <span className="story-viewer-time">{formatPostTime(currentStory?.createdAt)}</span>
        </div>
        <div className="story-viewer-header-actions">
          {isVideo && (
            <button
              type="button"
              className="story-viewer-mute-btn"
              onClick={(e) => {
                e.stopPropagation();
                setVideoMuted((m) => !m);
              }}
              aria-label={videoMuted ? 'Unmute' : 'Mute'}
            >
              {videoMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}
          {currentStory?.id && (
            <>
              {(viewersCount > 0 || isMyStory) && (
                <button type="button" className="story-viewer-action-btn" onClick={(e) => { e.stopPropagation(); openViewers(); }} aria-label="Viewers">
                  <Eye size={18} />
                  <span>{viewersCount > 0 ? viewersCount : 'Viewers'}</span>
                </button>
              )}
              {isMyStory && (
                <button type="button" className="story-viewer-action-btn story-viewer-insights-btn" onClick={(e) => { e.stopPropagation(); openInsights(); }} aria-label="Insights">
                  <BarChart2 size={18} />
                  <span>Insights</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Emoji overlay on story when user reacts */}
      <AnimatePresence>
        {emojiOverlay && (
          <motion.div
            className="story-viewer-emoji-overlay"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="story-viewer-emoji-big">{emojiOverlay.emoji}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Viewers modal */}
      {viewersOpen && (
        <div className="story-viewer-modal-overlay" onClick={() => setViewersOpen(false)} role="dialog" aria-label="Story viewers">
          <div className="story-viewer-modal story-viewer-modal-fb" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-modal-header">
              <h3>Watu walioona story</h3>
              <button type="button" className="story-viewer-modal-close" onClick={() => setViewersOpen(false)} aria-label="Close">
                <X size={22} />
              </button>
            </div>
            <div className="story-viewer-modal-body">
              {viewersLoading ? (
                <div className="story-viewer-modal-loading">
                  <Loader2 size={32} className="spin" />
                  <p>Inapakia…</p>
                </div>
              ) : viewers.length === 0 ? (
                <p className="story-viewer-modal-empty">Hakuna mtu ameona bado.</p>
              ) : (
                <ul className="story-viewer-viewers-list">
                  {viewers.map((v) => (
                    <li key={v.id} className="story-viewer-viewer-item">
                      <UserProfileMenu user={v} avatarSize={44} showName={true} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Insights modal */}
      {insightsOpen && (
        <div className="story-viewer-modal-overlay" onClick={() => setInsightsOpen(false)} role="dialog" aria-label="Story insights">
          <div className="story-viewer-modal story-viewer-insights-modal" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-modal-header">
              <h3>Story Insights</h3>
              <button type="button" className="story-viewer-modal-close" onClick={() => setInsightsOpen(false)} aria-label="Close">
                <X size={22} />
              </button>
            </div>
            <div className="story-viewer-modal-body">
              {insightsLoading ? (
                <div className="story-viewer-modal-loading">
                  <Loader2 size={32} className="spin" />
                  <p>Inapakia…</p>
                </div>
              ) : insights ? (
                <div className="story-insights-grid">
                  <div className="story-insight-card">
                    <span className="story-insight-value">{insights.viewsCount ?? 0}</span>
                    <span className="story-insight-label">Views</span>
                  </div>
                  <div className="story-insight-card">
                    <span className="story-insight-value">{insights.likesCount ?? 0}</span>
                    <span className="story-insight-label">Reactions</span>
                  </div>
                  <div className="story-insight-card">
                    <span className="story-insight-value">{insights.commentsCount ?? 0}</span>
                    <span className="story-insight-label">Comments</span>
                  </div>
                  <div className="story-insight-card">
                    <span className="story-insight-value">{insights.sharesCount ?? 0}</span>
                    <span className="story-insight-label">Shares</span>
                  </div>
                </div>
              ) : (
                <p className="story-viewer-modal-empty">Could not load insights.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media */}
      <div className="story-viewer-media-wrap">
        {mediaUrl &&
          (isVideo ? (
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
              style={{ opacity: paused ? 0.95 : 1 }}
            />
          ) : (
            <img key={mediaUrl} src={mediaUrl} alt="" className="story-viewer-media" />
          ))}
        {isTextOnly && (
          <div className="story-viewer-text-story" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #4c1d95 100%)' }}>
            <p className="story-viewer-text-story-content">{currentStory.caption}</p>
          </div>
        )}
      </div>

      {currentStory?.caption && mediaUrl && <div className="story-viewer-caption">{currentStory.caption}</div>}

      {currentStory?.isSponsored && currentStory?.sponsorCtaLink && currentStory?.sponsorObjective !== 'ENGAGEMENT' && (
        <a
          href={normalizeCtaLink(currentStory.sponsorCtaLink)}
          target={isInternalCtaLink(currentStory.sponsorCtaLink) ? undefined : '_blank'}
          rel={isInternalCtaLink(currentStory.sponsorCtaLink) ? undefined : 'noopener noreferrer'}
          className="story-viewer-sponsored-cta"
          onClick={(e) => {
            if (currentStory.promotionId) trackPromotionClick(currentStory.promotionId).catch(() => {});
            if (isInternalCtaLink(currentStory.sponsorCtaLink)) { e.preventDefault(); navigate(currentStory.sponsorCtaLink); }
          }}
        >
          Visit link
        </a>
      )}
      {currentStory?.isSponsored && (currentStory?.sponsorObjective === 'ENGAGEMENT' || !currentStory?.sponsorObjective) && (
        <button
          type="button"
          className="story-viewer-sponsored-cta"
          onClick={(e) => { e.stopPropagation(); if (currentStory.promotionId) trackPromotionClick(currentStory.promotionId).catch(() => {}); setCommentsOpen(true); }}
        >
          Comment & share
        </button>
      )}

      {/* Right side: Reactions + Comment + Viewers - Facebook style */}
      {currentStory?.id && (
        <div className="story-viewer-interactions story-viewer-interactions-fb" onClick={(e) => e.stopPropagation()}>
          <div className="story-viewer-reaction-wrap">
            <div className="story-viewer-reaction-picker-wrap">
              <AnimatePresence>
                {reactionPickerOpen && (
                  <motion.div
                    className="story-viewer-reaction-picker"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    {REACTIONS.map((r) => (
                      <button
                        key={r.type}
                        type="button"
                        className={`story-viewer-reaction-emoji ${userReaction === r.type ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(r.type);
                        }}
                        title={r.label}
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              className="story-viewer-reaction-btn"
              onPointerDown={handleReactionBtnPointerDown}
              onPointerUp={handleReactionBtnPointerUp}
              onPointerLeave={handleReactionBtnPointerUp}
              onClick={handleReactionBtnClick}
              disabled={reactionLoading}
              aria-label={userReaction ? 'Remove reaction' : 'Like'}
            >
              {reactionLoading ? (
                <Loader2 size={24} className="spin" />
              ) : currentReactionEmoji ? (
                <span className="story-viewer-reaction-emoji-display">{currentReactionEmoji}</span>
              ) : (
                <Heart size={24} />
              )}
            </button>
            {reactionsCount > 0 && <span className="story-viewer-count">{reactionsCount}</span>}
          </div>

          <div className="story-viewer-interaction-item">
            <button type="button" className="story-viewer-interaction-btn" onClick={handleCommentClick} aria-label="Comments">
              <MessageCircle size={24} />
            </button>
            {commentsCount > 0 && <span className="story-viewer-count">{commentsCount}</span>}
          </div>

          {viewersCount > 0 && (
            <div className="story-viewer-interaction-item">
              <button type="button" className="story-viewer-interaction-btn" onClick={(e) => { e.stopPropagation(); openViewers(); }} aria-label="Viewers">
                <Eye size={24} />
              </button>
              <span className="story-viewer-count">{viewersCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Quick reply - Facebook style bottom input */}
      {!isMyStory && author?.id && (
        <form className="story-viewer-quick-reply" onSubmit={handleQuickReplySubmit} onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="story-viewer-quick-reply-input"
            placeholder={`Message ${author?.name ?? 'them'}...`}
            value={quickReplyText}
            onChange={(e) => setQuickReplyText(e.target.value)}
            onFocus={() => setQuickReplyFocused(true)}
            onBlur={() => setQuickReplyFocused(false)}
            maxLength={500}
            disabled={quickReplySending}
          />
          <button type="submit" className="story-viewer-quick-reply-send" disabled={!quickReplyText.trim() || quickReplySending} aria-label="Send">
            {quickReplySending ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
          </button>
        </form>
      )}

      {/* Comments drawer */}
      {commentsOpen && (
        <div className="reels-comments-overlay story-viewer-comments-overlay" onClick={(e) => { e.stopPropagation(); setCommentsOpen(false); }} role="presentation">
          <div className="reels-comments-drawer story-viewer-comments-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="reels-comments-header">
              <h3 className="reels-comments-title">Comments {commentsCount > 0 && `(${commentsCount})`}</h3>
              <button type="button" className="reels-comments-close" onClick={(e) => { e.stopPropagation(); setCommentsOpen(false); }} aria-label="Close">
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
                  <li key={comment.id} className="story-viewer-comment-item">
                    <UserProfileMenu user={comment.author} avatarSize={36} showName={false} />
                    <div className="story-viewer-comment-body">
                      <div className="story-viewer-comment-meta">
                        <span className="story-viewer-comment-author">{comment.author?.name ?? comment.author?.username ?? 'User'}</span>
                        <span className="story-viewer-comment-time"> · {formatPostTime(comment.createdAt)}</span>
                      </div>
                      <p className="story-viewer-comment-content">
                        <MentionContent content={comment.content} taggedUsers={comment.taggedUsers ?? []} />
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <form onSubmit={handleSubmitComment} className="reels-comments-input-wrap">
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                placeholder="Add a comment... Use @ to tag someone"
                maxLength={2000}
                disabled={commentSubmitting}
                inputClassName="reels-comments-input"
                mentionOrderRef={commentMentionOrderRef}
              />
              <button type="submit" className="reels-comments-submit" disabled={!commentText.trim() || commentSubmitting}>
                {commentSubmitting ? <Loader2 size={18} className="spin" /> : 'Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="story-viewer-tap-zones">
        <button type="button" className="story-viewer-tap-left" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setReactionPickerOpen(false); goPrev(); }} />
        <button type="button" className="story-viewer-tap-right" aria-label="Next" onClick={(e) => { e.stopPropagation(); setReactionPickerOpen(false); goNext(); }} />
      </div>
    </div>
  );
}
