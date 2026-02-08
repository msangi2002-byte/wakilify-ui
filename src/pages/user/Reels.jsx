import { useState, useRef } from 'react';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Play } from 'lucide-react';

// Mock short videos – replace with API (e.g. /api/v1/posts/reels) later
const MOCK_VIDEOS = [
  { id: '1', author: { name: 'Wakilfy Official' }, time: '2 hrs', description: 'Quick tips for selling on the feed. Connect with buyers in your area.', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', likes: 420, comments: 28, shares: 5 },
  { id: '2', author: { name: 'Sarah M.' }, time: '5 hrs', description: 'Weekend market haul – supporting local sellers.', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', likes: 189, comments: 12, shares: 2 },
  { id: '3', author: { name: 'Tech Gadgets Store' }, time: '1 d', description: 'New drop unboxing. Link in bio.', videoUrl: null, likes: 560, comments: 44, shares: 18 },
];

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
  return (
    <div className="reels-page">
      <div className="reels-page-header">
        <h1 className="reels-page-title">Short video</h1>
        <p className="reels-page-subtitle">Videos in your feed</p>
      </div>
      <div className="reels-list">
        {MOCK_VIDEOS.map((item) => (
          <VideoPostCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
