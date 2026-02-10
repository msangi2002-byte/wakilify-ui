import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Hash, ThumbsUp, MessageCircle } from 'lucide-react';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { getTrendingHashtags, getPostsByHashtag } from '@/lib/api/hashtags';
import { useAuthStore } from '@/store/auth.store';
import { likePost, unlikePost } from '@/lib/api/posts';
import { formatPostTime } from '@/lib/utils/dateUtils';
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

function isVideoItem(m) {
  if (!m) return false;
  const t = (m.type ?? '').toString().toLowerCase();
  if (t.includes('video')) return true;
  const u = typeof m === 'string' ? m : (m?.url ?? '');
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u);
}

function ExplorePostCard({ post, currentUser }) {
  const author = post.author ?? {};
  const media = post.media ?? [];
  const items = Array.isArray(media)
    ? media.map((m) => ({ url: typeof m === 'string' ? m : m?.url, isVideo: isVideoItem(m) })).filter((x) => x.url)
    : [];
  const [liked, setLiked] = useState(!!post.userReaction);
  const [likesCount, setLikesCount] = useState(post.reactionsCount ?? 0);

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

  return (
    <div className="user-app-card explore-post-card">
      <div className="explore-post-header">
        <UserProfileMenu user={author} avatarSize={36} className="explore-post-author" />
        <div className="explore-post-meta">
          <span className="explore-post-time">{formatPostTime(post.createdAt)}</span>
        </div>
      </div>
      {post.caption && (
        <p className="explore-post-caption">
          {post.caption}
          {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
            <span className="explore-post-hashtags">
              {' '}
              {post.hashtags.map((tag) => (
                <Link key={tag} to={`/app/explore/hashtag/${tag}`} className="explore-hashtag-link">
                  #{tag}
                </Link>
              ))}
            </span>
          )}
        </p>
      )}
      {items.length > 0 && (
        <div className="explore-post-media">
          {items.length === 1 ? (
            items[0].isVideo ? (
              <video src={items[0].url} controls playsInline className="explore-post-video" />
            ) : (
              <img src={items[0].url} alt="" loading="lazy" />
            )
          ) : (
            <div className="explore-post-media-grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
              {items.slice(0, 9).map((item, i) =>
                item.isVideo ? (
                  <video key={i} src={item.url} controls playsInline className="explore-post-video" />
                ) : (
                  <img key={i} src={item.url} alt="" loading="lazy" />
                )
              )}
            </div>
          )}
        </div>
      )}
      <div className="explore-post-actions">
        <button type="button" className={`explore-post-action ${liked ? 'active' : ''}`} onClick={handleLike}>
          <ThumbsUp size={18} />
          {likesCount > 0 ? likesCount : 'Like'}
        </button>
        <span className="explore-post-comments">{post.commentsCount ?? 0} comments</span>
      </div>
    </div>
  );
}

export default function Explore() {
  const { tagName } = useParams();
  const { user } = useAuthStore();
  const [trendingTags, setTrendingTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingTags(true);
    getTrendingHashtags({ page: 0, size: 24 })
      .then((list) => {
        if (!cancelled) setTrendingTags(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setTrendingTags([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTags(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError('');
    if (tagName) {
      setLoadingPosts(true);
      getPostsByHashtag(tagName, { page: 0, size: 30 })
        .then((res) => {
          if (!cancelled) setPosts(Array.isArray(res?.content) ? res.content : []);
        })
        .catch((err) => {
          if (!cancelled) setError(err.response?.data?.message || err.message || 'Failed to load posts');
        })
        .finally(() => {
          if (!cancelled) setLoadingPosts(false);
        });
    } else {
      setPosts([]);
    }
    return () => { cancelled = true; };
  }, [tagName]);

  return (
    <div className="explore-page">
      <div className="user-app-card explore-section">
        <h2 className="explore-title">Trending hashtags</h2>
        {loadingTags ? (
          <p className="explore-loading">Loading hashtags…</p>
        ) : (
          <div className="explore-tags">
            {trendingTags.length === 0 && !tagName && (
              <p className="explore-empty">Hakuna hashtags bado. Tumia #kwenye caption ya post.</p>
            )}
            {trendingTags.map((tag) => (
              <Link
                key={tag}
                to={`/app/explore/hashtag/${tag}`}
                className={`explore-tag ${tagName === tag ? 'active' : ''}`}
              >
                <Hash size={18} />
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {tagName && (
        <div className="explore-posts-section">
          <h2 className="explore-posts-title">#{tagName}</h2>
          {error && <p className="explore-error" role="alert">{error}</p>}
          {loadingPosts ? (
            <p className="explore-loading">Loading posts…</p>
          ) : posts.length === 0 ? (
            <p className="explore-empty">Hakuna posts kwenye #{tagName}.</p>
          ) : (
            <div className="explore-posts-grid">
              {posts.map((post) => (
                <ExplorePostCard key={post.id} post={post} currentUser={user} />
              ))}
            </div>
          )}
        </div>
      )}

      {!tagName && (
        <p className="explore-hint">Chagua hashtag hapa juu kuona posts zilizo na tag hiyo.</p>
      )}

      <style>{`
        .explore-page { padding: 16px; max-width: 640px; margin: 0 auto; }
        .explore-section { margin-bottom: 16px; }
        .explore-title { font-size: 1.125rem; margin: 0 0 12px; color: #050505; }
        .explore-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .explore-tag { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #f0f2f5; border-radius: 20px; color: #7c3aed; text-decoration: none; font-weight: 500; }
        .explore-tag:hover, .explore-tag.active { background: #ede9fe; color: #5b21b6; }
        .explore-posts-section { margin-top: 20px; }
        .explore-posts-title { font-size: 1.25rem; margin: 0 0 12px; color: #050505; }
        .explore-loading, .explore-empty, .explore-hint { color: #65676b; margin: 12px 0; }
        .explore-error { color: #b91c1c; margin: 12px 0; }
        .explore-posts-grid { display: flex; flex-direction: column; gap: 16px; }
        .explore-post-card { padding: 12px; }
        .explore-post-header { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; margin-bottom: 8px; }
        .explore-post-meta { display: flex; flex-direction: column; }
        .explore-post-name { font-weight: 600; color: #050505; }
        .explore-post-time { font-size: 0.875rem; color: #65676b; }
        .explore-post-caption { margin: 0 0 8px; font-size: 0.9375rem; line-height: 1.4; }
        .explore-hashtag-link { color: #7c3aed; text-decoration: none; }
        .explore-hashtag-link:hover { text-decoration: underline; }
        .explore-post-media { border-radius: 8px; overflow: hidden; margin-bottom: 8px; }
        .explore-post-media img, .explore-post-media .explore-post-video { width: 100%; display: block; }
        .explore-post-media .explore-post-video { max-height: 400px; object-fit: cover; background: #000; }
        .explore-post-media-grid { display: grid; gap: 2px; }
        .explore-post-actions { display: flex; align-items: center; gap: 16px; }
        .explore-post-action { display: inline-flex; align-items: center; gap: 6px; padding: 4px 0; background: none; border: none; color: #65676b; cursor: pointer; font-size: 0.9375rem; }
        .explore-post-action.active { color: #7c3aed; }
        .explore-post-action:hover { color: #7c3aed; }
        .explore-post-comments { font-size: 0.875rem; color: #65676b; }
      `}</style>
    </div>
  );
}
