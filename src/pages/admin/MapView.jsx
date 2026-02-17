import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Building2, MapPin } from 'lucide-react';
import { getMapLocations } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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
              Businesses with location on OpenStreetMap • {locations.length} locations
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
            {locations.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Building2 size={18} color="#7c3aed" />
                      <strong style={{ color: '#1a1a2e' }}>{loc.name}</strong>
                    </div>
                    {loc.category && <div style={{ color: '#555', fontSize: '0.9rem' }}>{loc.category}</div>}
                    {loc.region && <div style={{ color: '#666', fontSize: '0.85rem' }}>{loc.region}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
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
            No businesses with coordinates yet. Add latitude/longitude to businesses to see them on the map.
          </div>
        )}
      </div>
    </div>
  );
}
