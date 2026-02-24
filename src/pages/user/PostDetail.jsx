import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPostById } from '@/lib/api/posts';
import { FeedPost, normalizePost } from '@/pages/user/Home';
import '@/styles/user-app.css';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const {
    data: post,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });

  const normalized = post ? normalizePost(post) : null;

  if (!postId) {
    return (
      <div className="user-app post-detail-page">
        <div className="user-app-card" style={{ padding: 24, textAlign: 'center' }}>
          <p>Invalid post link.</p>
          <Link to="/app" className="post-detail-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'var(--primary, #7c3aed)', fontWeight: 600 }}>
            <ChevronLeft size={20} /> Back to feed
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="user-app post-detail-page">
        <header className="post-detail-header">
          <button type="button" className="post-detail-back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeft size={24} />
          </button>
          <h1 className="post-detail-title">Post</h1>
        </header>
        <div className="user-app-card" style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          Loading…
        </div>
      </div>
    );
  }

  if (isError || !post || !normalized) {
    return (
      <div className="user-app post-detail-page">
        <header className="post-detail-header">
          <button type="button" className="post-detail-back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ChevronLeft size={24} />
          </button>
          <h1 className="post-detail-title">Post</h1>
        </header>
        <div className="user-app-card" style={{ padding: 24, textAlign: 'center' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>Post not found.</p>
          <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            It may have been removed or the link is incorrect.
          </p>
          <Link to="/app" className="post-detail-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, color: 'var(--primary, #7c3aed)', fontWeight: 600 }}>
            <ChevronLeft size={20} /> Back to feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="user-app post-detail-page">
      <header className="post-detail-header">
        <button type="button" className="post-detail-back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <h1 className="post-detail-title">Post</h1>
      </header>
      <div className="post-detail-feed-wrap">
        <FeedPost
          id={normalized.id}
          author={normalized.author}
          time={normalized.time}
          description={normalized.description}
          media={normalized.media}
          hashtags={normalized.hashtags}
          visibility={normalized.visibility}
          location={normalized.location}
          feelingActivity={normalized.feelingActivity}
          taggedUsers={normalized.taggedUsers}
          topReactors={normalized.topReactors}
          liked={normalized.liked}
          userReaction={normalized.userReaction}
          likesCount={normalized.likesCount}
          commentsCount={normalized.commentsCount}
          sharesCount={normalized.sharesCount}
          saved={normalized.saved}
          authorIsFollowed={normalized.authorIsFollowed}
          isSponsored={normalized.isSponsored}
          sponsorCtaLink={normalized.sponsorCtaLink}
          sponsorObjective={normalized.sponsorObjective}
          promotionId={normalized.promotionId}
          onFollowChange={() => {}}
          onSaveChange={() => {}}
        />
      </div>
    </div>
  );
}
