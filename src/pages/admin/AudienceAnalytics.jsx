import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Heart,
  MapPin,
  Users,
  Zap,
  ShoppingCart,
  MessageCircle,
  ThumbsUp,
} from 'lucide-react';
import { getAudienceAnalytics } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const TABS = [
  { id: 'interests', label: 'By Interests', icon: Heart },
  { id: 'location', label: 'By Location', icon: MapPin },
  { id: 'demographics', label: 'By Demographics', icon: Users },
  { id: 'behaviors', label: 'By Behaviors', icon: Zap },
];

function StatCard({ label, value, icon: Icon, sub }) {
  return (
    <div className="admin-audience-stat-card">
      <div className="admin-audience-stat-icon">
        <Icon size={24} />
      </div>
      <div className="admin-audience-stat-content">
        <span className="admin-audience-stat-value">{value?.toLocaleString?.() ?? value}</span>
        <span className="admin-audience-stat-label">{label}</span>
        {sub != null && <span className="admin-audience-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

function InterestGrid({ items }) {
  if (!items?.length) return <p className="admin-audience-empty">No interests data.</p>;
  return (
    <div className="admin-audience-grid">
      {items.map(({ interest, count }) => (
        <div key={interest} className="admin-audience-tile">
          <span className="admin-audience-tile-label">{interest}</span>
          <span className="admin-audience-tile-value">{count.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function LocationTabs({ byCountry, byRegion, byCity }) {
  const [active, setActive] = useState('country');
  const data = active === 'country' ? byCountry : active === 'region' ? byRegion : byCity;
  const label = active === 'country' ? 'Country' : active === 'region' ? 'Region' : 'City';

  return (
    <div className="admin-audience-location">
      <div className="admin-audience-tabs-inline">
        {[
          { id: 'country', label: 'Country', data: byCountry },
          { id: 'region', label: 'Region', data: byRegion },
          { id: 'city', label: 'City', data: byCity },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`admin-audience-tab-btn ${active === id ? 'active' : ''}`}
            onClick={() => setActive(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {data?.length ? (
        <div className="admin-audience-grid">
          {data.map(({ name, count }) => (
            <div key={name} className="admin-audience-tile">
              <span className="admin-audience-tile-label">{name}</span>
              <span className="admin-audience-tile-value">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="admin-audience-empty">No {label.toLowerCase()} data.</p>
      )}
    </div>
  );
}

function DemographicsPanel({ byAgeBand, byGender }) {
  return (
    <div className="admin-audience-demographics">
      <section className="admin-audience-section">
        <h4>Age bands</h4>
        {byAgeBand?.length ? (
          <div className="admin-audience-grid admin-audience-grid-sm">
            {byAgeBand.map(({ bucket, count }) => (
              <div key={bucket} className="admin-audience-tile">
                <span className="admin-audience-tile-label">{bucket}</span>
                <span className="admin-audience-tile-value">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-audience-empty">No age data.</p>
        )}
      </section>
      <section className="admin-audience-section">
        <h4>Gender</h4>
        {byGender?.length ? (
          <div className="admin-audience-grid">
            {byGender.map(({ bucket, count }) => (
              <div key={bucket} className="admin-audience-tile">
                <span className="admin-audience-tile-label">{bucket}</span>
                <span className="admin-audience-tile-value">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="admin-audience-empty">No gender data.</p>
        )}
      </section>
    </div>
  );
}

function BehaviorsPanel({ items }) {
  const icons = {
    'Online shoppers': ShoppingCart,
    'Engaged (reactions)': ThumbsUp,
    'Engaged (comments)': MessageCircle,
  };
  if (!items?.length) return <p className="admin-audience-empty">No behavior data.</p>;
  return (
    <div className="admin-audience-grid admin-audience-behaviors">
      {items.map(({ behavior, count }) => {
        const Icon = icons[behavior] || Zap;
        return (
          <div key={behavior} className="admin-audience-tile admin-audience-tile-behavior">
            <Icon size={20} className="admin-audience-behavior-icon" />
            <span className="admin-audience-tile-label">{behavior}</span>
            <span className="admin-audience-tile-value">{count.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AudienceAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('interests');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAudienceAnalytics();
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load audience analytics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="admin-audience-page">
        <div className="admin-card">
          <div className="admin-loading-placeholder">Loading audience analytics…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-audience-page">
        <div className="admin-card admin-card-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const total = data?.totalUsers ?? 0;

  return (
    <div className="admin-audience-page">
      <div className="admin-audience-header">
        <div className="admin-audience-title">
          <Target size={28} />
          <h1>Audience Analytics</h1>
        </div>
        <p className="admin-audience-subtitle">
          Insights for promotion targeting: interests, location, demographics, and behaviors.
        </p>
      </div>

      <div className="admin-audience-stats">
        <StatCard label="Total users" value={total} icon={Users} />
        <StatCard
          label="Online shoppers"
          value={data?.byBehaviors?.find((b) => b.behavior === 'Online shoppers')?.count ?? 0}
          icon={ShoppingCart}
        />
        <StatCard
          label="Engaged (reactions)"
          value={data?.byBehaviors?.find((b) => b.behavior === 'Engaged (reactions)')?.count ?? 0}
          icon={ThumbsUp}
        />
        <StatCard
          label="Engaged (comments)"
          value={data?.byBehaviors?.find((b) => b.behavior === 'Engaged (comments)')?.count ?? 0}
          icon={MessageCircle}
        />
      </div>

      <div className="admin-card admin-audience-card">
        <div className="admin-audience-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-audience-tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="admin-audience-content">
          {activeTab === 'interests' && <InterestGrid items={data?.byInterests} />}
          {activeTab === 'location' && (
            <LocationTabs
              byCountry={data?.byCountry}
              byRegion={data?.byRegion}
              byCity={data?.byCity}
            />
          )}
          {activeTab === 'demographics' && (
            <DemographicsPanel byAgeBand={data?.byAgeBand} byGender={data?.byGender} />
          )}
          {activeTab === 'behaviors' && <BehaviorsPanel items={data?.byBehaviors} />}
        </div>
      </div>
    </div>
  );
}
