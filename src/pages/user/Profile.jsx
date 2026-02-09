import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ImagePlus,
  Video,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Plus,
  Globe,
  Pencil,
  Camera,
} from 'lucide-react';
import { useAuthStore, setAuth, getToken } from '@/store/auth.store';
import { getMe, updateMe, uploadProfilePic, uploadCoverPic } from '@/lib/api/users';
import { getFriends } from '@/lib/api/friends';
import {
  getPostsByUser,
  createPost,
  likePost,
  unlikePost,
  getComments,
  addComment,
  deleteComment,
} from '@/lib/api/posts';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/user-app.css';

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

function formatPostTime(createdAt) {
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

function formatCommentTime(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  return date.toLocaleDateString();
}

function normalizePost(post) {
  const author = post.author ?? post.user ?? {};
  const media = post.media ?? post.attachments ?? [];
  const urls = Array.isArray(media)
    ? media.map((m) => (typeof m === 'string' ? m : m?.url ?? m?.src)).filter(Boolean)
    : [];
  const hasVideo = urls.some((_, i) => (media[i]?.type ?? '').toString().toLowerCase().includes('video'));
  return {
    id: post.id,
    author: { id: author.id, name: author.name, profilePic: author.profilePic },
    time: formatPostTime(post.createdAt ?? post.created_at),
    description: post.caption ?? post.content ?? '',
    media: urls,
    hasVideo,
    liked: !!post.userReaction,
    likesCount: post.reactionsCount ?? post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    sharesCount: post.sharesCount ?? 0,
  };
}

function ProfileFeedPost({ post, currentUser }) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? 0);
  const [expanded, setExpanded] = useState(false);
  const shortDesc = post.description?.length > 120 ? post.description.slice(0, 120) + '...' : post.description;
  const showSeeMore = post.description?.length > 120 && !expanded;

  const loadComments = useCallback(async () => {
    if (!post.id) return;
    setCommentsLoading(true);
    try {
      const list = await getComments(post.id, { page: 0, size: 20 });
      setComments(Array.isArray(list) ? list : []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    if (showComments && comments.length === 0 && !commentsLoading) loadComments();
  }, [showComments, comments.length, commentsLoading, loadComments]);

  const handleLike = async () => {
    if (!post.id) return;
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    try {
      if (next) await likePost(post.id);
      else await unlikePost(post.id);
    } catch {
      setLiked(!next);
      setLikesCount((c) => (next ? c - 1 : c + 1));
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!post.id || !content || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(post.id, content);
      setCommentText('');
      setCommentsCount((c) => c + 1);
      await loadComments();
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="profile-fb-post">
      <div className="profile-fb-post-header">
        <Avatar user={post.author} size={40} className="profile-fb-post-avatar" />
        <div className="profile-fb-post-meta">
          <span className="profile-fb-post-name">{post.author?.name ?? 'User'}</span>
          <span className="profile-fb-post-time">
            {post.time}
            <span className="profile-fb-post-privacy" aria-label="Public">
              <Globe size={14} />
            </span>
          </span>
        </div>
        <button type="button" className="profile-fb-post-options" aria-label="Options">
          <MoreHorizontal size={20} />
        </button>
      </div>
      {post.description && (
        <div className="profile-fb-post-text">
          {expanded ? post.description : shortDesc}
          {showSeeMore && (
            <button type="button" className="profile-fb-post-see-more" onClick={() => setExpanded(true)}>
              See more
            </button>
          )}
        </div>
      )}
      {post.media?.length > 0 && (
        <div className="profile-fb-post-media">
          {post.hasVideo ? (
            <video src={post.media[0]} controls playsInline className="profile-fb-post-video" />
          ) : (
            post.media.length === 1 ? (
              <img src={post.media[0]} alt="" loading="lazy" />
            ) : (
              <div className="profile-fb-post-media-grid" style={{ gridTemplateColumns: `repeat(${Math.min(post.media.length, 3)}, 1fr)` }}>
                {post.media.slice(0, 9).map((url, i) => (
                  <img key={i} src={url} alt="" loading="lazy" />
                ))}
              </div>
            )
          )}
        </div>
      )}
      <div className="profile-fb-post-engagement">
        <span className="profile-fb-post-counts">
          {likesCount > 0 && (
            <>
              <ThumbsUp size={18} fill="currentColor" />
              {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
            </>
          )}
          {commentsCount > 0 && <span>{commentsCount} Comments</span>}
          {post.sharesCount > 0 && <span>{post.sharesCount} Shares</span>}
        </span>
        <div className="profile-fb-post-actions">
          <button type="button" className={`profile-fb-post-action ${liked ? 'active' : ''}`} onClick={handleLike}>
            <ThumbsUp size={20} />
            Like
          </button>
          <button type="button" className="profile-fb-post-action" onClick={() => setShowComments((c) => !c)}>
            <MessageCircle size={20} />
            Comment
          </button>
          <button type="button" className="profile-fb-post-action">
            <Share2 size={20} />
            Share
          </button>
        </div>
      </div>
      {showComments && (
        <div className="profile-fb-post-comments">
          {commentsLoading ? (
            <p className="profile-fb-post-comments-loading">Loading…</p>
          ) : (
            <ul className="profile-fb-post-comments-list">
              {comments.map((c) => {
                const author = c.author ?? c.user ?? {};
                const isOwn = currentUser?.id && (author.id === currentUser.id || c.userId === currentUser.id);
                return (
                  <li key={c.id} className="profile-fb-post-comment">
                    <Avatar user={author} size={32} />
                    <div className="profile-fb-post-comment-body">
                      <div className="profile-fb-post-comment-bubble">
                        <span className="profile-fb-post-comment-author">{author.name ?? 'User'}</span>
                        <span className="profile-fb-post-comment-content">{c.content ?? c.text ?? ''}</span>
                      </div>
                      <span className="profile-fb-post-comment-time">{formatCommentTime(c.createdAt)}</span>
                      {isOwn && (
                        <button type="button" className="profile-fb-post-comment-delete" onClick={async () => {
                          try {
                            await deleteComment(c.id);
                            setComments((prev) => prev.filter((x) => x.id !== c.id));
                            setCommentsCount((n) => Math.max(0, n - 1));
                          } catch (_) {}
                        }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <form onSubmit={handleSubmitComment} className="profile-fb-post-comment-form">
            <Avatar user={currentUser} size={32} />
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="profile-fb-post-comment-input"
              maxLength={2000}
            />
            <button type="submit" className="profile-fb-post-comment-submit" disabled={!commentText.trim() || commentSubmitting}>
              {commentSubmitting ? '…' : 'Comment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user: authUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postFilter, setPostFilter] = useState('all'); // all | photos | videos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composerText, setComposerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const userId = authUser?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([getMe(), getFriends({ page: 0, size: 50 }), getPostsByUser(userId, { page: 0, size: 50 })])
      .then(([me, friendsList, postsList]) => {
        if (cancelled) return;
        setProfile(me ?? authUser);
        const raw = Array.isArray(friendsList) ? friendsList : friendsList?.content ?? [];
        const friendUsers = raw
          .map((f) => (f.requester?.id === userId ? f.addressee : f.requester))
          .filter(Boolean);
        setFriends(friendUsers);
        setPosts(Array.isArray(postsList) ? postsList.map(normalizePost) : []);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load profile'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, authUser?.id]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarUploading(true);
    setError('');
    try {
      const updated = await uploadProfilePic(file);
      setProfile(updated);
      const token = getToken();
      if (token) setAuth(updated, token);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile picture'));
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setCoverUploading(true);
    setError('');
    try {
      const updated = await uploadCoverPic(file);
      setProfile(updated);
      const token = getToken();
      if (token) setAuth(updated, token);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update cover photo'));
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const text = composerText.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await createPost({ caption: text, postType: 'POST', visibility: 'PUBLIC', files: [] });
      setComposerText('');
      const list = await getPostsByUser(userId, { page: 0, size: 50 });
      setPosts(Array.isArray(list) ? list.map(normalizePost) : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post'));
    } finally {
      setPosting(false);
    }
  };

  const displayProfile = profile ?? authUser;
  const filteredPosts =
    postFilter === 'photos'
      ? posts.filter((p) => p.media?.length > 0 && !p.hasVideo)
      : postFilter === 'videos'
        ? posts.filter((p) => p.hasVideo)
        : posts;

  const photoUrls = posts
    .filter((p) => p.media?.length > 0)
    .flatMap((p) => p.media)
    .slice(0, 9);

  if (loading && !displayProfile) {
    return (
      <div className="profile-fb profile-fb-loading">
        <div className="profile-fb-loading-spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="profile-fb">
      {/* Cover + avatar + name + actions */}
      <input
        type="file"
        ref={coverInputRef}
        accept="image/*"
        className="profile-fb-input-hidden"
        aria-label="Upload cover photo"
        onChange={handleCoverChange}
      />
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        className="profile-fb-input-hidden"
        aria-label="Upload profile picture"
        onChange={handleAvatarChange}
      />
      <div className="profile-fb-cover-wrap">
        <div
          className="profile-fb-cover"
          style={{
            backgroundImage: displayProfile?.coverPic
              ? `url(${displayProfile.coverPic})`
              : 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #d946ef 100%)',
          }}
        />
        <button
          type="button"
          className="profile-fb-cover-edit"
          onClick={() => coverInputRef.current?.click()}
          disabled={coverUploading}
          aria-label="Change cover photo"
        >
          <Camera size={20} />
          {coverUploading ? 'Uploading…' : displayProfile?.coverPic ? 'Edit cover photo' : 'Add cover photo'}
        </button>
        <div className="profile-fb-identity">
          <div className="profile-fb-avatar-wrap">
            <Avatar user={displayProfile} size={168} className="profile-fb-avatar" />
            <button
              type="button"
              className="profile-fb-avatar-edit"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Change profile picture"
            >
              {avatarUploading ? <span className="profile-fb-avatar-edit-text">…</span> : <Camera size={24} />}
            </button>
          </div>
          <div className="profile-fb-name-row">
            <h1 className="profile-fb-name">{displayProfile?.name ?? 'User'}</h1>
            <div className="profile-fb-actions">
              <Link to="/app/stories/create" className="profile-fb-btn profile-fb-btn-primary">
                <Plus size={20} />
                Add to Story
              </Link>
              <Link to="/app/settings" className="profile-fb-btn profile-fb-btn-secondary">
                <Pencil size={18} />
                Edit Profile
              </Link>
              <button type="button" className="profile-fb-btn profile-fb-btn-icon" aria-label="More">
                <MoreHorizontal size={20} />
              </button>
            </div>
            {(displayProfile?.bio || displayProfile?.work) && (
              <p className="profile-fb-bio">
                {displayProfile.bio || displayProfile.work || ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="profile-fb-error" role="alert">
          {error}
        </div>
      )}

      <div className="profile-fb-main">
        {/* Left sidebar */}
        <aside className="profile-fb-sidebar">
          <div className="profile-fb-card">
            <h3 className="profile-fb-card-title">Intro</h3>
            {(displayProfile?.work || displayProfile?.education || displayProfile?.currentCity || displayProfile?.relationshipStatus) ? (
              <ul className="profile-fb-intro-list">
                {displayProfile.work && <li>{displayProfile.work}</li>}
                {displayProfile.education && <li>Studied at {displayProfile.education}</li>}
                {displayProfile.currentCity && <li>Lives in {displayProfile.currentCity}</li>}
                {displayProfile.relationshipStatus && <li>{displayProfile.relationshipStatus}</li>}
              </ul>
            ) : (
              <p className="profile-fb-intro-empty">No intro added yet.</p>
            )}
            <Link to="/app/settings" className="profile-fb-card-link">
              Edit details
            </Link>
          </div>

          <div className="profile-fb-card">
            <div className="profile-fb-card-head">
              <h3 className="profile-fb-card-title">Photos</h3>
              <span className="profile-fb-card-count">{photoUrls.length} Photos</span>
            </div>
            {photoUrls.length > 0 ? (
              <>
                <div className="profile-fb-photos-grid">
                  {photoUrls.slice(0, 9).map((url, i) => (
                    <div key={i} className="profile-fb-photo-item">
                      <img src={url} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
                <Link to="/app/profile#photos" className="profile-fb-card-link">
                  See all photos
                </Link>
              </>
            ) : (
              <p className="profile-fb-empty-text">No photos yet.</p>
            )}
          </div>

          <div className="profile-fb-card">
            <div className="profile-fb-card-head">
              <h3 className="profile-fb-card-title">Friends</h3>
              <span className="profile-fb-card-count">{friends.length} Friends</span>
            </div>
            {friends.length > 0 ? (
              <>
                <div className="profile-fb-friends-grid">
                  {friends.slice(0, 9).map((friend) => (
                    <Link key={friend.id} to={`/app/profile`} className="profile-fb-friend-item">
                      <Avatar user={friend} size={80} />
                      <span className="profile-fb-friend-name">{friend.name ?? 'User'}</span>
                    </Link>
                  ))}
                </div>
                <Link to="/app/friends" className="profile-fb-card-link">
                  See all friends
                </Link>
              </>
            ) : (
              <p className="profile-fb-empty-text">No friends yet.</p>
            )}
          </div>
        </aside>

        {/* Main content: composer + posts */}
        <div className="profile-fb-content">
          <div className="profile-fb-filters">
            <button
              type="button"
              className={`profile-fb-filter ${postFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPostFilter('all')}
            >
              Posts
            </button>
            <button
              type="button"
              className={`profile-fb-filter ${postFilter === 'photos' ? 'active' : ''}`}
              onClick={() => setPostFilter('photos')}
            >
              Photos
            </button>
            <button
              type="button"
              className={`profile-fb-filter ${postFilter === 'videos' ? 'active' : ''}`}
              onClick={() => setPostFilter('videos')}
            >
              Videos
            </button>
          </div>

          {/* What's on your mind */}
          <div className="profile-fb-composer">
            <Avatar user={displayProfile} size={40} />
            <form onSubmit={handleCreatePost} className="profile-fb-composer-form">
              <input
                type="text"
                placeholder={`What's on your mind, ${displayProfile?.name?.split(' ')[0] ?? 'User'}?`}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                className="profile-fb-composer-input"
              />
              <div className="profile-fb-composer-actions">
                <button type="button" className="profile-fb-composer-action" disabled title="Live video">
                  <Video size={24} />
                  Live video
                </button>
                <button type="button" className="profile-fb-composer-action" disabled title="Photo/video">
                  <ImagePlus size={24} />
                  Photo/video
                </button>
                <button type="submit" className="profile-fb-composer-post" disabled={!composerText.trim() || posting}>
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts feed */}
          {filteredPosts.length === 0 && (
            <div className="profile-fb-posts-empty">
              {posts.length === 0 ? 'No posts yet. Share something!' : `No ${postFilter} posts.`}
            </div>
          )}
          {filteredPosts.map((post) => (
            <ProfileFeedPost
              key={post.id}
              post={post}
              currentUser={authUser}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
