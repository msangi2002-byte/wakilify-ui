import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

const TAB_PHOTOS = 'photos';
const TAB_VIDEOS = 'videos';

// Mock data – replace with API later
const MOCK_PHOTOS = [
  { id: '1', url: 'https://picsum.photos/seed/p1/400/400', caption: 'Sunset view' },
  { id: '2', url: 'https://picsum.photos/seed/p2/400/400', caption: 'Weekend vibes' },
  { id: '3', url: 'https://picsum.photos/seed/p3/400/400', caption: 'New place' },
  { id: '4', url: 'https://picsum.photos/seed/p4/400/400', caption: '' },
  { id: '5', url: 'https://picsum.photos/seed/p5/400/400', caption: '' },
  { id: '6', url: 'https://picsum.photos/seed/p6/400/400', caption: '' },
];

const MOCK_VIDEOS = [
  { id: '1', title: 'Introduction to Wakilify', thumbnail: 'https://picsum.photos/seed/v1/320/180', views: 1240, date: '2 days ago', duration: '2:45' },
  { id: '2', title: 'Marketplace tour', thumbnail: 'https://picsum.photos/seed/v2/320/180', views: 892, date: '1 week ago', duration: '5:12' },
  { id: '3', title: 'Quick tips', thumbnail: 'https://picsum.photos/seed/v3/320/180', views: 456, date: '2 weeks ago', duration: '1:30' },
];

function ProfileAvatar({ user, size = 128, className = '' }) {
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
        fontWeight: 700,
        fontSize: size * 0.4,
      }}
    >
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(TAB_PHOTOS);

  const displayName = user?.name || 'User';
  const bio = user?.bio || 'Welcome to my profile.';

  const stats = {
    followers: 1250,
    following: 340,
    likes: 8420,
  };

  return (
    <div className="user-app-card" style={{ padding: 0, marginBottom: 0 }}>
      <div className="profile-info">
        <div className="profile-avatar-wrap">
          <ProfileAvatar user={user} size={128} className="profile-avatar" />
          <div className="profile-name-bio">
            <h1 className="profile-name">{displayName}</h1>
            <p className="profile-bio">{bio}</p>
          </div>
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{stats.followers.toLocaleString()}</span>
            <span className="profile-stat-label">Followers</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{stats.following.toLocaleString()}</span>
            <span className="profile-stat-label">Following</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{stats.likes.toLocaleString()}</span>
            <span className="profile-stat-label">Likes</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <div className="profile-tab-list" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === TAB_PHOTOS}
            className={`profile-tab ${activeTab === TAB_PHOTOS ? 'active' : ''}`}
            onClick={() => setActiveTab(TAB_PHOTOS)}
          >
            Photos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === TAB_VIDEOS}
            className={`profile-tab ${activeTab === TAB_VIDEOS ? 'active' : ''}`}
            onClick={() => setActiveTab(TAB_VIDEOS)}
          >
            Videos
          </button>
        </div>

        <div className="profile-tab-panel">
          {activeTab === TAB_PHOTOS && (
            <div role="tabpanel" aria-label="Posted photos">
              {MOCK_PHOTOS.length > 0 ? (
                <div className="profile-photos-grid">
                  {MOCK_PHOTOS.map((photo) => (
                    <div key={photo.id} className="profile-photo-item">
                      <img src={photo.url} alt={photo.caption || 'Post'} loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-photos-empty">No photos yet. Your posted pictures will appear here.</div>
              )}
            </div>
          )}

          {activeTab === TAB_VIDEOS && (
            <div role="tabpanel" aria-label="Posted videos">
              {MOCK_VIDEOS.length > 0 ? (
                <div className="profile-videos-table-wrap">
                  <table className="profile-videos-table">
                    <thead>
                      <tr>
                        <th>Video</th>
                        <th>Title</th>
                        <th>Views</th>
                        <th>Duration</th>
                        <th>Posted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_VIDEOS.map((video) => (
                        <tr key={video.id}>
                          <td>
                            <img src={video.thumbnail} alt="" className="video-thumb" loading="lazy" />
                          </td>
                          <td>
                            <span className="video-title">{video.title}</span>
                          </td>
                          <td className="video-meta">{video.views.toLocaleString()} views</td>
                          <td className="video-meta">{video.duration}</td>
                          <td className="video-meta">{video.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="profile-videos-empty">No videos yet. Your posted videos will appear here.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
