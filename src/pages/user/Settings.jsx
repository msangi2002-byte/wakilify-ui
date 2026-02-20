import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, setAuth, getToken, getRefreshToken } from '@/store/auth.store';
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
  getMe,
  rateAgent,
} from '@/lib/api/users';
import { getAgentsForBusinessRequest } from '@/lib/api/agent';
import { getBusinessRegistrationPlans } from '@/lib/api/config';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { ROLES } from '@/types/roles';
import { SettingsUserListSkeleton } from '@/components/ui/SettingsUserListSkeleton';
import { SettingsActivitySkeleton } from '@/components/ui/SettingsActivitySkeleton';
import { SettingsAgentsSkeleton } from '@/components/ui/SettingsAgentsSkeleton';
import { SettingsPlansSkeleton } from '@/components/ui/SettingsPlansSkeleton';
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
  TrendingUp,
  Users,
  MousePointerClick,
  Star,
  List,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  const queryClient = useQueryClient();
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
  const [businessRequestStep, setBusinessRequestStep] = useState('agent'); // 'agent' | 'form'
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentViewTab, setAgentViewTab] = useState('map'); // 'map' | 'list'
  const [agentsSort, setAgentsSort] = useState('popularity');
  const [agentsPage, setAgentsPage] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [businessRequestForm, setBusinessRequestForm] = useState({ businessName: '', ownerPhone: '', category: '', region: '' });
  const [businessRequestLoading, setBusinessRequestLoading] = useState(false);
  const [businessRequestError, setBusinessRequestError] = useState('');
  const [businessRequestSuccess, setBusinessRequestSuccess] = useState('');
  const [ratePopupAgent, setRatePopupAgent] = useState(null);
  const [rateRating, setRateRating] = useState(0);
  const [rateComment, setRateComment] = useState('');
  const [rateLoading, setRateLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const { data: blockedUsers = [], isLoading: blockedLoading } = useQuery({
    queryKey: ['settings', 'blocked'],
    queryFn: () => getBlockedUsers({ page: 0, size: 50 }),
    select: (res) => res?.content ?? [],
  });

  const { data: restrictedUsers = [], isLoading: restrictedLoading } = useQuery({
    queryKey: ['settings', 'restricted'],
    queryFn: () => getRestrictedUsers({ page: 0, size: 50 }),
    select: (res) => res?.content ?? [],
  });

  const { data: loginActivity = [], isLoading: loginActivityLoading } = useQuery({
    queryKey: ['settings', 'loginActivity'],
    queryFn: () => getLoginActivity({ page: 0, size: 20 }),
    select: (res) => res?.content ?? [],
  });

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['settings', 'agents', agentsSort, agentsPage, userCoords?.lat, userCoords?.lng],
    queryFn: () =>
      getAgentsForBusinessRequest({
        sort: agentsSort,
        lat: userCoords?.lat,
        lng: userCoords?.lng,
        page: agentsPage,
        size: 20,
      }),
    enabled: !!businessRequestOpen && businessRequestStep === 'agent',
  });
  const agentsList = agentsData?.content ?? [];
  const agentsTotalPages = agentsData?.totalPages ?? 0;

  const { data: businessPlans = [], isLoading: businessPlansLoading } = useQuery({
    queryKey: ['settings', 'businessPlans'],
    queryFn: getBusinessRegistrationPlans,
    enabled: !!businessRequestOpen && businessRequestStep === 'form',
    select: (list) => (Array.isArray(list) ? list : []),
  });

  // Get user location once when opening agent step (for "nearby" sort)
  useEffect(() => {
    if (!businessRequestOpen || businessRequestStep !== 'agent' || userCoords) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  }, [businessRequestOpen, businessRequestStep]);

  const openBusinessRequestModal = () => {
    setBusinessRequestStep('agent');
    setSelectedAgent(null);
    setSelectedPlanId(null);
    setBusinessRequestError('');
    setBusinessRequestSuccess('');
    setBusinessRequestOpen(true);
  };

  const closeBusinessRequestModal = () => {
    setBusinessRequestOpen(false);
    setBusinessRequestStep('agent');
    setSelectedAgent(null);
    setSelectedPlanId(null);
    setBusinessRequestError('');
    setBusinessRequestSuccess('');
  };

  const handleSubmitBusinessRequest = async (e) => {
    e.preventDefault();
    setBusinessRequestError('');
    setBusinessRequestSuccess('');
    if (!businessRequestForm.businessName?.trim() || !businessRequestForm.ownerPhone?.trim()) {
      setBusinessRequestError('Business name and your phone are required.');
      return;
    }
    setBusinessRequestLoading(true);
    try {
      await createBusinessRequest({
        businessName: businessRequestForm.businessName.trim(),
        ownerPhone: businessRequestForm.ownerPhone.trim(),
        category: businessRequestForm.category?.trim() || undefined,
        region: businessRequestForm.region?.trim() || undefined,
        agentCode: selectedAgent?.agentCode || undefined,
        latitude: userCoords?.lat ?? undefined,
        longitude: userCoords?.lng ?? undefined,
        businessPlanId: selectedPlanId || undefined,
      });
      setBusinessRequestSuccess(
        selectedAgent
          ? `Request sent to ${selectedAgent.name || 'your agent'}. They will visit you and complete your registration. No payment here – you will pay when the agent instructs.`
          : 'Request sent. An agent may contact you to complete registration.'
      );
      setBusinessRequestForm({ businessName: '', ownerPhone: '', category: '', region: '' });
      getMe().then((me) => {
        if (me) setAuth(me, getToken(), getRefreshToken());
      }).catch(() => {});
      setTimeout(() => {
        closeBusinessRequestModal();
        setBusinessRequestSuccess('');
      }, 4000);
    } catch (err) {
      setBusinessRequestError(getApiErrorMessage(err, 'Failed to submit request'));
    } finally {
      setBusinessRequestLoading(false);
    }
  };

  const handleSubmitRate = async (e) => {
    e.preventDefault();
    if (!ratePopupAgent || rateRating < 1 || rateRating > 5) return;
    setRateLoading(true);
    try {
      await rateAgent(ratePopupAgent.id, rateRating, rateComment.trim() || undefined);
      setRatePopupAgent(null);
      setRateRating(0);
      setRateComment('');
    } catch (_) {}
    finally {
      setRateLoading(false);
    }
  };

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
      queryClient.setQueryData(['settings', 'blocked'], (prev = []) => prev.filter((u) => u.id !== userId));
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

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <TrendingUp size={20} />
          Boost Your Posts
        </h2>
        <p className="settings-row-desc" style={{ marginBottom: 12 }}>
          Tangaza post yako kwa watu zaidi. Chagua objective, audience, na budget.
        </p>
        <Link to="/app/boost" className="settings-btn settings-btn-primary" style={{ display: 'inline-flex' }}>
          <TrendingUp size={18} style={{ marginRight: 8 }} />
          Nenda kwenye Boost
        </Link>
      </section>

      {String(user?.role ?? '').toLowerCase() === ROLES.BUSINESS && (
        <section className="user-app-card settings-section">
          <h2 className="settings-section-title">
            <Building2 size={20} />
            Business Dashboard
          </h2>
          <p className="settings-row-desc" style={{ marginBottom: 12 }}>
            Manage your business, products, orders, and analytics.
          </p>
          <div className="settings-section-actions">
            <Link
              to="/business"
              className="settings-btn settings-btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Building2 size={20} />
              Go to Business Dashboard
            </Link>
          </div>
        </section>
      )}

      {String(user?.role ?? '').toLowerCase() === ROLES.USER && (
        <section className="user-app-card settings-section">
          <h2 className="settings-section-title">
            <Building2 size={20} />
            Become a business
          </h2>
          <p className="settings-row-desc" style={{ marginBottom: 12 }}>
            Request to open a business on Wakilfy. Choose a plan (fee), fill details and send – no payment here. Request goes to your agent with your location; they will visit, then complete registration and payment.
          </p>
          <div className="settings-section-actions">
            <button
              type="button"
              className="settings-btn settings-btn-primary"
              onClick={openBusinessRequestModal}
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
          <SettingsUserListSkeleton rows={4} />
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
          <SettingsUserListSkeleton rows={4} />
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
                      queryClient.setQueryData(['settings', 'restricted'], (prev = []) => prev.filter((x) => x.id !== u.id));
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
          <SettingsActivitySkeleton rows={5} />
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
          <div className="settings-modal-card" style={{ maxWidth: businessRequestStep === 'agent' ? 720 : 440 }}>
            <div className="settings-modal-header">
              <h2 id="business-request-title" className="settings-modal-title">
                <Building2 size={22} />
                {businessRequestStep === 'agent' ? 'Choose an agent (optional)' : 'Request to become a business'}
              </h2>
              <button type="button" className="settings-modal-close" onClick={closeBusinessRequestModal} aria-label="Close">
                <X size={22} />
              </button>
            </div>

            {businessRequestStep === 'agent' && (
              <div className="settings-modal-body">
                <p className="settings-row-desc" style={{ marginBottom: 12 }}>
                  Select an agent to handle your business activation, or continue without one.
                </p>
                <div className="settings-agent-select-wrap" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    type="button"
                    className={`settings-btn ${agentViewTab === 'map' ? 'settings-btn-primary' : 'settings-btn-secondary'}`}
                    onClick={() => setAgentViewTab('map')}
                  >
                    <MapPin size={18} /> Map
                  </button>
                  <button
                    type="button"
                    className={`settings-btn ${agentViewTab === 'list' ? 'settings-btn-primary' : 'settings-btn-secondary'}`}
                    onClick={() => setAgentViewTab('list')}
                  >
                    <List size={18} /> List
                  </button>
                </div>

                {agentViewTab === 'list' && (
                  <div className="settings-agent-search-row" style={{ marginBottom: 12 }}>
                    <label className="settings-row-desc" style={{ marginRight: 8 }}>Sort by:</label>
                    <select
                      className="settings-select"
                      value={agentsSort}
                      onChange={(e) => { setAgentsSort(e.target.value); setAgentsPage(0); }}
                      style={{ minWidth: 140 }}
                    >
                      <option value="popularity">Popularity</option>
                      <option value="rating">Rating</option>
                      <option value="nearby">Nearby</option>
                    </select>
                  </div>
                )}

                {agentsLoading ? (
                  <SettingsAgentsSkeleton rows={5} />
                ) : agentViewTab === 'map' ? (
                  <div style={{ height: 320, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                    <MapContainer
                      center={userCoords || [-6.369, 34.8888]}
                      zoom={userCoords ? 10 : 6}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {agentsList.filter((a) => a.latitude != null && a.longitude != null).map((a) => (
                        <Marker
                          key={a.id}
                          position={[a.latitude, a.longitude]}
                          icon={L.divIcon({
                            className: 'agent-marker',
                            html: `<div style="width:24px;height:24px;border-radius:50%;background:#8b5cf6;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);">A</div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12],
                          })}
                        >
                          <Popup>
                            <div style={{ minWidth: 160 }}>
                              <strong>{a.name ?? 'Agent'}</strong>
                              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                Code: {a.agentCode}
                                {a.averageRating != null && (
                                  <span style={{ display: 'block' }}>★ {Number(a.averageRating).toFixed(1)} ({a.ratingCount ?? 0} reviews)</span>
                                )}
                                <span style={{ display: 'block' }}>{a.businessesActivated ?? 0} businesses activated</span>
                                {a.isOnline && <span style={{ color: '#10b981' }}>• Online</span>}
                              </div>
                              <button
                                type="button"
                                className="settings-btn settings-btn-primary"
                                style={{ marginTop: 8, width: '100%' }}
                                onClick={() => { setSelectedAgent(a); setBusinessRequestStep('form'); }}
                              >
                                Request with this agent
                              </button>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>
                ) : (
                  <div className="settings-agent-results" style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
                    {agentsList.length === 0 ? (
                      <p className="settings-agent-no-results">No agents found.</p>
                    ) : (
                      agentsList.map((a) => (
                        <div
                          key={a.id}
                          className={`settings-agent-result-item ${selectedAgent?.id === a.id ? 'selected' : ''}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 8, marginBottom: 6, border: '1px solid #e5e7eb' }}
                        >
                          {a.profilePic ? (
                            <img src={a.profilePic} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8b5cf6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                              {a.name?.charAt(0) ?? 'A'}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>{a.name ?? 'Agent'}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>
                              {a.agentCode}
                              {a.averageRating != null && ` • ★ ${Number(a.averageRating).toFixed(1)} (${a.ratingCount ?? 0})`}
                              {' • '}{a.businessesActivated ?? 0} businesses
                              {a.isOnline && <span style={{ color: '#10b981' }}> • Online</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="settings-btn settings-btn-primary"
                            onClick={() => { setSelectedAgent(a); setBusinessRequestStep('form'); }}
                          >
                            Select
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <div className="settings-modal-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <button
                    type="button"
                    className="settings-btn settings-btn-secondary"
                    onClick={() => { setSelectedAgent(null); setBusinessRequestStep('form'); }}
                  >
                    Continue without agent
                  </button>
                  <button type="button" className="settings-btn settings-btn-secondary" onClick={closeBusinessRequestModal}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {businessRequestStep === 'form' && (
              <form onSubmit={handleSubmitBusinessRequest} className="settings-modal-body">
                {selectedAgent && (
                  <p className="settings-row-desc" style={{ marginBottom: 12, padding: 8, background: '#f0fdf4', borderRadius: 8 }}>
                    Agent: <strong>{selectedAgent.name}</strong> ({selectedAgent.agentCode})
                    <button type="button" className="settings-btn settings-btn-secondary" style={{ marginLeft: 8 }} onClick={() => setBusinessRequestStep('agent')}>
                      Change
                    </button>
                  </p>
                )}
                {businessPlansLoading ? (
                  <SettingsPlansSkeleton rows={3} />
                ) : businessPlans.length > 0 && (
                  <div className="settings-row-desc" style={{ marginBottom: 16 }}>
                    <span style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Choose registration plan (fee)</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {businessPlans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlanId(selectedPlanId === plan.id ? null : plan.id)}
                          className={selectedPlanId === plan.id ? 'settings-btn settings-btn-primary' : 'settings-btn settings-btn-secondary'}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', padding: '10px 14px', minWidth: 140 }}
                        >
                          <span style={{ fontWeight: 600 }}>{plan.name}</span>
                          <span style={{ fontSize: 12, opacity: 0.9 }}>
                            {typeof plan.price === 'number' ? `TZS ${plan.price.toLocaleString()}` : plan.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                {businessRequestError && (
                  <p className="settings-error" role="alert">{businessRequestError}</p>
                )}
                {businessRequestSuccess && (
                  <p className="settings-success" role="status">{businessRequestSuccess}</p>
                )}
                <div className="settings-modal-actions">
                  <button type="button" className="settings-btn settings-btn-secondary" onClick={() => setBusinessRequestStep('agent')}>
                    Back
                  </button>
                  <button type="button" className="settings-btn settings-btn-secondary" onClick={closeBusinessRequestModal}>
                    Cancel
                  </button>
                  <button type="submit" className="settings-btn settings-btn-primary" disabled={businessRequestLoading}>
                    {businessRequestLoading ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {ratePopupAgent && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="rate-agent-title">
          <div className="settings-modal-card" style={{ maxWidth: 400 }}>
            <div className="settings-modal-header">
              <h2 id="rate-agent-title" className="settings-modal-title">Rate your agent</h2>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => { setRatePopupAgent(null); setRateRating(0); setRateComment(''); }}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmitRate} className="settings-modal-body">
              <p className="settings-row-desc" style={{ marginBottom: 12 }}>
                How was your experience with <strong>{ratePopupAgent.name}</strong>?
              </p>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRateRating(n)}
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star size={28} fill={rateRating >= n ? '#f59e0b' : 'none'} stroke="#f59e0b" />
                  </button>
                ))}
              </div>
              <SettingRow label="Comment" description="Optional">
                <textarea
                  className="settings-input"
                  placeholder="Share your experience…"
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </SettingRow>
              <div className="settings-modal-actions">
                <button
                  type="button"
                  className="settings-btn settings-btn-secondary"
                  onClick={() => { setRatePopupAgent(null); setRateRating(0); setRateComment(''); }}
                >
                  Skip
                </button>
                <button type="submit" className="settings-btn settings-btn-primary" disabled={rateRating < 1 || rateLoading}>
                  {rateLoading ? 'Submitting…' : 'Submit rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
