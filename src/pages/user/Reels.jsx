import { useState, useRef, useEffect } from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Play } from 'lucide-react';
import { getReels } from '@/lib/api/posts';

function formatTime(createdAt) {
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

function normalizeReel(post) {
  const author = post.author ?? post.user ?? {};
  const media = post.media ?? post.attachments ?? post.images ?? [];
  const urls = Array.isArray(media) ? media.map((m) => (typeof m === 'string' ? m : m?.url ?? m?.src)) : [];
  const videoUrl = urls.find((u) => u && /\.(mp4|webm|ogg)(\?|$)/i.test(u)) ?? urls[0] ?? null;
  return {
    id: post.id,
    author: { name: author.name ?? author.username ?? 'User', profilePic: author.profilePic ?? author.avatar },
    time: formatTime(post.createdAt ?? post.created_at),
    description: post.caption ?? post.content ?? post.description ?? '',
    videoUrl,
    likes: post.likesCount ?? post.likes_count ?? post.likeCount ?? 0,
    comments: post.commentsCount ?? post.comments_count ?? post.commentCount ?? 0,
    shares: post.sharesCount ?? post.shares_count ?? 0,
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

function VideoPostCard({ item }) {
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  return (
    <article className="feed-post reels-video-post">
      <div className="feed-post-header">
        <Avatar user={item.author} size={40} className="feed-post-avatar" />
        <div className="feed-post-meta">
          <div className="feed-post-meta-top">
            <span className="feed-post-name">{item.author?.name || 'User'}</span>
            <button type="button" className="feed-post-follow">Follow</button>
          </div>
          <span className="feed-post-time">{item.time}</span>
        </div>
        <button type="button" className="feed-post-options" aria-label="Options">
          <MoreHorizontal size={20} />
        </button>
      </div>
      {item.description && (
        <div className="feed-post-description">{item.description}</div>
      )}
      <div className="feed-post-body reels-video-wrap">
        {item.videoUrl ? (
          <div
            className="reels-video-container"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
            }}
          >
            <video
              id={`reel-video-${item.id}`}
              ref={videoRef}
              src={item.videoUrl}
              className="reels-video"
              loop
              muted
              playsInline
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              poster=""
            />
            {!playing && (
              <div className="reels-video-play" aria-hidden>
                <Play size={48} fill="currentColor" />
              </div>
            )}
          </div>
        ) : (
          <div className="reels-video-placeholder">
            <Play size={64} className="reels-video-placeholder-icon" />
            <span>Short video</span>
          </div>
        )}
      </div>
      <div className="feed-post-engagement">
        <div className="feed-post-counts">
          {item.likes > 0 && (
            <span className="feed-post-likes-count">
              <ThumbsUp size={16} fill="currentColor" />
              {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}K` : item.likes}
            </span>
          )}
          <span className="feed-post-comments-share">
            {item.comments > 0 && <span>{item.comments} comments</span>}
            {item.shares > 0 && <span>{item.shares} shares</span>}
          </span>
        </div>
        <div className="feed-post-actions">
          <button type="button" className={`feed-post-action ${liked ? 'active' : ''}`} onClick={() => setLiked(!liked)}>
            <ThumbsUp size={20} />
            Like
          </button>
          <button type="button" className="feed-post-action">
            <MessageCircle size={20} />
            Comment
          </button>
          <button type="button" className="feed-post-action">
            <Share2 size={20} />
            Share
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Reels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getReels({ page: 0, size: 20 })
      .then((list) => {
        if (!cancelled) setItems(Array.isArray(list) ? list.map(normalizeReel) : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load reels');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="reels-page">
      <div className="reels-page-header">
        <h1 className="reels-page-title">Short video</h1>
        <p className="reels-page-subtitle">Videos in your feed</p>
      </div>
      {error && (
        <div className="user-app-card" style={{ padding: 16, color: '#b91c1c', marginBottom: 16 }}>
          {error}
        </div>
      )}
      {loading && (
        <div className="user-app-card" style={{ padding: 24, textAlign: 'center', color: '#65676b' }}>
          Loading reels…
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="user-app-card" style={{ padding: 24, textAlign: 'center', color: '#65676b' }}>
          No reels yet.
        </div>
      )}
      {!loading && items.length > 0 && (
        <div className="reels-list">
          {items.map((item) => (
            <VideoPostCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
