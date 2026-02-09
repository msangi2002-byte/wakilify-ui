import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ImagePlus, Type, Loader2, Settings } from 'lucide-react';
import { createPost } from '@/lib/api/posts';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useAuthStore } from '@/store/auth.store';
import { APP_NAME, LOGO_PNG, LOGO_ICON } from '@/lib/constants/brand';
import '@/styles/user-app.css';

const ACCEPT_MEDIA = 'image/*,video/*';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const TEXT_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #4c1d95 100%)',
  'linear-gradient(135deg, #d946ef 0%, #ec4899 50%, #be185d 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
  'linear-gradient(135deg, #059669 0%, #0ea5e9 100%)',
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

function BrandLogo({ size = 32 }) {
  const [src, setSrc] = useState(LOGO_PNG);
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ objectFit: 'contain', borderRadius: 8 }}
      onError={() => setSrc(LOGO_ICON)}
    />
  );
}

export default function StoryCreate() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState(null); // null | 'photo' | 'text'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [textStory, setTextStory] = useState('');
  const [textGradient, setTextGradient] = useState(TEXT_GRADIENTS[0]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setError('');
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    if (chosen.size > MAX_FILE_SIZE) {
      setError('File is too large. Max 50MB.');
      return;
    }
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  };

  const goBack = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setCaption('');
    setTextStory('');
    setError('');
    setMode(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSharePhoto = async () => {
    if (!file) {
      setError('Choose a photo or video first.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await createPost({
        caption: caption.trim(),
        postType: 'STORY',
        visibility: 'PUBLIC',
        files: [file],
      });
      goBack();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post story. Try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleShareText = async () => {
    const text = textStory.trim();
    if (!text) {
      setError('Write something to share.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await createPost({
        caption: text,
        postType: 'STORY',
        visibility: 'PUBLIC',
        files: [],
      });
      goBack();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post story. Try again.'));
    } finally {
      setUploading(false);
    }
  };

  const isVideo = file?.type?.startsWith('video/');

  // Photo preview / text composer (after choosing type)
  if (mode === 'photo' && preview) {
    return (
      <div className="story-create story-create-full">
        <header className="story-create-header">
          <button type="button" className="story-create-back" onClick={goBack} aria-label="Back">
            <X size={24} />
          </button>
          <span className="story-create-title">Create a Photo Story</span>
          <button
            type="button"
            className="story-create-share"
            onClick={handleSharePhoto}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={20} className="spin" /> : 'Share to story'}
          </button>
        </header>
        <div className="story-create-body">
          <div className="story-create-preview-wrap">
            <div className="story-create-preview">
              {isVideo ? (
                <video src={preview} controls playsInline className="story-create-preview-media" />
              ) : (
                <img src={preview} alt="" className="story-create-preview-media" />
              )}
              <div className="story-create-caption-overlay">
                <div className="story-create-caption-row">
                  <Avatar user={user} size={36} />
                  <input
                    type="text"
                    className="story-create-caption-input"
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={2000}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {error && <div className="story-create-error" role="alert">{error}</div>}
      </div>
    );
  }

  // Text story composer
  if (mode === 'text') {
    return (
      <div className="story-create story-create-full">
        <header className="story-create-header">
          <button type="button" className="story-create-back" onClick={goBack} aria-label="Back">
            <X size={24} />
          </button>
          <span className="story-create-title">Create a Text Story</span>
          <button
            type="button"
            className="story-create-share"
            onClick={handleShareText}
            disabled={uploading || !textStory.trim()}
          >
            {uploading ? <Loader2 size={20} className="spin" /> : 'Share to story'}
          </button>
        </header>
        <div className="story-create-body story-create-text-body">
          <div className="story-create-text-preview" style={{ background: textGradient }}>
            <textarea
              className="story-create-text-area"
              placeholder="Type something..."
              value={textStory}
              onChange={(e) => setTextStory(e.target.value)}
              maxLength={2000}
            />
          </div>
          <div className="story-create-text-options">
            <span className="story-create-text-options-label">Background</span>
            <div className="story-create-text-gradients">
              {TEXT_GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  className={`story-create-gradient-dot ${textGradient === g ? 'active' : ''}`}
                  style={{ background: g }}
                  onClick={() => setTextGradient(g)}
                  aria-label={`Gradient ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        {error && <div className="story-create-error" role="alert">{error}</div>}
      </div>
    );
  }

  // Photo picker (after clicking Photo Story, before selecting file)
  if (mode === 'photo') {
    return (
      <div className="story-create story-create-full">
        <header className="story-create-header">
          <button type="button" className="story-create-back" onClick={goBack} aria-label="Back">
            <X size={24} />
          </button>
          <span className="story-create-title">Create a Photo Story</span>
        </header>
        <div className="story-create-body">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_MEDIA}
            onChange={handleFileChange}
            className="story-create-input-hidden"
            aria-label="Choose photo or video"
          />
          <div className="story-create-picker story-create-picker-single">
            <button
              type="button"
              className="story-create-picker-btn gallery"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={56} />
              <span>Choose photo or video</span>
            </button>
            <p className="story-create-hint">Stories disappear after 24 hours. Max 50MB.</p>
          </div>
        </div>
        {error && <div className="story-create-error" role="alert">{error}</div>}
      </div>
    );
  }

  // Main view: Facebook-style – sidebar + two cards
  return (
    <div className="story-create story-create-fb">
      <header className="story-create-fb-header">
        <button type="button" className="story-create-back" onClick={() => navigate(-1)} aria-label="Close">
          <X size={24} />
        </button>
        <div className="story-create-fb-logo">
          <BrandLogo size={28} />
          <span>{APP_NAME}</span>
        </div>
        <div className="story-create-fb-header-right">
          <Avatar user={user} size={36} />
        </div>
      </header>

      <div className="story-create-fb-main">
        <aside className="story-create-fb-sidebar">
          <div className="story-create-fb-sidebar-head">
            <h2 className="story-create-fb-sidebar-title">Your story</h2>
            <button type="button" className="story-create-fb-sidebar-settings" aria-label="Story settings">
              <Settings size={20} />
            </button>
          </div>
          <div className="story-create-fb-sidebar-user">
            <Avatar user={user} size={48} />
            <div className="story-create-fb-sidebar-user-info">
              <span className="story-create-fb-sidebar-user-name">{user?.name ?? 'You'}</span>
              <span className="story-create-fb-sidebar-user-hint">Stories disappear after 24h</span>
            </div>
          </div>
        </aside>

        <div className="story-create-fb-content">
          <div className="story-create-fb-cards">
            <button
              type="button"
              className="story-create-fb-card story-create-fb-card-photo"
              onClick={() => setMode('photo')}
            >
              <span className="story-create-fb-card-icon">
                <ImagePlus size={40} strokeWidth={1.5} />
              </span>
              <span className="story-create-fb-card-label">Create a Photo Story</span>
            </button>
            <button
              type="button"
              className="story-create-fb-card story-create-fb-card-text"
              onClick={() => setMode('text')}
            >
              <span className="story-create-fb-card-icon">
                <Type size={40} strokeWidth={2} />
              </span>
              <span className="story-create-fb-card-label">Create a Text Story</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
