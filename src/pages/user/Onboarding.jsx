import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, SkipForward, ChevronRight, Sparkles } from 'lucide-react';
import { useAuthStore, setAuth, getToken, getRefreshToken } from '@/store/auth.store';
import { uploadProfilePic, updateMe, completeOnboarding } from '@/lib/api/users';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { APP_NAME } from '@/lib/constants/brand';
import '@/styles/auth.css';

const PREFERENCE_OPTIONS = [
  { id: 'Michezo', label: 'Michezo', icon: '⚽' },
  { id: 'Muziki', label: 'Muziki', icon: '🎵' },
  { id: 'Biashara', label: 'Biashara', icon: '💼' },
  { id: 'Tech', label: 'Tech', icon: '💻' },
  { id: 'Sanaa', label: 'Sanaa', icon: '🎨' },
  { id: 'Somo', label: 'Somo / Elimu', icon: '📚' },
  { id: 'Kujenga', label: 'Kujenga', icon: '🔧' },
  { id: 'Burudani', label: 'Burudani', icon: '🎬' },
];

function Avatar({ user, size = 96 }) {
  const src = user?.profilePic;
  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
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
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initial
      )}
    </div>
  );
}

export default function Onboarding() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bio, setBio] = useState('');
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [profilePic, setProfilePic] = useState(user?.profilePic);

  const totalSteps = 3;

  const togglePreference = (id) => {
    setSelectedPrefs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
    setError('');
  };

  const handleUploadAvatar = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file || loading) return;
    setLoading(true);
    setError('');
    try {
      const updated = await uploadProfilePic(file);
      if (updated?.profilePic) {
        setProfilePic(updated.profilePic);
        setAuth({ ...user, profilePic: updated.profilePic }, getToken(), getRefreshToken());
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to upload photo'));
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFromStep1 = () => {
    setStep(2);
    setError('');
  };

  const handleContinueFromStep2 = async () => {
    setError('');
    if (bio.trim()) {
      setLoading(true);
      try {
        await updateMe({ bio: bio.trim() });
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to save bio'));
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    setStep(3);
  };

  const handleFinish = async () => {
    setError('');
    setLoading(true);
    try {
      const interests = selectedPrefs.join(',');
      if (interests) await updateMe({ interests });
      const updated = await completeOnboarding();
      if (updated) {
        setAuth({ ...user, ...updated, onboardingCompleted: true }, getToken(), getRefreshToken());
      }
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to complete setup'));
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAll = () => {
    setLoading(true);
    completeOnboarding()
      .then((updated) => {
        if (updated) {
          setAuth({ ...user, ...updated, onboardingCompleted: true }, getToken(), getRefreshToken());
        }
        navigate('/app', { replace: true });
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, 'Failed to skip'));
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-content">
        <div className="onboarding-header">
          <h1 className="onboarding-logo">{APP_NAME}</h1>
          <div className="onboarding-progress">
            <span className="onboarding-step-indicator">
              Step {step} of {totalSteps}
            </span>
            <div className="onboarding-progress-bar">
              <div
                className="onboarding-progress-fill"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {/* Step 1: Profile Picture */}
        {step === 1 && (
          <div className="onboarding-step">
            <h2>Add a profile picture</h2>
            <p className="onboarding-hint">
              A photo helps others recognize you and builds trust
            </p>
            <div className="onboarding-avatar-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={handleUploadAvatar}
              />
              <button
                type="button"
                className="onboarding-avatar-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Avatar user={{ ...user, profilePic }} size={120} />
                <span className="onboarding-avatar-overlay">
                  <Camera size={28} />
                  <span>Add photo</span>
                </span>
              </button>
            </div>
            <div className="onboarding-actions">
              <button
                type="button"
                className="auth-btn-primary"
                onClick={handleContinueFromStep1}
              >
                Continue
              </button>
              <button
                type="button"
                className="onboarding-skip"
                onClick={handleContinueFromStep1}
              >
                <SkipForward size={18} />
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Bio */}
        {step === 2 && (
          <div className="onboarding-step">
            <h2>Tell us about yourself</h2>
            <p className="onboarding-hint">
              Write a short bio – who you are, what you do, or what you like
            </p>
            <textarea
              className="onboarding-bio-input"
              placeholder="e.g. Software developer from Dar. Love music and tech."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={4}
            />
            <span className="onboarding-char-count">{bio.length}/160</span>
            <div className="onboarding-actions">
              <button
                type="button"
                className="auth-btn-primary"
                onClick={handleContinueFromStep2}
                disabled={loading}
              >
                Continue
              </button>
              <button
                type="button"
                className="onboarding-skip"
                onClick={handleContinueFromStep2}
              >
                <SkipForward size={18} />
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="onboarding-step">
            <h2>
              <Sparkles size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
              What do you like?
            </h2>
            <p className="onboarding-hint">
              Select your interests so we can show you relevant content
            </p>
            <div className="onboarding-preferences">
              {PREFERENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`onboarding-pref-chip ${selectedPrefs.includes(opt.id) ? 'selected' : ''}`}
                  onClick={() => togglePreference(opt.id)}
                >
                  <span className="onboarding-pref-icon">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button
                type="button"
                className="auth-btn-primary"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? 'Finishing…' : 'Finish'}
                <ChevronRight size={20} />
              </button>
              <button
                type="button"
                className="onboarding-skip"
                onClick={handleSkipAll}
                disabled={loading}
              >
                <SkipForward size={18} />
                Skip and go to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
