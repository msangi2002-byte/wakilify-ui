import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  Bell,
  Package,
  ChevronRight,
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

export default function MarketplaceSettings() {
  const [prefs, setPrefs] = useState({
    newListings: true,
    priceDrops: true,
    orderUpdates: true,
    promotions: false,
    savedSearches: true,
  });
  const setPref = (key, value) => setPrefs((s) => ({ ...s, [key]: value }));

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="settings-header-breadcrumb">
          <Link to="/app/shop" className="settings-breadcrumb-link">
            Marketplace
          </Link>
          <ChevronRight size={16} className="settings-breadcrumb-sep" />
          <span>Settings</span>
        </div>
        <h1 className="settings-title">Marketplace settings</h1>
        <p className="settings-subtitle">Preferences for shopping and selling</p>
      </header>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <Bell size={20} />
          Notifications
        </h2>
        <SettingRow
          label="New listings"
          description="When sellers you follow list new items"
        >
          <Toggle
            checked={prefs.newListings}
            onChange={(v) => setPref('newListings', v)}
            ariaLabel="New listings notifications"
          />
        </SettingRow>
        <SettingRow
          label="Price drops"
          description="When items in your wishlist go on sale"
        >
          <Toggle
            checked={prefs.priceDrops}
            onChange={(v) => setPref('priceDrops', v)}
            ariaLabel="Price drop notifications"
          />
        </SettingRow>
        <SettingRow
          label="Order updates"
          description="Shipping and delivery status for your orders"
        >
          <Toggle
            checked={prefs.orderUpdates}
            onChange={(v) => setPref('orderUpdates', v)}
            ariaLabel="Order update notifications"
          />
        </SettingRow>
        <SettingRow
          label="Promotions"
          description="Deals and offers from sellers you follow"
        >
          <Toggle
            checked={prefs.promotions}
            onChange={(v) => setPref('promotions', v)}
            ariaLabel="Promotion notifications"
          />
        </SettingRow>
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <MapPin size={20} />
          Shipping & addresses
        </h2>
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
        <div className="settings-section-actions">
          <button type="button" className="settings-btn settings-btn-secondary">
            Manage addresses
          </button>
        </div>
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <CreditCard size={20} />
          Payment methods
        </h2>
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
            Manage payment methods
          </button>
        </div>
      </section>

      <section className="user-app-card settings-section">
        <h2 className="settings-section-title">
          <Package size={20} />
          Buying & selling
        </h2>
        <SettingRow
          label="Saved searches"
          description="Get notified when new items match your saved searches"
        >
          <Toggle
            checked={prefs.savedSearches}
            onChange={(v) => setPref('savedSearches', v)}
            ariaLabel="Saved search notifications"
          />
        </SettingRow>
        <div className="settings-section-actions">
          <Link to="/app/shop" className="settings-btn settings-btn-primary" style={{ textDecoration: 'none' }}>
            Browse marketplace
          </Link>
        </div>
      </section>
    </div>
  );
}
