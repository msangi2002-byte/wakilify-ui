import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Home,
  Users,
  UserPlus,
  Heart,
  Sparkles,
  X,
  Eye,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { ROLES } from '@/types/roles';
import { useAuthStore, setAuth, getToken } from '@/store/auth.store';
import { getMe, getUser, uploadProfilePic, uploadCoverPic, blockUser } from '@/lib/api/users';
import { followUser, unfollowUser } from '@/lib/api/friends';
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
  getPostById,
  getPostInsights,
  deletePost,
} from '@/lib/api/posts';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { formatPostTime, formatCommentTime } from '@/lib/utils/dateUtils';
import { ProfileSkeleton } from '@/components/ui/ProfileSkeleton';
import MentionInput, { getSubmitContent, MentionContent } from '@/components/ui/MentionInput';
import { ProfileGridSkeleton } from '@/components/ui/ProfileGridSkeleton';
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
    viewsCount: post.viewsCount ?? 0,
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
  const commentMentionOrderRef = useRef([]);
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
    const trimmed = commentText.trim();
    if (!post.id || !trimmed || commentSubmitting) return;
    const { content, taggedUserIds } = getSubmitContent(trimmed, commentMentionOrderRef.current || []);
    setCommentSubmitting(true);
    try {
      await addComment(post.id, content, null, taggedUserIds?.length ? taggedUserIds : null);
      setCommentText('');
      setCommentsCount((c) => c + 1);
      await loadComments();
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleEmojiClick = async (emoji) => {
    if (!post.id || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      await addComment(post.id, emoji);
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
        <div className="feed-post-comments">
          {commentsLoading ? (
            <p className="feed-post-comments-loading">Loading…</p>
          ) : (
            <ul className="feed-post-comments-list">
              {comments.map((c) => {
                const author = c.author ?? c.user ?? {};
                const name = author.name ?? author.username ?? 'User';
                const isOwn = currentUser?.id && (author.id === currentUser.id || c.userId === currentUser.id);
                const likeCount = c.likesCount ?? c.likes_count ?? 0;
                return (
                  <li key={c.id} className="feed-post-comment-item">
                    <Avatar user={author} size={36} className="feed-post-comment-avatar" />
                    <div className="feed-post-comment-main">
                      <div className="feed-post-comment-head">
                        <div className="feed-post-comment-meta">
                          <span className="feed-post-comment-author">{name}</span>
                          <span className="feed-post-comment-time">{formatCommentTime(c.createdAt)}</span>
                        </div>
                        <button type="button" className="feed-post-comment-like" aria-label="Like comment" title="Like">
                          <Heart size={16} />
                          {likeCount > 0 && <span className="feed-post-comment-like-count">{likeCount}</span>}
                        </button>
                      </div>
                      <p className="feed-post-comment-content">
                        <MentionContent content={c.content ?? c.text ?? ''} taggedUsers={c.taggedUsers ?? []} />
                      </p>
                      <div className="feed-post-comment-actions">
                        <button type="button" className="feed-post-comment-reply">Reply</button>
                        {isOwn && (
                          <button
                            type="button"
                            className="feed-post-comment-delete"
                            onClick={async () => {
                              try {
                                await deleteComment(c.id);
                                setComments((prev) => prev.filter((x) => x.id !== c.id));
                                setCommentsCount((n) => Math.max(0, n - 1));
                              } catch (_) {}
                            }}
                            aria-label="Delete comment"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="feed-post-comment-emoji-bar">
            <button type="button" className="feed-post-comment-emoji" aria-label="Heart" onClick={() => handleEmojiClick('❤️')}>❤️</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Clap" onClick={() => handleEmojiClick('🙌')}>🙌</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Fire" onClick={() => handleEmojiClick('🔥')}>🔥</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Sad" onClick={() => handleEmojiClick('😢')}>😢</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Love" onClick={() => handleEmojiClick('🥰')}>🥰</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Surprise" onClick={() => handleEmojiClick('😮')}>😮</button>
            <button type="button" className="feed-post-comment-emoji" aria-label="Laugh" onClick={() => handleEmojiClick('😂')}>😂</button>
          </div>
          <form onSubmit={handleSubmitComment} className="feed-post-comment-form">
            <Avatar user={currentUser} size={36} className="feed-post-comment-form-avatar" />
            <div className="feed-post-comment-form-wrap">
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                placeholder="Add a comment... Use @ to tag someone"
                maxLength={2000}
                inputClassName="feed-post-comment-input"
                mentionOrderRef={commentMentionOrderRef}
              />
              <button type="button" className="feed-post-comment-gif" aria-label="GIF">GIF</button>
            </div>
            <button type="submit" className="feed-post-comment-submit-btn" disabled={!commentText.trim() || commentSubmitting} aria-label="Post comment">
              {commentSubmitting ? '…' : <MessageCircle size={20} />}
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
  const queryClient = useQueryClient();
  const [profileTab, setProfileTab] = useState('posts');
  const [postFilter, setPostFilter] = useState('all');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState(null);
  const [postDetailData, setPostDetailData] = useState(null);
  const [postDetailLoading, setPostDetailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const navigate = useNavigate();

  const userId = paramUserId && paramUserId !== 'me' ? paramUserId : authUser?.id;
  const isOwnProfile = !paramUserId || paramUserId === 'me' || (authUser?.id && paramUserId === authUser.id);

  const {
    data: profileData,
    isPending: loading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile', userId, isOwnProfile],
    queryFn: async () => {
      if (isOwnProfile) {
        const [me, postsList] = await Promise.all([getMe(), getPostsByUser(userId, { page: 0, size: 50 })]);
        return { profile: me ?? authUser, posts: postsList };
      }
      const [profileRes, postsList] = await Promise.all([getUser(userId), getPostsByUser(userId, { page: 0, size: 50 })]);
      return { profile: profileRes, posts: postsList };
    },
    select: (data) => ({
      profile: data.profile,
      posts: (Array.isArray(data.posts) ? data.posts : []).map(normalizePost),
    }),
    enabled: !!userId,
  });

  const profile = profileData?.profile ?? null;
  const posts = profileData?.posts ?? [];
  const isFollowingProfile = profile?.isFollowing ?? false;
  const error = profileError ? getApiErrorMessage(profileError, 'Failed to load profile') : '';

  const { data: savedPosts = [], isLoading: savedLoading } = useQuery({
    queryKey: ['profile', 'saved', userId],
    queryFn: () => getSavedPosts({ page: 0, size: 50 }),
    select: (res) => (res?.content ?? (Array.isArray(res) ? res : [])).map(normalizePost),
    enabled: profileTab === 'saved' && !!userId,
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarUploading(true);
    try {
      const updated = await uploadProfilePic(file);
      queryClient.setQueryData(['profile', userId, isOwnProfile], (old) => (old ? { ...old, profile: updated } : old));
      const token = getToken();
      if (token) setAuth(updated, token);
    } catch (err) {
      // Error could be shown via toast; keep previous profile
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setCoverUploading(true);
    try {
      const updated = await uploadCoverPic(file);
      queryClient.setQueryData(['profile', userId, isOwnProfile], (old) => (old ? { ...old, profile: updated } : old));
      const token = getToken();
      if (token) setAuth(updated, token);
    } catch (err) {
      // Error could be shown via toast
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const displayProfile = profile ?? authUser;

  useEffect(() => {
    if (!selectedPostForDetail?.id) {
      setPostDetailData(null);
      return;
    }
    let cancelled = false;
    setPostDetailLoading(true);
    setPostDetailData(null);
    Promise.all([
      getPostById(selectedPostForDetail.id),
      getPostInsights(selectedPostForDetail.id).catch(() => null),
    ])
      .then(([postData, insights]) => {
        if (cancelled) return;
        setPostDetailData({
          post: postData ? normalizePost(postData) : selectedPostForDetail,
          insights: insights || null,
        });
      })
      .catch(() => {
        if (!cancelled) setPostDetailData({ post: selectedPostForDetail, insights: null });
      })
      .finally(() => {
        if (!cancelled) setPostDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedPostForDetail?.id]);

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
    return <ProfileSkeleton />;
  }

  const handleStr = displayProfile?.username ?? (displayProfile?.name ?? 'user').replace(/\s+/g, '').toLowerCase() || 'user';
  const postsCount = posts.length;
  const formatStat = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount ?? 0), 0);

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
        <div className="profile-fb-hero">
          <div className="profile-fb-hero-avatar-wrap">
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
          {isOwnProfile && (
            <div className="profile-fb-hero-actions">
              {(String(authUser?.role ?? '').toLowerCase() === ROLES.AGENT) && (
                <Link to="/agent" className="profile-fb-btn profile-fb-btn-primary">
                  <Sparkles size={20} />
                  Agent Dashboard
                </Link>
              )}
              <Link to="/app/stories/create" className="profile-fb-btn profile-fb-btn-primary">
                <Plus size={20} />
                Add to history
              </Link>
              <Link to="/app/settings" className="profile-fb-btn profile-fb-btn-secondary">
                <Pencil size={18} />
                Edit profile
              </Link>
            </div>
          )}
          {!isOwnProfile && displayProfile?.id && (
            <div className="profile-fb-hero-actions">
              <button
                type="button"
                className={`profile-fb-btn ${isFollowingProfile ? 'profile-fb-btn-secondary' : 'profile-fb-btn-primary'}`}
                onClick={async () => {
                  if (followLoading) return;
                  setFollowLoading(true);
                  const next = !isFollowingProfile;
                  queryClient.setQueryData(['profile', userId, isOwnProfile], (old) =>
                    old?.profile ? { ...old, profile: { ...old.profile, isFollowing: next } } : old
                  );
                  try {
                    if (isFollowingProfile) await unfollowUser(displayProfile.id);
                    else await followUser(displayProfile.id);
                  } catch (_) {
                    queryClient.setQueryData(['profile', userId, isOwnProfile], (old) =>
                      old?.profile ? { ...old, profile: { ...old.profile, isFollowing: !next } } : old
                    );
                  }
                  setFollowLoading(false);
                }}
                disabled={followLoading}
              >
                {followLoading ? '…' : isFollowingProfile ? 'Following' : 'Follow'}
              </button>
              <Link
                to="/app/messages"
                state={{ openUser: { id: displayProfile.id, name: displayProfile.name ?? displayProfile.username, profilePic: displayProfile.profilePic } }}
                className="profile-fb-btn profile-fb-btn-secondary"
              >
                <MessageCircle size={20} />
                Message
              </Link>
              <div className="profile-fb-menu-wrap">
                <button
                  type="button"
                  className="profile-fb-btn profile-fb-btn-icon"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="More options"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal size={20} />
                </button>
                {menuOpen && (
                  <>
                    <div className="profile-fb-menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden />
                    <div className="profile-fb-menu-dropdown">
                      <button
                        type="button"
                        className="profile-fb-menu-item"
                        onClick={async () => {
                          try {
                            await blockUser(displayProfile.id);
                            setMenuOpen(false);
                            navigate('/app/friends');
                          } catch (_) {}
                        }}
                      >
                        Block
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-fb-info">
        <div className="profile-fb-stats-col">
          <div className="profile-fb-stat-row">
            <span className="profile-fb-stat-label">Posts</span>
            <span className="profile-fb-stat-value">{formatStat(displayProfile?.postsCount ?? postsCount)}</span>
          </div>
          <div className="profile-fb-stat-row">
            <span className="profile-fb-stat-label">Total likes</span>
            <span className="profile-fb-stat-value">{formatStat(totalLikes)}</span>
          </div>
          <div className="profile-fb-stat-row">
            <span className="profile-fb-stat-label">Followers</span>
            <span className="profile-fb-stat-value">{formatStat(displayProfile?.followersCount ?? 0)}</span>
          </div>
          <div className="profile-fb-stat-row">
            <span className="profile-fb-stat-label">Following</span>
            <span className="profile-fb-stat-value">{formatStat(displayProfile?.followingCount ?? 0)}</span>
          </div>
        </div>
        <div className="profile-fb-bio-section">
          <h2 className="profile-fb-bio-section-title">Bio</h2>
          <p className="profile-fb-bio-section-text">
            {displayProfile?.bio || displayProfile?.work || 'No bio yet.'}
          </p>
          {(displayProfile?.currentCity || displayProfile?.region || displayProfile?.country) && (
            <p className="profile-fb-bio-section-meta">
              <span className="profile-fb-bio-location">
                {[displayProfile.currentCity, displayProfile.region, displayProfile.country].filter(Boolean).join(', ')}
              </span>
            </p>
          )}
          {(displayProfile?.work || displayProfile?.education || displayProfile?.interests) && (
            <p className="profile-fb-bio-section-meta">
              {displayProfile.work && <span>{displayProfile.work}</span>}
              {displayProfile.education && <span> · {displayProfile.education}</span>}
              {displayProfile.interests && <span> · {displayProfile.interests}</span>}
            </p>
          )}
        </div>
        <div className="profile-fb-actions profile-fb-actions-centered">
          <Link to="/app/settings" className="profile-fb-btn profile-fb-btn-primary profile-fb-btn-cta">
            <Pencil size={18} />
            Edit Profile
          </Link>
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
          {/* Content tabs: Post, Saved, Tagged post */}
          <div className="profile-fb-tabs profile-fb-tabs-text" role="tablist" aria-label="Profile content tabs">
            <button
              type="button"
              role="tab"
              aria-selected={profileTab === 'posts'}
              className={`profile-fb-tab ${profileTab === 'posts' ? 'active' : ''}`}
              onClick={() => setProfileTab('posts')}
            >
              Post
              <span className="profile-fb-tab-indicator" />
            </button>
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'saved'}
                  className={`profile-fb-tab ${profileTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setProfileTab('saved')}
                >
                  Saved
                  <span className="profile-fb-tab-indicator" />
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'tagged'}
                  className={`profile-fb-tab ${profileTab === 'tagged' ? 'active' : ''}`}
                  onClick={() => setProfileTab('tagged')}
                >
                  Tagged post
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
                <ProfileGridSkeleton cells={6} />
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
                    <div
                      key={post.id}
                      className="profile-fb-posts-grid-item"
                      role={isOwnProfile ? 'button' : undefined}
                      tabIndex={isOwnProfile ? 0 : undefined}
                      onClick={isOwnProfile ? () => setSelectedPostForDetail(post) : undefined}
                      onKeyDown={isOwnProfile ? (e) => e.key === 'Enter' && setSelectedPostForDetail(post) : undefined}
                    >
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

      {/* Post detail modal (own profile): likes, views, boost */}
      {selectedPostForDetail && (
        <div
          className="profile-post-detail-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-post-detail-title"
          onClick={() => setSelectedPostForDetail(null)}
        >
          <div
            className="profile-post-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-post-detail-header">
              <h2 id="profile-post-detail-title">Post stats</h2>
              <button
                type="button"
                onClick={() => setSelectedPostForDetail(null)}
                className="profile-post-detail-close"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            {postDetailLoading ? (
              <div className="profile-post-detail-loading">Loading…</div>
            ) : postDetailData ? (
              <>
                <div className="profile-post-detail-preview">
                  {postDetailData.post.media?.[0] ? (
                    postDetailData.post.hasVideo ? (
                      <video src={postDetailData.post.media[0]} controls playsInline className="profile-post-detail-media" />
                    ) : (
                      <img src={postDetailData.post.media[0]} alt="" className="profile-post-detail-media" />
                    )
                  ) : (
                    <div className="profile-post-detail-media profile-post-detail-media-placeholder">Post</div>
                  )}
                </div>
                {postDetailData.post.description && (
                  <p className="profile-post-detail-caption">{postDetailData.post.description.slice(0, 150)}{postDetailData.post.description.length > 150 ? '…' : ''}</p>
                )}
                <div className="profile-post-detail-stats">
                  <span className="profile-post-detail-stat">
                    <Heart size={20} fill="currentColor" /> {postDetailData.post.likesCount ?? postDetailData.insights?.likes ?? 0} likes
                  </span>
                  <span className="profile-post-detail-stat">
                    <Eye size={20} /> {postDetailData.post.viewsCount ?? postDetailData.insights?.views ?? 0} views
                  </span>
                  <span className="profile-post-detail-stat">
                    <MessageCircle size={20} /> {postDetailData.post.commentsCount ?? 0} comments
                  </span>
                  <span className="profile-post-detail-stat">
                    <Share2 size={20} /> {postDetailData.post.sharesCount ?? 0} shares
                  </span>
                </div>
                <div className="profile-post-detail-actions">
                  <button
                    type="button"
                    className="profile-post-detail-boost-btn"
                    onClick={() => {
                      setSelectedPostForDetail(null);
                      navigate('/app/boost', { state: { postId: postDetailData.post.id } });
                    }}
                  >
                    <TrendingUp size={20} /> Boost this post
                  </button>
                  <button
                    type="button"
                    className="profile-post-detail-delete-btn"
                    onClick={async () => {
                      if (!postDetailData?.post?.id || deleteLoading) return;
                      if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
                      
                      setDeleteLoading(true);
                      try {
                        await deletePost(postDetailData.post.id);
                        // Remove post from the list
                        queryClient.setQueryData(['profile', userId, isOwnProfile], (old) => {
                          if (!old) return old;
                          return {
                            ...old,
                            posts: old.posts?.filter((p) => p.id !== postDetailData.post.id) ?? [],
                          };
                        });
                        setSelectedPostForDetail(null);
                      } catch (err) {
                        const msg = getApiErrorMessage(err, 'Failed to delete post. Please try again.');
                        alert(msg);
                      } finally {
                        setDeleteLoading(false);
                      }
                    }}
                    disabled={deleteLoading}
                  >
                    <Trash2 size={20} /> {deleteLoading ? 'Deleting…' : 'Delete post'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
