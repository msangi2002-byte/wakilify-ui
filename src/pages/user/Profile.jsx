import { Link, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  Plus,
  Globe,
  Pencil,
  Camera,
  LayoutGrid,
  Repeat,
  UserSquare,
} from 'lucide-react';
import { useAuthStore, setAuth, getToken } from '@/store/auth.store';
import { getMe, getUser, uploadProfilePic, uploadCoverPic } from '@/lib/api/users';
import {
  getPostsByUser,
  getSavedPosts,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
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
    saved: !!post.saved,
    hashtags: post.hashtags ?? [],
  };
}

function ProfileFeedPost({ post, currentUser, saved: initialSaved = false, onSaveChange }) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [saved, setSaved] = useState(!!(post.saved ?? initialSaved));
  const [saveLoading, setSaveLoading] = useState(false);
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

  const handleSave = async () => {
    if (!post.id || saveLoading) return;
    const next = !saved;
    setSaveLoading(true);
    try {
      if (next) await savePost(post.id);
      else await unsavePost(post.id);
      setSaved(next);
      onSaveChange?.(post.id, next);
    } catch {
      // keep previous state
    } finally {
      setSaveLoading(false);
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
          {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
            <span className="profile-fb-post-hashtags">
              {' '}
              {post.hashtags.map((tag) => (
                <Link key={tag} to={`/app/explore/hashtag/${tag}`} className="profile-fb-post-hashtag">
                  #{tag}
                </Link>
              ))}
            </span>
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
          <button
            type="button"
            className={`profile-fb-post-action ${saved ? 'active' : ''}`}
            onClick={handleSave}
            disabled={saveLoading}
            title={saved ? 'Ondoa kwenye Hifadhi' : 'Hifadhi'}
          >
            <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Saved' : 'Save'}
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
  const { userId: paramUserId } = useParams();
  const { user: authUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [profileTab, setProfileTab] = useState('posts'); // posts (grid) | saved | tagged
  const [postFilter, setPostFilter] = useState('all'); // all | photos | videos (used when profileTab === 'posts')
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const userId = paramUserId && paramUserId !== 'me' ? paramUserId : authUser?.id;
  const isOwnProfile = !paramUserId || paramUserId === 'me' || (authUser?.id && paramUserId === authUser.id);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    const loadProfile = isOwnProfile
      ? Promise.all([getMe(), getPostsByUser(userId, { page: 0, size: 50 })])
          .then(([me, postsList]) => [me ?? authUser, postsList])
      : Promise.all([getUser(userId), getPostsByUser(userId, { page: 0, size: 50 })]);

    loadProfile
      .then(([profileData, postsList]) => {
        if (cancelled) return;
        setProfile(profileData);
        setPosts(Array.isArray(postsList) ? postsList.map(normalizePost) : []);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load profile'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, isOwnProfile, authUser?.id]);

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

  const displayProfile = profile ?? authUser;

  useEffect(() => {
    if (profileTab !== 'saved' || !userId) return;
    let cancelled = false;
    setSavedLoading(true);
    getSavedPosts({ page: 0, size: 50 })
      .then((res) => {
        if (cancelled) return;
        const list = res?.content ?? (Array.isArray(res) ? res : []);
        setSavedPosts(list.map(normalizePost));
      })
      .catch(() => {
        if (!cancelled) setSavedPosts([]);
      })
      .finally(() => {
        if (!cancelled) setSavedLoading(false);
      });
    return () => { cancelled = true; };
  }, [profileTab, userId]);

  const filteredPosts =
    profileTab === 'saved'
      ? savedPosts
      : postFilter === 'photos'
        ? posts.filter((p) => p.media?.length > 0 && !p.hasVideo)
        : postFilter === 'videos'
          ? posts.filter((p) => p.hasVideo)
          : posts;

  /* For grid tab: posts with media for thumbnail grid; "all" = any image/video post */
  const gridPosts =
    profileTab === 'posts'
      ? postFilter === 'photos'
        ? posts.filter((p) => p.media?.length > 0 && !p.hasVideo)
        : postFilter === 'videos'
          ? posts.filter((p) => p.hasVideo)
          : posts.filter((p) => p.media?.length > 0)
      : profileTab === 'saved'
        ? savedPosts
        : [];

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
      {isOwnProfile && (
        <>
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
        </>
      )}
      <div className="profile-fb-cover-wrap">
        <div
          className="profile-fb-cover"
          style={{
            backgroundImage: displayProfile?.coverPic
              ? `url(${displayProfile.coverPic})`
              : 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #d946ef 100%)',
          }}
        />
        {isOwnProfile && (
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
        )}
        <div className="profile-fb-identity">
          <div className="profile-fb-avatar-wrap">
            <Avatar user={displayProfile} size={168} className="profile-fb-avatar" />
            {isOwnProfile && (
              <button
                type="button"
                className="profile-fb-avatar-edit"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                aria-label="Change profile picture"
              >
                {avatarUploading ? <span className="profile-fb-avatar-edit-text">…</span> : <Camera size={24} />}
              </button>
            )}
          </div>
          <div className="profile-fb-name-row">
            <h1 className="profile-fb-name">{displayProfile?.name ?? 'User'}</h1>
            <div className="profile-fb-actions">
              {isOwnProfile ? (
                <>
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
                </>
              ) : (
                <button type="button" className="profile-fb-btn profile-fb-btn-primary" disabled>
                  Message (coming soon)
                </button>
              )}
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

      <div className="profile-fb-main profile-fb-main-no-sidebar">
        {/* Main content: icon tab bar + grid */}
        <div className="profile-fb-content">
          {/* Icon tab bar (Grid = image/video posts, Repeat = saved, UserSquare = tagged) */}
          <div className="profile-fb-tabs" role="tablist" aria-label="Profile content tabs">
            <button
              type="button"
              role="tab"
              aria-selected={profileTab === 'posts'}
              aria-label="Image and video posts"
              className={`profile-fb-tab ${profileTab === 'posts' ? 'active' : ''}`}
              onClick={() => setProfileTab('posts')}
            >
              <LayoutGrid size={24} />
              <span className="profile-fb-tab-indicator" />
            </button>
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'saved'}
                  aria-label="Saved posts"
                  className={`profile-fb-tab ${profileTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setProfileTab('saved')}
                >
                  <Repeat size={24} />
                  <span className="profile-fb-tab-indicator" />
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'tagged'}
                  aria-label="Tagged posts"
                  className={`profile-fb-tab ${profileTab === 'tagged' ? 'active' : ''}`}
                  onClick={() => setProfileTab('tagged')}
                >
                  <UserSquare size={24} />
                  <span className="profile-fb-tab-indicator" />
                </button>
              </>
            )}
          </div>

          {/* Sub-filters for posts tab: All | Photos | Videos */}
          {profileTab === 'posts' && (
            <div className="profile-fb-subfilters">
              <button
                type="button"
                className={`profile-fb-subfilter ${postFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPostFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`profile-fb-subfilter ${postFilter === 'photos' ? 'active' : ''}`}
                onClick={() => setPostFilter('photos')}
              >
                Photos
              </button>
              <button
                type="button"
                className={`profile-fb-subfilter ${postFilter === 'videos' ? 'active' : ''}`}
                onClick={() => setPostFilter('videos')}
              >
                Videos
              </button>
            </div>
          )}

          {/* Grid view for posts and saved */}
          {(profileTab === 'posts' || profileTab === 'saved') && (
            <>
              {profileTab === 'saved' && savedLoading && (
                <div className="profile-fb-posts-empty">Loading saved posts…</div>
              )}
              {gridPosts.length === 0 && !(profileTab === 'saved' && savedLoading) && (
                <div className="profile-fb-posts-empty">
                  {profileTab === 'saved'
                    ? 'Hakuna post zilizohifadhiwa. / No saved posts.'
                    : posts.length === 0
                      ? 'No posts yet. Share something!'
                      : `No ${postFilter === 'all' ? 'image or video' : postFilter} posts.`}
                </div>
              )}
              {gridPosts.length > 0 && (
                <div className="profile-fb-posts-grid">
                  {gridPosts.map((post) => (
                    <div key={post.id} className="profile-fb-posts-grid-item">
                      {post.media?.[0] ? (
                        post.hasVideo ? (
                          <video src={post.media[0]} muted playsInline className="profile-fb-grid-thumb" />
                        ) : (
                          <img src={post.media[0]} alt="" loading="lazy" className="profile-fb-grid-thumb" />
                        )
                      ) : (
                        <div className="profile-fb-grid-thumb profile-fb-grid-thumb-placeholder">
                          <span className="profile-fb-grid-thumb-text">Post</span>
                        </div>
                      )}
                      {post.media?.length > 1 && (
                        <span className="profile-fb-grid-multi" aria-hidden>
                          <LayoutGrid size={14} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tagged tab */}
          {profileTab === 'tagged' && (
            <div className="profile-fb-posts-empty">
              No tagged posts yet. Posts you're tagged in will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
