import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { getStories } from '@/lib/api/posts';
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
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

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
      progressRef.current = 0;
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
    if (!currentStory || paused || !mediaUrl) return;
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
        <Avatar user={currentGroup.author} size={40} className="story-viewer-avatar" />
        <div className="story-viewer-meta">
          <span className="story-viewer-name">{currentGroup.author?.name ?? 'User'}</span>
          <span className="story-viewer-time">{formatStoryTime(currentStory?.createdAt)}</span>
        </div>
      </div>

      <div className="story-viewer-media-wrap">
        {mediaUrl && (
          isVideo ? (
            <video
              key={mediaUrl}
              src={mediaUrl}
              autoPlay
              playsInline
              muted
              loop={false}
              onEnded={goNext}
              className="story-viewer-media"
            />
          ) : (
            <img key={mediaUrl} src={mediaUrl} alt="" className="story-viewer-media" />
          )
        )}
      </div>

      {currentStory?.caption && (
        <div className="story-viewer-caption">{currentStory.caption}</div>
      )}

      <div className="story-viewer-tap-zones">
        <button type="button" className="story-viewer-tap-left" aria-label="Previous" onClick={(e) => { e.stopPropagation(); goPrev(); }} />
        <button type="button" className="story-viewer-tap-right" aria-label="Next" onClick={(e) => { e.stopPropagation(); goNext(); }} />
      </div>
    </div>
  );
}
