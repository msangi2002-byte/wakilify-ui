import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Building2, MapPin, User, UserCircle } from 'lucide-react';
import { getMapLocations } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';

// Custom map icons by type: USER, AGENT, BUSINESS (no image files needed)
const ICON_STYLES = {
  USER:   { bg: '#3b82f6', label: 'U', title: 'User' },    // blue
  AGENT:  { bg: '#8b5cf6', label: 'A', title: 'Agent' },   // violet
  BUSINESS: { bg: '#10b981', label: 'B', title: 'Business' }, // emerald
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

const DEFAULT_CENTER = [-6.3690, 34.8888]; // Tanzania center
const DEFAULT_ZOOM = 6;

export default function MapView() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="admin-card" style={{ textAlign: 'center', padding: '64px', color: 'rgba(255,255,255,0.7)' }}>
        Loading map...
      </div>
    );
  }

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

  const hasLocations = locations.length > 0;
  const firstLat = hasLocations ? locations[0]?.latitude : null;
  const firstLng = hasLocations ? locations[0]?.longitude : null;
  const center = firstLat != null && firstLng != null ? [firstLat, firstLng] : DEFAULT_CENTER;

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(124, 58, 237, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed',
          }}>
            <MapPin size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>
              Map View
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0, fontSize: '0.9rem' }}>
              Users, agents & businesses with location (from registration) • {locations.length} locations
            </p>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ overflow: 'hidden', padding: 0, position: 'relative' }}>
        <div style={{ height: '500px', width: '100%', position: 'relative' }}>
          <MapContainer
            center={center}
            zoom={hasLocations ? 10 : DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                    <div style={{ minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {type === 'BUSINESS' && <Building2 size={18} color="#10b981" />}
                        {type === 'AGENT' && <UserCircle size={18} color="#8b5cf6" />}
                        {type === 'USER' && <User size={18} color="#3b82f6" />}
                        <strong style={{ color: '#1a1a2e' }}>{loc.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>{type}</span>
                      </div>
                      {loc.category && <div style={{ color: '#555', fontSize: '0.9rem' }}>{loc.category}</div>}
                      {loc.region && <div style={{ color: '#666', fontSize: '0.85rem' }}>{loc.region}</div>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        {locations.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '24px',
            background: 'rgba(26, 26, 46, 0.95)',
            color: 'rgba(255,255,255,0.7)',
            borderRadius: '12px',
            textAlign: 'center',
            zIndex: 1000,
          }}>
            No locations with coordinates yet. Locations are captured automatically when users register, agents register, or businesses are activated (with location permission).
          </div>
        )}
      </div>
    </div>
  );
}
