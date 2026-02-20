import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  Save,
  Loader2,
  AlertTriangle,
  Navigation,
  CheckCircle,
} from 'lucide-react';
import { getAgentBusinessRequestById, updateBusinessRequestDetails, approveBusinessRequest } from '@/lib/api/agent';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { AgentRequestDetailSkeleton } from '@/components/ui/agent/AgentRequestDetailSkeleton';
import 'leaflet/dist/leaflet.css';
import '@/styles/agent.css';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: request, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['agent', 'business-request', id],
    queryFn: () => getAgentBusinessRequestById(id),
    enabled: !!id,
  });
  const [detailsForm, setDetailsForm] = useState({
    nidaNumber: '',
    tinNumber: '',
    companyName: '',
    idDocumentUrl: '',
    idBackDocumentUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState('');
  const error = queryError ? getApiErrorMessage(queryError, 'Failed to load request') : '';

  useEffect(() => {
    if (request) {
      setDetailsForm({
        nidaNumber: request.nidaNumber ?? '',
        tinNumber: request.tinNumber ?? '',
        companyName: request.companyName ?? '',
        idDocumentUrl: request.idDocumentUrl ?? '',
        idBackDocumentUrl: request.idBackDocumentUrl ?? '',
      });
    }
  }, [request]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      await updateBusinessRequestDetails(id, detailsForm);
      setSaveSuccess('Details saved.');
      queryClient.setQueryData(['agent', 'business-request', id], (prev) => (prev ? { ...prev, ...detailsForm } : prev));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true);
    setApproveSuccess('');
    setError('');
    try {
      const updated = await approveBusinessRequest(id);
      queryClient.setQueryData(['agent', 'business-request', id], updated);
      queryClient.invalidateQueries({ queryKey: ['agent', 'business-requests'] });
      setApproveSuccess('Business registered successfully. User is now a business.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to approve'));
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return <AgentRequestDetailSkeleton />;
  }
  if (error && !request) {
    return (
      <div className="agent-dashboard agent-dashboard-cards">
        <div className="agent-dashboard-card-alert agent-dashboard-card-alert-error" style={{ margin: 24 }}>
          <AlertTriangle size={20} /> {error}
        </div>
        <Link to="/agent/requests" className="agent-btn-secondary" style={{ marginLeft: 24 }}><ArrowLeft size={18} /> Back to requests</Link>
      </div>
    );
  }
  if (!request) return null;

  const userLat = request.userLatitude ?? null;
  const userLng = request.userLongitude ?? null;
  const agentLat = request.agentLatitude ?? null;
  const agentLng = request.agentLongitude ?? null;
  const hasUserLoc = userLat != null && userLng != null;
  const hasAgentLoc = agentLat != null && agentLng != null;
  const distanceKm = hasUserLoc && hasAgentLoc
    ? haversineKm(agentLat, agentLng, userLat, userLng).toFixed(1)
    : null;
  const mapCenter = hasUserLoc ? [userLat, userLng] : hasAgentLoc ? [agentLat, agentLng] : [-6.369, 34.8888];
  const mapZoom = hasUserLoc && hasAgentLoc ? 10 : 6;

  return (
    <div className="agent-dashboard agent-dashboard-cards agent-request-detail-page">
      <div className="agent-dashboard-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Link to="/agent/requests" className="agent-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 className="agent-dashboard-title" style={{ margin: 0 }}>Request details</h1>
        </div>

        <div className="agent-request-detail-grid">
          <section className="agent-dashboard-card" style={{ padding: 16 }}>
            <h2 className="agent-dashboard-card-heading" style={{ marginBottom: 12 }}>
              <User size={20} /> User & business
            </h2>
            <div className="agent-request-details">
              <div className="agent-request-row"><strong>Business:</strong> {request.businessName}</div>
              <div className="agent-request-row"><strong>User:</strong> {request.userName ?? '—'}</div>
              <div className="agent-request-row">
                <strong>Phone:</strong>{' '}
                <a href={`tel:${request.userPhone ?? request.ownerPhone ?? ''}`} style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>
                  <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {request.userPhone ?? request.ownerPhone ?? '—'}
                </a>
                {' '}(call to arrange visit)
              </div>
              {request.category && <div className="agent-request-row"><strong>Category:</strong> {request.category}</div>}
              {(request.region || request.district || request.ward || request.street) && (
                <div className="agent-request-row">
                  <strong><MapPin size={14} style={{ verticalAlign: 'middle' }} /> Location:</strong>{' '}
                  {[request.region, request.district, request.ward, request.street].filter(Boolean).join(', ')}
                </div>
              )}
              {request.createdAt && <div className="agent-request-row"><strong>Requested:</strong> {formatDate(request.createdAt)}</div>}
              <div className="agent-request-row">
                <span className={`agent-request-status ${request.status === 'PENDING' ? 'agent-request-status-pending' : request.status === 'PAID' ? 'agent-request-status-paid' : 'agent-request-status-approved'}`}>
                  {request.status}
                </span>
                {request.status === 'PENDING' && <span style={{ display: 'block', fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>Visit user, then approve to complete registration</span>}
                {request.status === 'PAID' && <span style={{ display: 'block', fontSize: 12, color: 'var(--gray-600)', marginTop: 4 }}>User has paid – visit and approve to complete registration</span>}
              </div>
              {(request.status === 'PENDING' || request.status === 'PAID') && (
                <div className="agent-request-row" style={{ marginTop: 12 }}>
                  <button type="button" className="agent-btn-primary" onClick={handleApprove} disabled={approving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {approving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={18} />}
                    {approving ? 'Approving…' : 'Approve & complete registration'}
                  </button>
                  {approveSuccess && <span className="agent-dashboard-card-alert-success" style={{ display: 'block', marginTop: 8 }}>{approveSuccess}</span>}
                </div>
              )}
            </div>
          </section>

          <section className="agent-dashboard-card" style={{ padding: 16 }}>
            <h2 className="agent-dashboard-card-heading" style={{ marginBottom: 12 }}>
              <MapPin size={20} /> Map & distance
            </h2>
            {distanceKm != null && (
              <p style={{ marginBottom: 12, fontSize: 15, fontWeight: 600 }}>
                Distance from you: <strong>{distanceKm} km</strong>
              </p>
            )}
            {hasUserLoc && hasAgentLoc && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${agentLat},${agentLng}&destination=${userLat},${userLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="agent-btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}
              >
                <Navigation size={18} />
                Get directions (Google Maps)
              </a>
            )}
            {(!hasUserLoc && !hasAgentLoc) && (
              <p className="agent-stat-label">No location data. User can share location when requesting; agent location from profile.</p>
            )}
            <div style={{ height: 280, borderRadius: 8, overflow: 'hidden' }}>
              <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hasUserLoc && (
                  <Marker
                    position={[userLat, userLng]}
                    icon={L.divIcon({
                      className: 'request-detail-marker',
                      html: '<div style="width:24px;height:24px;border-radius:50%;background:#10b981;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">U</div>',
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    })}
                  >
                    <Popup>User / business location</Popup>
                  </Marker>
                )}
                {hasAgentLoc && (
                  <Marker
                    position={[agentLat, agentLng]}
                    icon={L.divIcon({
                      className: 'request-detail-marker',
                      html: '<div style="width:24px;height:24px;border-radius:50%;background:#8b5cf6;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;">A</div>',
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    })}
                  >
                    <Popup>Your location (agent)</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </section>
        </div>

        <section className="agent-dashboard-card" style={{ padding: 16, marginTop: 16 }}>
          <h2 className="agent-dashboard-card-heading" style={{ marginBottom: 12 }}>
            <FileText size={20} /> Details from user (after visit)
          </h2>
          <p className="agent-stat-label" style={{ marginBottom: 16 }}>
            Fill after meeting the user: NIDA number, TIN, company name, ID document links (e.g. after uploading elsewhere).
          </p>
          <form onSubmit={handleSaveDetails} className="agent-requests-form agent-requests-form-cols">
            <div className="agent-form-field">
              <label className="agent-label">NIDA number</label>
              <input
                type="text"
                className="agent-input"
                placeholder="National ID number"
                value={detailsForm.nidaNumber}
                onChange={(e) => setDetailsForm((f) => ({ ...f, nidaNumber: e.target.value }))}
              />
            </div>
            <div className="agent-form-field">
              <label className="agent-label">TIN number</label>
              <input
                type="text"
                className="agent-input"
                placeholder="Tax ID"
                value={detailsForm.tinNumber}
                onChange={(e) => setDetailsForm((f) => ({ ...f, tinNumber: e.target.value }))}
              />
            </div>
            <div className="agent-form-field agent-form-field-full">
              <label className="agent-label">Company / business legal name</label>
              <input
                type="text"
                className="agent-input"
                placeholder="As per registration"
                value={detailsForm.companyName}
                onChange={(e) => setDetailsForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </div>
            <div className="agent-form-field agent-form-field-full">
              <label className="agent-label">ID document (front) URL</label>
              <input
                type="url"
                className="agent-input"
                placeholder="https://… (upload elsewhere and paste link)"
                value={detailsForm.idDocumentUrl}
                onChange={(e) => setDetailsForm((f) => ({ ...f, idDocumentUrl: e.target.value }))}
              />
            </div>
            <div className="agent-form-field agent-form-field-full">
              <label className="agent-label">ID document (back) URL</label>
              <input
                type="url"
                className="agent-input"
                placeholder="https://…"
                value={detailsForm.idBackDocumentUrl}
                onChange={(e) => setDetailsForm((f) => ({ ...f, idBackDocumentUrl: e.target.value }))}
              />
            </div>
            {error && <div className="agent-dashboard-card-alert agent-dashboard-card-alert-error" role="alert"><AlertTriangle size={18} /> {error}</div>}
            {saveSuccess && <div className="agent-dashboard-card-alert agent-dashboard-card-alert-success" role="status">{saveSuccess}</div>}
            <button type="submit" className="agent-btn-primary" disabled={saving}>
              {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
              {saving ? ' Saving…' : ' Save details'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
