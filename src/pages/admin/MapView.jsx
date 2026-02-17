import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  MapPin,
  User,
  UserCircle,
  Building2,
  Globe,
  ChevronRight,
  BarChart3,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { getMapLocations, getMapStats } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';

// Custom map icons by type
const ICON_STYLES = {
  USER: { bg: '#3b82f6', label: 'U', title: 'User' },
  AGENT: { bg: '#8b5cf6', label: 'A', title: 'Agent' },
  BUSINESS: { bg: '#10b981', label: 'B', title: 'Business' },
};

const TYPE_COLORS = {
  USER: { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', icon: User },
  AGENT: { bg: 'rgba(139, 92, 246, 0.2)', border: '#8b5cf6', icon: UserCircle },
  BUSINESS: { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', icon: Building2 },
};

function createMapIcon(type) {
  const style = ICON_STYLES[type] || ICON_STYLES.USER;
  return L.divIcon({
    className: 'map-marker-custom',
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${style.bg};color:#fff;font-size:12px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    " title="${style.title}">${style.label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const DEFAULT_CENTER = [-6.369, 34.8888];
const DEFAULT_ZOOM = 6;

const TABS = [
  { id: 'map', label: 'Map', icon: MapPin },
  { id: 'continents', label: 'Continents', icon: Globe },
  { id: 'countries', label: 'Countries', icon: BarChart3 },
  { id: 'byType', label: 'By Type', icon: PieChart },
];

export default function MapView() {
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMapLocations();
        if (!cancelled) setLocations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load map locations'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMapStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load map stats'));
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const hasLocations = locations.length > 0;
  const firstLat = hasLocations ? locations[0]?.latitude : null;
  const firstLng = hasLocations ? locations[0]?.longitude : null;
  const center = firstLat != null && firstLng != null ? [firstLat, firstLng] : DEFAULT_CENTER;

  const isLoading = loading || statsLoading;

  if (error) {
    return (
      <div className="admin-card" style={{
        padding: '24px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        color: '#ef4444',
      }}>
        {error}
      </div>
    );
  }

  return (
    <div className="map-view-page">
      {/* Header */}
      <div className="admin-card map-view-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="map-view-header-icon">
            <MapPin size={28} />
          </div>
          <div>
            <h1 className="map-view-title">Map & Location Insights</h1>
            <p className="map-view-subtitle">
              Users, agents & businesses with location • {locations.length} total locations
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="map-view-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`map-view-tab ${activeTab === tab.id ? 'map-view-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Map */}
      {activeTab === 'map' && (
        <div className="admin-card" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
          {loading ? (
            <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}>
              Loading map...
            </div>
          ) : (
            <>
              <div style={{ height: '500px', width: '100%', position: 'relative' }}>
                <MapContainer
                  center={center}
                  zoom={hasLocations ? 10 : DEFAULT_ZOOM}
                  style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {locations.map((loc) => {
                    const type = (loc.type || 'USER').toUpperCase();
                    return (
                      <Marker
                        key={`${type}-${loc.id}`}
                        position={[loc.latitude, loc.longitude]}
                        icon={createMapIcon(type)}
                      >
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              {type === 'BUSINESS' && <Building2 size={18} color="#10b981" />}
                              {type === 'AGENT' && <UserCircle size={18} color="#8b5cf6" />}
                              {type === 'USER' && <User size={18} color="#3b82f6" />}
                              <strong style={{ color: '#1a1a2e' }}>{loc.name}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>{type}</span>
                            </div>
                            {loc.category && <div style={{ color: '#555', fontSize: '0.9rem' }}>{loc.category}</div>}
                            {loc.region && <div style={{ color: '#666', fontSize: '0.85rem' }}>{loc.region}</div>}
                            {loc.country && <div style={{ color: '#666', fontSize: '0.85rem' }}>{loc.country} • {loc.continent}</div>}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
              {!hasLocations && (
                <div className="map-view-empty">
                  No locations with coordinates yet. Locations are captured when users, agents, or businesses register with location.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Continents */}
      {activeTab === 'continents' && (
        <div className="map-view-stats">
          {isLoading ? (
            <div className="map-view-loading">Loading stats...</div>
          ) : stats?.continents?.length > 0 ? (
            <>
              <div className="map-view-summary-cards">
                <div className="map-view-summary-card">
                  <Globe size={24} className="map-view-summary-icon" />
                  <span className="map-view-summary-value">{stats.continents.length}</span>
                  <span className="map-view-summary-label">Continents</span>
                </div>
                <div className="map-view-summary-card">
                  <TrendingUp size={24} className="map-view-summary-icon" />
                  <span className="map-view-summary-value">{stats.total}</span>
                  <span className="map-view-summary-label">Total Locations</span>
                </div>
              </div>
              <div className="map-view-table-card">
                <h3 className="map-view-section-title">Users by Continent</h3>
                <div className="map-view-continent-grid">
                  {stats.continents.map((c, i) => (
                    <div key={c.name} className="map-view-continent-card">
                      <div className="map-view-continent-header">
                        <span className="map-view-continent-rank">#{i + 1}</span>
                        <span className="map-view-continent-name">{c.name}</span>
                        <span className="map-view-continent-total">{c.total}</span>
                      </div>
                      <div className="map-view-continent-bars">
                        <div className="map-view-bar-row" title="Users">
                          <User size={14} style={{ color: '#3b82f6' }} />
                          <div className="map-view-bar-track">
                            <div
                              className="map-view-bar-fill"
                              style={{
                                width: `${c.total ? (c.users / c.total) * 100 : 0}%`,
                                background: '#3b82f6',
                              }}
                            />
                          </div>
                          <span>{c.users}</span>
                        </div>
                        <div className="map-view-bar-row" title="Agents">
                          <UserCircle size={14} style={{ color: '#8b5cf6' }} />
                          <div className="map-view-bar-track">
                            <div
                              className="map-view-bar-fill"
                              style={{
                                width: `${c.total ? (c.agents / c.total) * 100 : 0}%`,
                                background: '#8b5cf6',
                              }}
                            />
                          </div>
                          <span>{c.agents}</span>
                        </div>
                        <div className="map-view-bar-row" title="Businesses">
                          <Building2 size={14} style={{ color: '#10b981' }} />
                          <div className="map-view-bar-track">
                            <div
                              className="map-view-bar-fill"
                              style={{
                                width: `${c.total ? (c.businesses / c.total) * 100 : 0}%`,
                                background: '#10b981',
                              }}
                            />
                          </div>
                          <span>{c.businesses}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="map-view-empty-state">
              <Globe size={48} style={{ opacity: 0.4 }} />
              <p>No continent data yet. Register users, agents & businesses with location.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Countries */}
      {activeTab === 'countries' && (
        <div className="map-view-stats">
          {isLoading ? (
            <div className="map-view-loading">Loading stats...</div>
          ) : stats?.countries?.length > 0 ? (
            <>
              <div className="map-view-summary-cards">
                <div className="map-view-summary-card">
                  <BarChart3 size={24} className="map-view-summary-icon" />
                  <span className="map-view-summary-value">{stats.countries.length}</span>
                  <span className="map-view-summary-label">Countries</span>
                </div>
                <div className="map-view-summary-card">
                  <TrendingUp size={24} className="map-view-summary-icon" />
                  <span className="map-view-summary-value">{stats.total}</span>
                  <span className="map-view-summary-label">Total Locations</span>
                </div>
              </div>
              <div className="map-view-table-card">
                <h3 className="map-view-section-title">Users by Country</h3>
                <div className="map-view-countries-table-wrap">
                  <table className="map-view-countries-table">
                    <thead>
                      <tr>
                        <th>Country</th>
                        <th>Continent</th>
                        <th><User size={14} /> Users</th>
                        <th><UserCircle size={14} /> Agents</th>
                        <th><Building2 size={14} /> Businesses</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.countries.map((c, i) => (
                        <tr key={c.name}>
                          <td>
                            <span className="map-view-country-name">{c.name}</span>
                          </td>
                          <td>
                            <span className="map-view-continent-badge">{c.continent}</span>
                          </td>
                          <td>{c.users}</td>
                          <td>{c.agents}</td>
                          <td>{c.businesses}</td>
                          <td><strong>{c.total}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="map-view-empty-state">
              <BarChart3 size={48} style={{ opacity: 0.4 }} />
              <p>No country data yet. Register users with country set.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: By Type */}
      {activeTab === 'byType' && (
        <div className="map-view-stats">
          {isLoading ? (
            <div className="map-view-loading">Loading stats...</div>
          ) : stats?.byType ? (
            <>
              <div className="map-view-summary-cards">
                <div className="map-view-summary-card">
                  <PieChart size={24} className="map-view-summary-icon" />
                  <span className="map-view-summary-value">{stats.total}</span>
                  <span className="map-view-summary-label">Total Locations</span>
                </div>
              </div>
              <div className="map-view-bytype-grid">
                {['USER', 'AGENT', 'BUSINESS'].map((type) => {
                  const count = stats.byType[type] ?? 0;
                  const pct = stats.total ? ((count / stats.total) * 100).toFixed(1) : 0;
                  const style = TYPE_COLORS[type];
                  const Icon = style?.icon || User;
                  return (
                    <div
                      key={type}
                      className="map-view-type-card"
                      style={{
                        background: style?.bg,
                        borderColor: style?.border,
                      }}
                    >
                      <div className="map-view-type-icon" style={{ color: style?.border }}>
                        <Icon size={32} />
                      </div>
                      <div className="map-view-type-info">
                        <span className="map-view-type-label">{type}</span>
                        <span className="map-view-type-count">{count}</span>
                        <span className="map-view-type-pct">{pct}% of total</span>
                      </div>
                      <ChevronRight size={20} style={{ opacity: 0.5 }} />
                    </div>
                  );
                })}
              </div>
              <div className="map-view-table-card">
                <h3 className="map-view-section-title">Breakdown</h3>
                <div className="map-view-breakdown-list">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    const pct = stats.total ? ((count / stats.total) * 100).toFixed(1) : 0;
                    const style = TYPE_COLORS[type] || TYPE_COLORS.USER;
                    const Icon = style?.icon || User;
                    return (
                      <div key={type} className="map-view-breakdown-row">
                        <Icon size={18} style={{ color: style.border }} />
                        <span>{type}</span>
                        <div className="map-view-breakdown-bar">
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: style.border,
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <span className="map-view-breakdown-value">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="map-view-empty-state">
              <PieChart size={48} style={{ opacity: 0.4 }} />
              <p>No type data yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
