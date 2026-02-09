import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ImagePlus, Camera, Loader2 } from 'lucide-react';
import { createPost } from '@/lib/api/posts';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/user-app.css';

const ACCEPT_MEDIA = 'image/*,video/*';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_DURATION = 30; // seconds for story

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
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
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
    const url = URL.createObjectURL(chosen);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  };

  const clearMedia = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setCaption('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleShare = async () => {
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
      clearMedia();
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post story. Try again.'));
    } finally {
      setUploading(false);
    }
  };

  const isVideo = file?.type?.startsWith('video/');

  return (
    <div className="story-create">
      <header className="story-create-header">
        <button
          type="button"
          className="story-create-back"
          onClick={() => (preview ? clearMedia() : navigate(-1))}
          aria-label="Back"
        >
          <X size={24} />
        </button>
        <h1 className="story-create-title">Create story</h1>
        {preview && (
          <button
            type="button"
            className="story-create-share"
            onClick={handleShare}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={20} className="spin" /> : 'Share to story'}
          </button>
        )}
      </header>

      <div className="story-create-body">
        {!preview ? (
          <div className="story-create-picker">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_MEDIA}
              onChange={handleFileChange}
              className="story-create-input-hidden"
              aria-label="Choose photo or video"
            />
            <button
              type="button"
              className="story-create-picker-btn gallery"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={48} />
              <span>Photo or video from gallery</span>
            </button>
            <button
              type="button"
              className="story-create-picker-btn camera"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={48} />
              <span>Take photo or video</span>
            </button>
            <p className="story-create-hint">Stories disappear after 24 hours. Max 50MB.</p>
          </div>
        ) : (
          <div className="story-create-preview-wrap">
            <div className="story-create-preview">
              {isVideo ? (
                <video
                  src={preview}
                  controls
                  playsInline
                  className="story-create-preview-media"
                />
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
        )}
      </div>

      {error && (
        <div className="story-create-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
