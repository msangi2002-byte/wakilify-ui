import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Users, Video, MoreHorizontal, Plus, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const storyFriends = [
  { name: 'Bruittun Friends', id: '1' },
  { name: 'Rusty Friends', id: '2' },
  { name: 'Jun Frie', id: '3' },
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

function FeedPost({ author, time, description, mediaPlaceholder, likesCount = 0, commentsCount = 0, sharesCount = 0 }) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shortDesc = description && description.length > 120 ? description.slice(0, 120) + '...' : description;
  const showSeeMore = description && description.length > 120 && !expanded;

  return (
    <div className="user-app-card feed-post">
      <div className="feed-post-header">
        <Avatar user={author} size={40} className="feed-post-avatar" />
        <div className="feed-post-meta">
          <div className="feed-post-meta-top">
            <span className="feed-post-name">{author?.name || 'User'}</span>
            <button type="button" className="feed-post-follow">Follow</button>
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
      <div className="feed-post-body">
        {mediaPlaceholder && (
          <div className="feed-post-media-placeholder">
            <div className="feed-post-media-inner" />
          </div>
        )}
      </div>
      <div className="feed-post-engagement">
        <div className="feed-post-counts">
          {likesCount > 0 && (
            <span className="feed-post-likes-count">
              <ThumbsUp size={16} fill="currentColor" />
              {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
            </span>
          )}
          <span className="feed-post-comments-share">
            {commentsCount > 0 && <span>{commentsCount} comments</span>}
            {sharesCount > 0 && <span>{sharesCount} shares</span>}
          </span>
        </div>
        <div className="feed-post-actions">
          <button
            type="button"
            className={`feed-post-action ${liked ? 'active' : ''}`}
            onClick={() => setLiked(!liked)}
          >
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
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();

  return (
    <>
      {/* Stories */}
      <div className="user-app-card">
        <div className="user-app-stories-header">
          <h3>Stories</h3>
          <Link to="/app/stories">See All</Link>
        </div>
        <div className="user-app-stories-row">
          <div className="user-app-story-card create">
            <div className="avatar-wrap">
              <Avatar user={user} size={56} />
              <span className="plus-icon">
                <Plus size={14} strokeWidth={3} />
              </span>
            </div>
            <span className="label">Create Story</span>
          </div>
          {storyFriends.map((s) => (
            <Link key={s.id} to="/app/stories" className="user-app-story-card">
              <div className="story-bg" />
              <div style={{ position: 'relative', zIndex: 1, marginBottom: 'auto', paddingTop: 8 }}>
                <Avatar user={{ name: s.name }} size={40} className="story-avatar" />
              </div>
              <span className="story-name">{s.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* What's on your mind? */}
      <div className="user-app-card">
        <div className="user-app-composer">
          <Avatar user={user} size={40} className="user-app-composer-avatar" />
          <input
            type="text"
            placeholder="What's on your mind?"
            className="user-app-composer-input"
            readOnly
            aria-label="Create post"
          />
        </div>
        <div className="user-app-composer-actions">
          <button type="button" className="user-app-composer-btn post">
            <ImagePlus size={24} />
            Post
          </button>
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

      {/* Feed post – profile, name, description, time → media → like/comment/share */}
      <FeedPost
        author={{ name: 'Wakilfy Official' }}
        time="29 hrs"
        description="Connect, trade, and earn in one place. Discover products from your feed and support local businesses."
        mediaPlaceholder
        likesCount={1400}
        commentsCount={34}
        sharesCount={2}
      />
    </>
  );
}
