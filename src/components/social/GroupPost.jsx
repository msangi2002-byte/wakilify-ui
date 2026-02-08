import { useState } from 'react';
import { MoreHorizontal, ThumbsUp, MessageCircle, Share2, X } from 'lucide-react';

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

function MediaGrid({ images = [] }) {
  if (!images.length) return null;
  const count = images.length;

  const gridClass =
    count === 1
      ? 'group-post-media-single'
      : count === 2
        ? 'group-post-media-two'
        : count === 3
          ? 'group-post-media-three'
          : 'group-post-media-four';

  return (
    <div className={`group-post-media-grid ${gridClass}`}>
      {images.slice(0, 4).map((img, i) => (
        <div key={i} className="group-post-media-item">
          {img.url ? (
            <img src={img.url} alt="" />
          ) : (
            <div className="group-post-media-placeholder" />
          )}
          {count > 4 && i === 3 && (
            <span className="group-post-media-more">+{count - 4}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function GroupPost({
  author,
  groupName,
  time,
  description,
  images = [],
  likesCount = 0,
  commentsCount = 0,
  sharesCount = 0,
  showGroupContext = true,
}) {
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shortDesc = description && description.length > 120 ? description.slice(0, 120) + '...' : description;
  const showSeeMore = description && description.length > 120 && !expanded;

  return (
    <div className="user-app-card group-post">
      <div className="group-post-header">
        <Avatar user={author} size={40} className="group-post-avatar" />
        <div className="group-post-meta">
          <div className="group-post-meta-top">
            <span className="group-post-name">{author?.name || 'User'}</span>
            {showGroupContext && groupName && (
              <span className="group-post-group-context">
                <span className="group-post-group-sep"> · </span>
                <span className="group-post-group-name">{groupName}</span>
              </span>
            )}
          </div>
          <span className="group-post-time">{time}</span>
        </div>
        <div className="group-post-header-actions">
          <button type="button" className="group-post-option" aria-label="Options">
            <MoreHorizontal size={20} />
          </button>
          <button type="button" className="group-post-option" aria-label="Close">
            <X size={20} />
          </button>
        </div>
      </div>
      {description && (
        <div className="group-post-description">
          {expanded ? description : shortDesc}
          {showSeeMore && (
            <button type="button" className="group-post-see-more" onClick={() => setExpanded(true)}>
              See more
            </button>
          )}
        </div>
      )}
      <div className="group-post-body">
        <MediaGrid images={images} />
      </div>
      <div className="group-post-engagement">
        <div className="group-post-counts">
          {likesCount > 0 && (
            <span className="group-post-likes-count">
              <ThumbsUp size={16} fill="currentColor" />
              {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount} reactions
            </span>
          )}
          <span className="group-post-comments-share">
            {commentsCount > 0 && <span>{commentsCount} comments</span>}
            {sharesCount > 0 && <span>{sharesCount} shares</span>}
          </span>
        </div>
        <div className="group-post-actions">
          <button
            type="button"
            className={`group-post-action ${liked ? 'active' : ''}`}
            onClick={() => setLiked(!liked)}
          >
            <ThumbsUp size={20} />
            Like
          </button>
          <button type="button" className="group-post-action">
            <MessageCircle size={20} />
            Comment
          </button>
          <button type="button" className="group-post-action">
            <Share2 size={20} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
