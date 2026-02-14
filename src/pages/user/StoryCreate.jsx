import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ImagePlus, Type, Loader2 } from 'lucide-react';
import { createPost, uploadChunked, CHUNK_THRESHOLD_BYTES } from '@/lib/api/posts';
import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useAuthStore } from '@/store/auth.store';
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
  const [uploadProgress, setUploadProgress] = useState(0);
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
    setUploadProgress(0);
    setError('');
    try {
      let mediaUrl = null;
      let thumbnailUrl = null;
      if (file.size > CHUNK_THRESHOLD_BYTES) {
        const result = await uploadChunked(file, 'posts', (pct) => setUploadProgress(pct));
        mediaUrl = typeof result === 'string' ? result : result.url;
        thumbnailUrl = typeof result === 'object' && result.thumbnailUrl ? result.thumbnailUrl : null;
        await createPost({
          caption: caption.trim(),
          postType: 'STORY',
          visibility: 'PUBLIC',
          mediaUrls: [mediaUrl],
          thumbnailUrls: thumbnailUrl ? [thumbnailUrl] : undefined,
        });
      } else {
        await createPost({
          caption: caption.trim(),
          postType: 'STORY',
          visibility: 'PUBLIC',
          files: [file],
        });
      }
      goBack();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post story. Try again.'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  // Photo preview (after selecting file)
  if (mode === 'photo' && preview) {
    return (
      <div className="user-app-create">
        <div className="user-app-card user-app-create-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="user-app-create-title">Create a Photo Story</h1>
            <button
              type="button"
              onClick={goBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#65676b',
              }}
              aria-label="Back"
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
                aspectRatio: '9/16',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000',
              }}
            >
              {isVideo ? (
                <video
                  src={preview}
                  controls
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
          </div>
          <div className="user-app-create-field">
            <textarea
              className="user-app-create-caption"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>
          {error && <p className="user-app-create-error">{error}</p>}
          {uploading && uploadProgress > 0 && uploadProgress < 100 && (
            <UploadProgressBar
              progress={uploadProgress}
              label={uploadProgress >= 100 ? 'Finalizing…' : 'Uploading…'}
            />
          )}
          <div className="user-app-create-actions">
            <button
              type="button"
              className="user-app-create-btn user-app-create-btn-secondary"
              onClick={goBack}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="user-app-create-btn user-app-create-btn-primary"
              onClick={handleSharePhoto}
              disabled={uploading}
            >
              {uploading ? (
                uploadProgress > 0 && uploadProgress < 100 ? (
                  <>Uploading {Math.round(uploadProgress)}%…</>
                ) : (
                  <>
                    <Loader2 size={18} className="user-app-create-spinner" />
                    Sharing…
                  </>
                )
              ) : (
                'Share to story'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Text story composer
  if (mode === 'text') {
    return (
      <div className="user-app-create">
        <div className="user-app-card user-app-create-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="user-app-create-title">Create a Text Story</h1>
            <button
              type="button"
              onClick={goBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#65676b',
              }}
              aria-label="Back"
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                aspectRatio: '9/16',
                borderRadius: '12px',
                overflow: 'hidden',
                background: textGradient,
                position: 'relative',
              }}
            >
              <textarea
                value={textStory}
                onChange={(e) => setTextStory(e.target.value)}
                placeholder="Type something..."
                maxLength={2000}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  padding: '24px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
          <div className="user-app-create-field">
            <label className="user-app-create-label">Background</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {TEXT_GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTextGradient(g)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: textGradient === g ? '3px solid #7c3aed' : '3px solid transparent',
                    background: g,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  aria-label={`Gradient ${i + 1}`}
                />
              ))}
            </div>
          </div>
          {error && <p className="user-app-create-error">{error}</p>}
          <div className="user-app-create-actions">
            <button
              type="button"
              className="user-app-create-btn user-app-create-btn-secondary"
              onClick={goBack}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="user-app-create-btn user-app-create-btn-primary"
              onClick={handleShareText}
              disabled={uploading || !textStory.trim()}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="user-app-create-spinner" />
                  Sharing…
                </>
              ) : (
                'Share to story'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Photo picker (after clicking Photo Story, before selecting file)
  if (mode === 'photo') {
    return (
      <div className="user-app-create">
        <div className="user-app-card user-app-create-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="user-app-create-title">Create a Photo Story</h1>
            <button
              type="button"
              onClick={goBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#65676b',
              }}
              aria-label="Back"
            >
              <X size={20} />
            </button>
          </div>
          <div className="user-app-create-field">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_MEDIA}
              onChange={handleFileChange}
              className="user-app-create-file-input"
              aria-label="Choose photo or video"
            />
            <button
              type="button"
              className="user-app-create-add-photos"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', justifyContent: 'center', padding: '24px' }}
            >
              <ImagePlus size={24} />
              <span>Choose photo or video</span>
            </button>
            <p style={{ margin: '12px 0 0', fontSize: '0.875rem', color: '#65676b', textAlign: 'center' }}>
              Stories disappear after 24 hours. Max 50MB.
            </p>
          </div>
          {error && <p className="user-app-create-error">{error}</p>}
          <div className="user-app-create-actions">
            <button
              type="button"
              className="user-app-create-btn user-app-create-btn-secondary"
              onClick={goBack}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main view: Story type selection
  return (
    <div className="user-app-create">
      <div className="user-app-card user-app-create-card">
        <h1 className="user-app-create-title">Create a Story</h1>
        <p style={{ margin: '0 0 24px', fontSize: '0.9375rem', color: '#65676b' }}>
          Share a moment that disappears after 24 hours
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            type="button"
            onClick={() => setMode('photo')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '40px 24px',
              border: '2px solid #e4e6eb',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7c3aed';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e4e6eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ImagePlus size={32} strokeWidth={2} />
            </div>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#050505' }}>Create a Photo Story</span>
            <span style={{ fontSize: '0.875rem', color: '#65676b' }}>Share a photo or video</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('text')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '40px 24px',
              border: '2px solid #e4e6eb',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#d946ef';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 70, 239, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e4e6eb';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Type size={32} strokeWidth={2} />
            </div>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#050505' }}>Create a Text Story</span>
            <span style={{ fontSize: '0.875rem', color: '#65676b' }}>Share your thoughts</span>
          </button>
        </div>
        <div className="user-app-create-actions" style={{ marginTop: '24px', paddingTop: '24px' }}>
          <button
            type="button"
            className="user-app-create-btn user-app-create-btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
