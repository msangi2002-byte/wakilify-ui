import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore, setUI, subscribeUI } from '@/store/ui.store';
import {
  User,
  Eye,
  EyeOff,
  Bell,
  Moon,
  Sun,
  Shield,
  Trash2,
  ShoppingBag,
  MapPin,
  CreditCard,
  Package,
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

  const displayName = user?.name ?? '';
  const displayEmail = user?.email ?? '';

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account and preferences</p>
      </header>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <User size={20} />
          Account
        </h2>
        <SettingRow label="Display name" description="Name shown on your profile">
          <input
            type="text"
            className="settings-input"
            defaultValue={displayName}
            placeholder="Your name"
            aria-label="Display name"
          />
        </SettingRow>
        <SettingRow label="Email" description="Used for login and notifications">
          <input
            type="email"
            className="settings-input"
            defaultValue={displayEmail}
            placeholder="you@example.com"
            aria-label="Email"
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
        <div className="settings-section-actions">
          <button type="button" className="settings-btn settings-btn-primary">
            Save changes
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
          <select className="settings-select" aria-label="Profile visibility">
            <option value="public">Everyone</option>
            <option value="friends">Friends only</option>
            <option value="private">Only me</option>
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
    </div>
  );
}
