import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Eye } from 'lucide-react';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { getStories, recordStoryView, getStoryViewers } from '@/lib/api/posts';
import { useAuthStore } from '@/store/auth.store';
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

function formatStoryTime(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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

  useEffect(() => {
    if (!currentStory?.id || viewedStoryIdsRef.current.has(currentStory.id)) return;
    viewedStoryIdsRef.current.add(currentStory.id);
    recordStoryView(currentStory.id).catch(() => {});
  }, [currentStory?.id]);

  const openViewers = useCallback(async () => {
    if (!currentStory?.id) return;
    setViewersOpen(true);
    setViewersLoading(true);
    try {
      const list = await getStoryViewers(currentStory.id, { page: 0, size: 50 });
      setViewers(Array.isArray(list) ? list : list?.content ?? []);
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  }, [currentStory?.id]);

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
          <span className="story-viewer-time">{formatStoryTime(currentStory?.createdAt)}</span>
        </div>
        {isMyStory && currentStory?.id && (
          <button type="button" className="story-viewer-viewers-btn" onClick={openViewers} aria-label="Viewers">
            <Eye size={20} />
            Viewers
          </button>
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

      <div className="story-viewer-tap-zones">
        <button type="button" className="story-viewer-tap-left" aria-label="Previous" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
        <button type="button" className="story-viewer-tap-right" aria-label="Next" onClick={(e) => { e.stopPropagation(); goNext(); }} />
      </div>
    </div>
  );
}
