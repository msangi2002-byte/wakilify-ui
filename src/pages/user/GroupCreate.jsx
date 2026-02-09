import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Loader2, ImagePlus } from 'lucide-react';
import { createCommunity } from '@/lib/api/communities';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/user-app.css';

const PRIVACY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public', desc: 'Anyone can find and request to join' },
  { value: 'PRIVATE', label: 'Private', desc: 'Only invited members can join' },
];

const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB

export default function GroupCreate() {
  const navigate = useNavigate();
  const coverInputRef = useRef(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCoverChange = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) {
      setCoverPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCoverFile(null);
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      setError('Cover image must be under 5MB.');
      setCoverFile(null);
      setCoverPreview(null);
      return;
    }
    setCoverFile(file);
    setCoverPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Group name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createCommunity({
        name: trimmed,
        description: description.trim() || null,
        type: 'GROUP',
        privacy,
        coverImage: coverFile || null,
      });
      navigate('/app/groups', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create group. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="groups-page group-create-page">
      <div className="group-create-container">
        <div className="group-create-header">
          <Link to="/app/groups" className="group-create-back">
            <ArrowLeft size={20} />
            Back to groups
          </Link>
          <h1 className="group-create-title">Create a group</h1>
          <p className="group-create-subtitle">
            Bring people together. Name your group and set who can find it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="group-create-form">
          {error && (
            <div className="group-create-error" role="alert">
              {error}
            </div>
          )}

          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-row-label">
                <span className="settings-row-title">Group name</span>
                <span className="settings-row-desc">Required. Short and clear works best.</span>
              </div>
              <div className="settings-row-control group-create-input-wrap">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wakilfy Traders"
                  maxLength={100}
                  className="group-create-input"
                  aria-label="Group name"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-label">
                <span className="settings-row-title">Description</span>
                <span className="settings-row-desc">What is this group about? (optional)</span>
              </div>
              <div className="settings-row-control group-create-input-wrap">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell members what this group is for..."
                  rows={3}
                  maxLength={500}
                  className="group-create-textarea"
                  aria-label="Description"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-label">
                <span className="settings-row-title">Privacy</span>
                <span className="settings-row-desc">Who can find and join this group?</span>
              </div>
              <div className="settings-row-control group-create-privacy">
                {PRIVACY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="group-create-radio">
                    <input
                      type="radio"
                      name="privacy"
                      value={opt.value}
                      checked={privacy === opt.value}
                      onChange={() => setPrivacy(opt.value)}
                      disabled={submitting}
                    />
                    <span className="group-create-radio-label">{opt.label}</span>
                    <span className="group-create-radio-desc">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-label">
                <span className="settings-row-title">Cover image</span>
                <span className="settings-row-desc">Optional. Max 5MB.</span>
              </div>
              <div className="settings-row-control">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="group-create-file-input"
                  aria-label="Cover image"
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="settings-btn settings-btn-secondary group-create-cover-btn"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={submitting}
                >
                  <ImagePlus size={18} />
                  {coverPreview ? 'Change cover' : 'Choose cover image'}
                </button>
                {coverPreview && (
                  <div className="group-create-cover-preview">
                    <img src={coverPreview} alt="" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="group-create-actions">
            <Link to="/app/groups" className="settings-btn settings-btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="settings-btn settings-btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="group-create-spinner" />
                  Creating…
                </>
              ) : (
                <>
                  <Users size={18} />
                  Create group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
