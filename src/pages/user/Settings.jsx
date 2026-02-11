import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore, setAuth, getToken } from '@/store/auth.store';
import { useUIStore, setUI, subscribeUI } from '@/store/ui.store';
import {
  uploadProfilePic,
  uploadCoverPic,
  getBlockedUsers,
  unblockUser,
  updateMe,
  getRestrictedUsers,
  unrestrictUser,
  getLoginActivity,
  createBusinessRequest,
} from '@/lib/api/users';
import { searchAgents } from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { ROLES } from '@/types/roles';
import {
  User,
  Eye,
  EyeOff,
  Bell,
  Moon,
  Sun,
  Shield,
  UserX,
  Trash2,
  ShoppingBag,
  MapPin,
  CreditCard,
  Package,
  Camera,
  Building2,
  Sparkles,
  X,
} from 'lucide-react';

function SettingRow({ label, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-label">
        <span className="settings-row-title">{label}</span>
        {description && <span className="settings-row-desc">{description}</span>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`settings-toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle-thumb" />
    </button>
  );
}

export default function Settings() {
  const { user } = useAuthStore();
  const location = useLocation();
  const ui = useUIStore();
  const [theme, setTheme] = useState(ui.theme);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsub = subscribeUI((s) => setTheme(s.theme));
    return unsub;
  }, []);

  useEffect(() => {
    if (location.hash === '#marketplace') {
      const el = document.getElementById('marketplace');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const handleThemeChange = (next) => {
    setUI({ theme: next });
  };

  const notifications = {
    posts: true,
    messages: true,
    marketing: false,
  };
  const [notifState, setNotifState] = useState(notifications);
  const setNotif = (key, value) => setNotifState((s) => ({ ...s, [key]: value }));

  const marketplacePrefs = {
    newListings: true,
    priceDrops: true,
    orderUpdates: true,
    promotions: false,
    savedSearches: true,
  };
  const [marketplaceState, setMarketplacePref] = useState(marketplacePrefs);
  const setMarketplace = (key, value) => setMarketplacePref((s) => ({ ...s, [key]: value }));

  const [businessRequestOpen, setBusinessRequestOpen] = useState(false);
  const [businessRequestForm, setBusinessRequestForm] = useState({ businessName: '', ownerPhone: '', category: '', region: '', agentCode: '' });
  const [businessRequestLoading, setBusinessRequestLoading] = useState(false);
  const [businessRequestError, setBusinessRequestError] = useState('');
  const [businessRequestSuccess, setBusinessRequestSuccess] = useState('');
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentSearchResults, setAgentSearchResults] = useState([]);
  const [agentSearching, setAgentSearching] = useState(false);

  useEffect(() => {
    const q = agentSearchQuery?.trim();
    if (!q || q.length < 2) {
      setAgentSearchResults([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      setAgentSearching(true);
      try {
        const res = await searchAgents(q, { page: 0, size: 10 });
        setAgentSearchResults(Array.isArray(res?.content) ? res.content : []);
      } catch {
        setAgentSearchResults([]);
      } finally {
        setAgentSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [agentSearchQuery]);

  const handleSelectAgent = (a) => {
    const display = a.name ? `${a.name} (${a.agentCode || ''})` : (a.agentCode || a.email || '');
    setBusinessRequestForm((f) => ({ ...f, agentCode: a.agentCode || '' }));
    setAgentSearchQuery(display);
    setAgentSearchResults([]);
  };
  const handleSubmitBusinessRequest = async (e) => {
    e.preventDefault();
    setBusinessRequestError('');
    setBusinessRequestSuccess('');
    if (!businessRequestForm.businessName?.trim() || !businessRequestForm.ownerPhone?.trim() || !businessRequestForm.agentCode?.trim()) {
      setBusinessRequestError('Business name, owner phone and agent code are required.');
      return;
    }
    setBusinessRequestLoading(true);
    try {
      await createBusinessRequest({
        businessName: businessRequestForm.businessName.trim(),
        ownerPhone: businessRequestForm.ownerPhone.trim(),
        category: businessRequestForm.category?.trim() || undefined,
        region: businessRequestForm.region?.trim() || undefined,
        agentCode: businessRequestForm.agentCode.trim(),
      });
      setBusinessRequestSuccess('Request submitted. Your selected agent will contact you.');
      setBusinessRequestForm({ businessName: '', ownerPhone: '', category: '', region: '', agentCode: '' });
      setAgentSearchQuery('');
      setAgentSearchResults([]);
      setTimeout(() => { setBusinessRequestOpen(false); setBusinessRequestSuccess(''); }, 2000);
    } catch (err) {
      setBusinessRequestError(getApiErrorMessage(err, 'Failed to submit request'));
    } finally {
      setBusinessRequestLoading(false);
    }
  };

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setBlockedLoading(true);
    getBlockedUsers({ page: 0, size: 50 })
      .then((res) => {
        if (!cancelled) setBlockedUsers(res?.content ?? []);
      })
      .catch(() => {
        if (!cancelled) setBlockedUsers([]);
      })
      .finally(() => {
        if (!cancelled) setBlockedLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRestrictedLoading(true);
    getRestrictedUsers({ page: 0, size: 50 })
      .then((res) => {
        if (!cancelled) setRestrictedUsers(res?.content ?? []);
      })
      .catch(() => {
        if (!cancelled) setRestrictedUsers([]);
      })
      .finally(() => {
        if (!cancelled) setRestrictedLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoginActivityLoading(true);
    getLoginActivity({ page: 0, size: 20 })
      .then((res) => {
        if (!cancelled) setLoginActivity((res?.content ?? []));
      })
      .catch(() => {
        if (!cancelled) setLoginActivity([]);
      })
      .finally(() => {
        if (!cancelled) setLoginActivityLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSaveError('');
    try {
      const updated = await updateMe({
        name: profileForm.name?.trim() || undefined,
        bio: profileForm.bio?.trim() || undefined,
        work: profileForm.work?.trim() || undefined,
        education: profileForm.education?.trim() || undefined,
        currentCity: profileForm.currentCity?.trim() || undefined,
        region: profileForm.region?.trim() || undefined,
        country: profileForm.country?.trim() || undefined,
        hometown: profileForm.hometown?.trim() || undefined,
        interests: profileForm.interests?.trim() || undefined,
        relationshipStatus: profileForm.relationshipStatus || undefined,
        gender: profileForm.gender || undefined,
        dateOfBirth: profileForm.dateOfBirth || undefined,
        website: profileForm.website?.trim() || undefined,
        profileVisibility: profileForm.profileVisibility,
        followingListVisibility: profileForm.followingListVisibility,
      });
      const token = getToken();
      if (token && updated) setAuth(updated, token);
    } catch (err) {
      setProfileSaveError(getApiErrorMessage(err, 'Failed to save profile'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (_) {}
  };

  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    work: user?.work ?? '',
    education: user?.education ?? '',
    currentCity: user?.currentCity ?? '',
    region: user?.region ?? '',
    country: user?.country ?? '',
    hometown: user?.hometown ?? '',
    interests: user?.interests ?? '',
    relationshipStatus: user?.relationshipStatus ?? '',
    gender: user?.gender ?? '',
    dateOfBirth: user?.dateOfBirth ?? '',
    website: user?.website ?? '',
    profileVisibility: user?.profileVisibility ?? 'PUBLIC',
    followingListVisibility: user?.followingListVisibility ?? 'PUBLIC',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState('');
  const [restrictedUsers, setRestrictedUsers] = useState([]);
  const [restrictedLoading, setRestrictedLoading] = useState(false);
  const [loginActivity, setLoginActivity] = useState([]);
  const [loginActivityLoading, setLoginActivityLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name ?? '',
        bio: user.bio ?? '',
        work: user.work ?? '',
        education: user.education ?? '',
        currentCity: user.currentCity ?? '',
        region: user.region ?? '',
        country: user.country ?? '',
        hometown: user.hometown ?? '',
        interests: user.interests ?? '',
        relationshipStatus: user.relationshipStatus ?? '',
        gender: user.gender ?? '',
        dateOfBirth: user.dateOfBirth ?? '',
        website: user.website ?? '',
        profileVisibility: user.profileVisibility ?? 'PUBLIC',
        followingListVisibility: user.followingListVisibility ?? 'PUBLIC',
      }));
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarUploading(true);
    setPhotoError('');
    try {
      const updated = await uploadProfilePic(file);
      const token = getToken();
      if (token) setAuth(updated, token);
    } catch (err) {
      setPhotoError(getApiErrorMessage(err, 'Failed to update profile picture'));
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setCoverUploading(true);
    setPhotoError('');
    try {
      const updated = await uploadCoverPic(file);
      const token = getToken();
      if (token) setAuth(updated, token);
    } catch (err) {
      setPhotoError(getApiErrorMessage(err, 'Failed to update cover photo'));
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account and preferences</p>
      </header>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <Camera size={20} />
          Profile photos
        </h2>
        <input
          type="file"
          ref={avatarInputRef}
          accept="image/*"
          className="settings-input-hidden"
          aria-label="Upload profile picture"
          onChange={handleAvatarChange}
        />
        <input
          type="file"
          ref={coverInputRef}
          accept="image/*"
          className="settings-input-hidden"
          aria-label="Upload cover photo"
          onChange={handleCoverChange}
        />
        <SettingRow label="Profile picture" description="Photo shown on your profile and posts">
          <div className="settings-photo-row">
            <div
              className="settings-photo-preview settings-photo-preview-avatar"
              style={{ backgroundImage: user?.profilePic ? `url(${user.profilePic})` : undefined }}
            >
              {!user?.profilePic && <User size={32} />}
            </div>
            <button
              type="button"
              className="settings-btn settings-btn-secondary"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? 'Uploading…' : 'Change photo'}
            </button>
          </div>
        </SettingRow>
        <SettingRow label="Cover photo" description="Banner at the top of your profile">
          <div className="settings-photo-row">
            <div
              className="settings-photo-preview settings-photo-preview-cover"
              style={{ backgroundImage: user?.coverPic ? `url(${user.coverPic})` : undefined }}
            >
              {!user?.coverPic && <span>No cover</span>}
            </div>
            <button
              type="button"
              className="settings-btn settings-btn-secondary"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
            >
              {coverUploading ? 'Uploading…' : 'Change cover'}
            </button>
          </div>
        </SettingRow>
        {photoError && (
          <p className="settings-error" role="alert">
            {photoError}
          </p>
        )}
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <User size={20} />
          Account & profile
        </h2>
        <SettingRow label="Display name" description="Name shown on your profile">
          <input
            type="text"
            className="settings-input"
            value={profileForm.name}
            onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your name"
            aria-label="Display name"
          />
        </SettingRow>
        <SettingRow label="Bio" description="Short bio on your profile">
          <input
            type="text"
            className="settings-input"
            value={profileForm.bio}
            onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="About you"
            aria-label="Bio"
          />
        </SettingRow>
        <SettingRow label="City (Mji)" description="Used for people nearby">
          <input
            type="text"
            className="settings-input"
            value={profileForm.currentCity}
            onChange={(e) => setProfileForm((p) => ({ ...p, currentCity: e.target.value }))}
            placeholder="e.g. Dar es Salaam"
            aria-label="City"
          />
        </SettingRow>
        <SettingRow label="Region" description="Mkoa">
          <input
            type="text"
            className="settings-input"
            value={profileForm.region}
            onChange={(e) => setProfileForm((p) => ({ ...p, region: e.target.value }))}
            placeholder="Region"
            aria-label="Region"
          />
        </SettingRow>
        <SettingRow label="Country" description="Taifa">
          <input
            type="text"
            className="settings-input"
            value={profileForm.country}
            onChange={(e) => setProfileForm((p) => ({ ...p, country: e.target.value }))}
            placeholder="e.g. Tanzania"
            aria-label="Country"
          />
        </SettingRow>
        <SettingRow label="Hometown" description="Optional">
          <input
            type="text"
            className="settings-input"
            value={profileForm.hometown}
            onChange={(e) => setProfileForm((p) => ({ ...p, hometown: e.target.value }))}
            placeholder="Hometown"
            aria-label="Hometown"
          />
        </SettingRow>
        <SettingRow label="Work" description="Job or profession">
          <input
            type="text"
            className="settings-input"
            value={profileForm.work}
            onChange={(e) => setProfileForm((p) => ({ ...p, work: e.target.value }))}
            placeholder="Work"
            aria-label="Work"
          />
        </SettingRow>
        <SettingRow label="Education" description="School or university">
          <input
            type="text"
            className="settings-input"
            value={profileForm.education}
            onChange={(e) => setProfileForm((p) => ({ ...p, education: e.target.value }))}
            placeholder="Education"
            aria-label="Education"
          />
        </SettingRow>
        <SettingRow label="Interests" description="Hobbies, comma-separated">
          <input
            type="text"
            className="settings-input"
            value={profileForm.interests}
            onChange={(e) => setProfileForm((p) => ({ ...p, interests: e.target.value }))}
            placeholder="e.g. Music, Sports"
            aria-label="Interests"
          />
        </SettingRow>
        <SettingRow label="Website" description="Your website URL">
          <input
            type="url"
            className="settings-input"
            value={profileForm.website}
            onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://..."
            aria-label="Website"
          />
        </SettingRow>
        <SettingRow
          label="Password"
          description="Change your password. Leave blank to keep current."
        >
          <div className="settings-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              className="settings-input"
              placeholder="••••••••"
              aria-label="New password"
            />
            <button
              type="button"
              className="settings-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </SettingRow>
        {profileSaveError && (
          <p className="settings-error" role="alert">{profileSaveError}</p>
        )}
        <div className="settings-section-actions">
          <button
            type="button"
            className="settings-btn settings-btn-primary"
            onClick={handleSaveProfile}
            disabled={profileSaving}
          >
            {profileSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <Moon size={20} />
          Appearance
        </h2>
        <SettingRow
          label="Dark mode"
          description="Use a dark theme across the app"
        >
          <Toggle
            checked={theme === 'dark'}
            onChange={(on) => handleThemeChange(on ? 'dark' : 'light')}
            ariaLabel="Toggle dark mode"
          />
        </SettingRow>
        <div className="settings-theme-preview">
          <span className="settings-theme-icon">{theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}</span>
          <span>{theme === 'dark' ? 'Dark' : 'Light'} mode</span>
        </div>
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <Bell size={20} />
          Notifications
        </h2>
        <SettingRow
          label="Posts and activity"
          description="When friends post or react"
        >
          <Toggle
            checked={notifState.posts}
            onChange={(v) => setNotif('posts', v)}
            ariaLabel="Posts and activity notifications"
          />
        </SettingRow>
        <SettingRow
          label="Messages"
          description="New chats and message requests"
        >
          <Toggle
            checked={notifState.messages}
            onChange={(v) => setNotif('messages', v)}
            ariaLabel="Message notifications"
          />
        </SettingRow>
        <SettingRow
          label="Promotions and tips"
          description="Product updates and offers"
        >
          <Toggle
            checked={notifState.marketing}
            onChange={(v) => setNotif('marketing', v)}
            ariaLabel="Marketing notifications"
          />
        </SettingRow>
      </section>

      {String(user?.role ?? '').toLowerCase() === ROLES.USER && (
        <section className="user-app-card settings-section">
          <h2 className="settings-section-title">
            <Building2 size={20} />
            Become a business
          </h2>
          <p className="settings-row-desc" style={{ marginBottom: 12 }}>
            Request to open a business on Wakilfy. Choose an agent who will guide you through activation and verification.
          </p>
          <div className="settings-section-actions">
            <button
              type="button"
              className="settings-btn settings-btn-primary"
              onClick={() => setBusinessRequestOpen(true)}
            >
              <Sparkles size={20} />
              Request to become a business
            </button>
          </div>
        </section>
      )}

      <section id="marketplace" className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <ShoppingBag size={20} />
          Marketplace
        </h2>
        <SettingRow
          label="New listings"
          description="When sellers you follow list new items"
        >
          <Toggle
            checked={marketplaceState.newListings}
            onChange={(v) => setMarketplace('newListings', v)}
            ariaLabel="New listings notifications"
          />
        </SettingRow>
        <SettingRow
          label="Price drops"
          description="When items in your wishlist go on sale"
        >
          <Toggle
            checked={marketplaceState.priceDrops}
            onChange={(v) => setMarketplace('priceDrops', v)}
            ariaLabel="Price drop notifications"
          />
        </SettingRow>
        <SettingRow
          label="Order updates"
          description="Shipping and delivery status for your orders"
        >
          <Toggle
            checked={marketplaceState.orderUpdates}
            onChange={(v) => setMarketplace('orderUpdates', v)}
            ariaLabel="Order update notifications"
          />
        </SettingRow>
        <SettingRow
          label="Promotions"
          description="Deals and offers from sellers you follow"
        >
          <Toggle
            checked={marketplaceState.promotions}
            onChange={(v) => setMarketplace('promotions', v)}
            ariaLabel="Promotion notifications"
          />
        </SettingRow>
        <SettingRow
          label="Saved searches"
          description="Get notified when new items match your saved searches"
        >
          <Toggle
            checked={marketplaceState.savedSearches}
            onChange={(v) => setMarketplace('savedSearches', v)}
            ariaLabel="Saved search notifications"
          />
        </SettingRow>
        <SettingRow
          label="Default address"
          description="Used at checkout when no address is selected"
        >
          <select className="settings-select" aria-label="Default address">
            <option value="">None set</option>
            <option value="1">Home — 123 Main St, City</option>
            <option value="2">Work — 456 Office Rd</option>
          </select>
        </SettingRow>
        <SettingRow
          label="Default payment"
          description="Card or wallet used at checkout by default"
        >
          <select className="settings-select" aria-label="Default payment">
            <option value="">None set</option>
            <option value="card">•••• 4242</option>
            <option value="wallet">Wallet balance</option>
          </select>
        </SettingRow>
        <div className="settings-section-actions">
          <button type="button" className="settings-btn settings-btn-secondary">
            Manage addresses
          </button>
          <button type="button" className="settings-btn settings-btn-secondary">
            Manage payment methods
          </button>
          <Link to="/app/shop" className="settings-btn settings-btn-primary" style={{ textDecoration: 'none' }}>
            Browse marketplace
          </Link>
        </div>
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <Shield size={20} />
          Privacy & security
        </h2>
        <SettingRow
          label="Profile visibility"
          description="Who can see your profile and posts"
        >
          <select
            className="settings-select"
            aria-label="Profile visibility"
            value={profileForm.profileVisibility}
            onChange={(e) => setProfileForm((p) => ({ ...p, profileVisibility: e.target.value }))}
          >
            <option value="PUBLIC">Everyone</option>
            <option value="FOLLOWERS">Followers only</option>
            <option value="PRIVATE">Only me</option>
          </select>
        </SettingRow>
        <SettingRow
          label="Following list visibility"
          description="Who can see your followers and following lists"
        >
          <select
            className="settings-select"
            aria-label="Following list visibility"
            value={profileForm.followingListVisibility}
            onChange={(e) => setProfileForm((p) => ({ ...p, followingListVisibility: e.target.value }))}
          >
            <option value="PUBLIC">Everyone</option>
            <option value="FOLLOWERS">Followers only</option>
            <option value="PRIVATE">Only me</option>
          </select>
        </SettingRow>
        <SettingRow
          label="Two-factor authentication"
          description="Add an extra layer of security"
        >
          <button type="button" className="settings-btn settings-btn-secondary">
            Set up 2FA
          </button>
        </SettingRow>
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <UserX size={20} />
          Blocked users
        </h2>
        <p className="settings-row-desc" style={{ marginBottom: 12 }}>
          Watu uliofunga. Hauona posts/stories zao; wao hawanaona zako.
        </p>
        {blockedLoading ? (
          <p className="settings-loading">Loading…</p>
        ) : blockedUsers.length === 0 ? (
          <p className="settings-empty">Hakuna watu uliofunga.</p>
        ) : (
          <ul className="settings-blocked-list">
            {blockedUsers.map((u) => (
              <li key={u.id} className="settings-blocked-item">
                <div className="settings-blocked-info">
                  {u.profilePic ? (
                    <img src={u.profilePic} alt="" className="settings-blocked-avatar" />
                  ) : (
                    <div className="settings-blocked-avatar settings-blocked-avatar-initial">{u.name?.charAt(0) ?? '?'}</div>
                  )}
                  <span className="settings-blocked-name">{u.name ?? 'User'}</span>
                </div>
                <button type="button" className="settings-btn settings-btn-secondary" onClick={() => handleUnblock(u.id)}>
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <EyeOff size={20} />
          Restricted users
        </h2>
        <p className="settings-row-desc" style={{ marginBottom: 12 }}>
          Watu uliozuia. Wanaona posts zako za public tu.
        </p>
        {restrictedLoading ? (
          <p className="settings-loading">Loading…</p>
        ) : restrictedUsers.length === 0 ? (
          <p className="settings-empty">Hakuna watu uliozuia.</p>
        ) : (
          <ul className="settings-blocked-list">
            {restrictedUsers.map((u) => (
              <li key={u.id} className="settings-blocked-item">
                <div className="settings-blocked-info">
                  {u.profilePic ? (
                    <img src={u.profilePic} alt="" className="settings-blocked-avatar" />
                  ) : (
                    <div className="settings-blocked-avatar settings-blocked-avatar-initial">{u.name?.charAt(0) ?? '?'}</div>
                  )}
                  <span className="settings-blocked-name">{u.name ?? 'User'}</span>
                </div>
                <button
                  type="button"
                  className="settings-btn settings-btn-secondary"
                  onClick={async () => {
                    try {
                      await unrestrictUser(u.id);
                      setRestrictedUsers((prev) => prev.filter((x) => x.id !== u.id));
                    } catch (_) {}
                  }}
                >
                  Unrestrict
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <MapPin size={20} />
          Login activity
        </h2>
        <p className="settings-row-desc" style={{ marginBottom: 12 }}>
          Recent logins (device, browser, IP).
        </p>
        {loginActivityLoading ? (
          <p className="settings-loading">Loading…</p>
        ) : loginActivity.length === 0 ? (
          <p className="settings-empty">No login history.</p>
        ) : (
          <ul className="settings-activity-list">
            {loginActivity.map((entry, i) => (
              <li key={entry.id ?? i} className="settings-activity-item">
                <span className="settings-activity-time">{entry.loggedAt ?? entry.createdAt ?? '—'}</span>
                <span className="settings-activity-meta">
                  {[entry.device, entry.browser, entry.ip].filter(Boolean).join(' · ') || '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="user-app-card settings-section settings-section-danger">
        <h2 className="settings-section-title">
          <Trash2 size={20} />
          Account actions
        </h2>
        <SettingRow
          label="Delete account"
          description="Permanently delete your account and all data. This cannot be undone."
        >
          <button type="button" className="settings-btn settings-btn-danger">
            Delete account
          </button>
        </SettingRow>
      </section>

      {businessRequestOpen && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="business-request-title">
          <div className="settings-modal-card">
            <div className="settings-modal-header">
              <h2 id="business-request-title" className="settings-modal-title">
                <Building2 size={22} />
                Request to become a business
              </h2>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => { setBusinessRequestOpen(false); setBusinessRequestError(''); setBusinessRequestSuccess(''); setAgentSearchQuery(''); setAgentSearchResults([]); }}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmitBusinessRequest} className="settings-modal-body">
              <SettingRow label="Business name" description="Required">
                <input
                  type="text"
                  className="settings-input"
                  placeholder="e.g. Mama Ntilie Food"
                  value={businessRequestForm.businessName}
                  onChange={(e) => setBusinessRequestForm((f) => ({ ...f, businessName: e.target.value }))}
                  required
                />
              </SettingRow>
              <SettingRow label="Your phone" description="Contact for activation">
                <input
                  type="tel"
                  className="settings-input"
                  placeholder="+255787654321"
                  value={businessRequestForm.ownerPhone}
                  onChange={(e) => setBusinessRequestForm((f) => ({ ...f, ownerPhone: e.target.value }))}
                  required
                />
              </SettingRow>
              <SettingRow label="Category" description="Optional">
                <input
                  type="text"
                  className="settings-input"
                  placeholder="e.g. Food & Beverage"
                  value={businessRequestForm.category}
                  onChange={(e) => setBusinessRequestForm((f) => ({ ...f, category: e.target.value }))}
                />
              </SettingRow>
              <SettingRow label="Region" description="Optional">
                <input
                  type="text"
                  className="settings-input"
                  placeholder="e.g. Dar es Salaam"
                  value={businessRequestForm.region}
                  onChange={(e) => setBusinessRequestForm((f) => ({ ...f, region: e.target.value }))}
                />
              </SettingRow>
              <SettingRow label="Agent" description="Search by agent’s name or email; select from the list. Required.">
                <div className="settings-agent-select-wrap">
                  <div className="settings-agent-search-row">
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="Search by agent name or email..."
                      value={agentSearchQuery}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAgentSearchQuery(v);
                        if (businessRequestForm.agentCode) {
                          setBusinessRequestForm((f) => ({ ...f, agentCode: '' }));
                        }
                      }}
                      autoComplete="off"
                      aria-describedby="agent-results-hint"
                    />
                    {agentSearching && (
                      <span className="settings-agent-search-loading" aria-hidden>Searching…</span>
                    )}
                  </div>
                  {agentSearchResults.length > 0 && (
                    <ul
                      id="agent-results-hint"
                      className="settings-agent-results"
                      role="listbox"
                    >
                      {agentSearchResults.map((a) => (
                        <li key={a.id} role="option">
                          <button
                            type="button"
                            className={`settings-agent-result-item ${businessRequestForm.agentCode === a.agentCode ? 'selected' : ''}`}
                            onClick={() => handleSelectAgent(a)}
                          >
                            <span className="settings-agent-result-name">
                              {a.name || 'Agent'}
                              {(a.status || '').toUpperCase() === 'PENDING' && (
                                <span className="settings-agent-result-pending"> (Pending approval)</span>
                              )}
                            </span>
                            {(a.email || a.agentCode) && (
                              <span className="settings-agent-result-code">
                                {[a.email, a.agentCode].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {agentSearchQuery.trim().length >= 2 && !agentSearching && agentSearchResults.length === 0 && (
                    <p className="settings-agent-no-results">No agents found. Try another name or code.</p>
                  )}
                </div>
              </SettingRow>
              {businessRequestError && (
                <p className="settings-error" role="alert">{businessRequestError}</p>
              )}
              {businessRequestSuccess && (
                <p className="settings-success" role="status">{businessRequestSuccess}</p>
              )}
              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-btn settings-btn-secondary"
                  onClick={() => { setBusinessRequestOpen(false); setBusinessRequestError(''); setBusinessRequestSuccess(''); setAgentSearchQuery(''); setAgentSearchResults([]); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="settings-btn settings-btn-primary"
                  disabled={businessRequestLoading}
                >
                  {businessRequestLoading ? 'Submitting…' : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
