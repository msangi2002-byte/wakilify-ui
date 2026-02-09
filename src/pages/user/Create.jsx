import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { createPost } from '@/lib/api/posts';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'FRIENDS', label: 'Friends' },
  { value: 'PRIVATE', label: 'Only me' },
];

export default function Create() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) return;
    setFiles((prev) => [...prev, ...chosen].slice(0, 10));
    setPreviews((prev) => {
      const next = [...prev];
      chosen.forEach((file) => {
        const url = URL.createObjectURL(file);
        next.push(url);
      });
      return next.slice(0, 10);
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
    if (!caption.trim() && files.length === 0) {
      setError('Add a caption or at least one photo.');
      return;
    }
    setSubmitting(true);
    try {
      await createPost({
        caption: caption.trim(),
        visibility,
        postType: 'POST',
        files,
      });
      navigate('/app');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to create post.');
      const status = err.response?.status;
      setError(
        status === 403
          ? msg || 'You don’t have permission to create posts. You may need to sign in or use an account that can post.'
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-app-create">
      <div className="user-app-card user-app-create-card">
        <h1 className="user-app-create-title">Create post</h1>
        <form onSubmit={handleSubmit} className="user-app-create-form">
          <div className="user-app-create-field">
            <textarea
              className="user-app-create-caption"
              placeholder="What's on your mind?"
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
            <label className="user-app-create-label">Photos (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="user-app-create-file-input"
              onChange={handleFileChange}
              aria-label="Add photos"
            />
            <button
              type="button"
              className="user-app-create-add-photos"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={20} />
              Add photos
            </button>
            {previews.length > 0 && (
              <div className="user-app-create-previews">
                {previews.map((url, i) => (
                  <div key={i} className="user-app-create-preview-wrap">
                    <img src={url} alt="" className="user-app-create-preview-img" />
                    <button
                      type="button"
                      className="user-app-create-preview-remove"
                      onClick={() => removeFile(i)}
                      aria-label="Remove photo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="user-app-create-error">{error}</p>}
          <div className="user-app-create-actions">
            <button
              type="button"
              className="user-app-create-btn user-app-create-btn-secondary"
              onClick={() => navigate('/app')}
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
                <>
                  <Loader2 size={18} className="user-app-create-spinner" />
                  Posting…
                </>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
