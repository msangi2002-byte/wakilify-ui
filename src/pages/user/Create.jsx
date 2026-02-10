import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImagePlus, X, Loader2, Video } from 'lucide-react';
import { createPost, uploadChunked, CHUNK_THRESHOLD_BYTES } from '@/lib/api/posts';
import { UploadProgressBar } from '@/components/ui/UploadProgressBar';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'FRIENDS', label: 'Friends' },
  { value: 'PRIVATE', label: 'Only me' },
];

export default function Create() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReel = searchParams.get('type') === 'reel';

  const fileInputRef = useRef(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) return;
    const maxFiles = isReel ? 1 : 10;
    setFiles((prev) => [...prev, ...chosen].slice(0, maxFiles));
    setPreviews((prev) => {
      const next = [...prev];
      chosen.slice(0, maxFiles - next.length).forEach((file) => {
        const url = URL.createObjectURL(file);
        next.push(url);
      });
      return next.slice(0, maxFiles);
    });
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isReel) {
      if (files.length === 0) {
        setError('Please add a video for your reel.');
        return;
      }
    } else if (!caption.trim() && files.length === 0) {
      setError('Add a caption or at least one photo.');
      return;
    }
    setSubmitting(true);
    setUploadProgress(0);
    const postType = isReel ? 'REEL' : 'POST';
    try {
      const hasLargeFile = files.some((f) => f.size > CHUNK_THRESHOLD_BYTES);
      if (hasLargeFile && files.length > 0) {
        const mediaUrls = [];
        const total = files.length;
        for (let i = 0; i < files.length; i++) {
          const url = await uploadChunked(files[i], 'posts', (pct) =>
            setUploadProgress(((i + pct / 100) / total) * 100)
          );
          mediaUrls.push(url);
        }
        await createPost({
          caption: caption.trim(),
          visibility,
          postType,
          mediaUrls,
        });
      } else {
        await createPost({
          caption: caption.trim(),
          visibility,
          postType,
          files,
        });
      }
      navigate(isReel ? '/app/reels' : '/app');
    } catch (err) {
      const msg = getApiErrorMessage(err, isReel ? 'Failed to create reel.' : 'Failed to create post.');
      const status = err.response?.status;
      setError(
        status === 403
          ? msg || 'You don’t have permission to create posts. You may need to sign in or use an account that can post.'
          : msg
      );
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="user-app-create">
      <div className="user-app-card user-app-create-card">
        <h1 className="user-app-create-title">{isReel ? 'Create reel' : 'Create post'}</h1>
        <form onSubmit={handleSubmit} className="user-app-create-form">
          <div className="user-app-create-field">
            <textarea
              className="user-app-create-caption"
              placeholder={isReel ? 'Add a description...' : "What's on your mind?"}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>
          <div className="user-app-create-field">
            <label className="user-app-create-label">Visibility</label>
            <select
              className="user-app-create-select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="user-app-create-field">
            <label className="user-app-create-label">
              {isReel ? 'Video (required)' : 'Photos (optional)'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={isReel ? 'video/*' : 'image/*'}
              multiple={!isReel}
              className="user-app-create-file-input"
              onChange={handleFileChange}
              aria-label={isReel ? 'Add video' : 'Add photos'}
            />
            <button
              type="button"
              className="user-app-create-add-photos"
              onClick={() => fileInputRef.current?.click()}
            >
              {isReel ? <Video size={20} /> : <ImagePlus size={20} />}
              {isReel ? 'Add video' : 'Add photos'}
            </button>
            {previews.length > 0 && (
              <div className="user-app-create-previews">
                {previews.map((url, i) => (
                  <div key={i} className="user-app-create-preview-wrap">
                    {isReel ? (
                      <video src={url} className="user-app-create-preview-img" controls style={{ maxHeight: 200, width: '100%', objectFit: 'contain' }} />
                    ) : (
                      <img src={url} alt="" className="user-app-create-preview-img" />
                    )}
                    <button
                      type="button"
                      className="user-app-create-preview-remove"
                      onClick={() => removeFile(i)}
                      aria-label="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="user-app-create-error">{error}</p>}
          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <UploadProgressBar progress={uploadProgress} label="Uploading…" />
          )}
          <div className="user-app-create-actions">
            <button
              type="button"
              className="user-app-create-btn user-app-create-btn-secondary"
              onClick={() => navigate(isReel ? '/app/reels' : '/app')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="user-app-create-btn user-app-create-btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                uploadProgress > 0 && uploadProgress < 100 ? (
                  <>Uploading {Math.round(uploadProgress)}%…</>
                ) : (
                  <>
                    <Loader2 size={18} className="user-app-create-spinner" />
                    {isReel ? 'Posting reel…' : 'Posting…'}
                  </>
                )
              ) : (
                isReel ? 'Post reel' : 'Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
