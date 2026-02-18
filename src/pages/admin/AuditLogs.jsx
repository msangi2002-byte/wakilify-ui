import { useState, useEffect, useCallback } from 'react';
import {
  FileText as FileTextIcon,
  Search,
  Shield,
  Clock,
  User,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Activity,
  Layers,
  List,
  Calendar,
  X,
} from 'lucide-react';
import { getAdminAuditLogs, getAuditLogsByRange } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const VIEW_TABS = [
  { id: 'all', label: 'All Activity', icon: List },
  { id: 'entity', label: 'By Entity Type', icon: Layers },
  { id: 'action', label: 'By Action', icon: Activity },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
];

function getDateGroup(createdAt) {
  if (!createdAt) return 'Other';
  const d = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const dTime = d.getTime();
  if (dTime >= today.getTime()) return 'Today';
  if (dTime >= yesterday.getTime()) return 'Yesterday';
  if (dTime >= weekStart.getTime()) return 'This week';
  return 'Older';
}

function getActionColor(action) {
  if (!action) return { bg: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa' };
  if (action.includes('ACTIVATED') || action.includes('APPROVED') || action.includes('VERIFIED') || action.includes('COMPLETED')) return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
  if (action.includes('REJECTED') || action.includes('DEACTIVATED') || action.includes('FAILED')) return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
  if (action.includes('CHANGED') || action.includes('UPDATED')) return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
  if (action.includes('PROMOTION')) return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' };
  if (action.includes('WITHDRAWAL')) return { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' };
  return { bg: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa' };
}

function getEntityIcon(entityType) {
  switch ((entityType || '').toUpperCase()) {
    case 'USER': return User;
    case 'BUSINESS': return Layers;
    case 'AGENT': return User;
    case 'WITHDRAWAL': return FileTextIcon;
    case 'PROMOTION': return Activity;
    default: return Shield;
  }
}

export default function AuditLogs() {
  const [viewTab, setViewTab] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(100);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchAction, setSearchAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      let response;
      if (startDate && endDate) {
        const startISO = new Date(startDate + 'T00:00:00').toISOString();
        const endISO = new Date(endDate + 'T23:59:59.999').toISOString();
        response = await getAuditLogsByRange(startISO, endISO, page, size);
      } else {
        response = await getAdminAuditLogs({ page, size });
      }
      setLogs(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load audit logs'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, size, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';

  const filteredLogs = searchAction
    ? logs.filter((log) => (log.action || '').toLowerCase().includes(searchAction.toLowerCase()))
    : logs;

  const groupedByEntity = filteredLogs.reduce((acc, log) => {
    const key = log.entityType || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const groupedByAction = filteredLogs.reduce((acc, log) => {
    const key = log.action || 'OTHER';
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const groupedByTimeline = filteredLogs.reduce((acc, log) => {
    const key = getDateGroup(log.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const timelineOrder = ['Today', 'Yesterday', 'This week', 'Older'];

  const toggleGroup = (view, key) => {
    setExpandedGroups((prev) => ({ ...prev, [`${view}-${key}`]: !prev[`${view}-${key}`] }));
  };

  const LogCard = ({ log, compact }) => {
    const actionStyle = getActionColor(log.action);
    const EntityIcon = getEntityIcon(log.entityType);
    return (
      <div
        style={{
          padding: compact ? 12 : 16,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onClick={() => setDetailModal(log)}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: actionStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: actionStyle.color, flexShrink: 0 }}>
              <EntityIcon size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{log.action}</span>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginTop: 2 }}>
                {log.entityType} {log.entityId && <span style={{ color: '#a78bfa' }}>· {String(log.entityId).slice(0, 8)}...</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {log.user && (
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{log.user.name}</span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
              <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {formatDate(log.createdAt)}
            </span>
          </div>
        </div>
        {!compact && log.details && (
          <div style={{ marginTop: 10, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
            {log.details}
          </div>
        )}
      </div>
    );
  };

  const GroupSection = ({ title, items, view, groupKey }) => {
    const isExpanded = expandedGroups[`${view}-${groupKey}`] !== false;
    return (
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => toggleGroup(view, groupKey)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: 10,
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            {title}
          </span>
          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem' }}>{items.length}</span>
        </button>
        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 8 }}>
            {items.map((log) => (
              <LogCard key={log.id} log={log} compact={false} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>Audit Logs &amp; Activity</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>Full system activity: every admin action with full details and analysis</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => loadLogs(true)}
              disabled={refreshing}
              className="admin-btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={18} className={refreshing ? 'admin-icon-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <FileTextIcon size={28} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {VIEW_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewTab(id)}
              className={viewTab === id ? 'admin-btn-primary' : 'admin-btn-ghost'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
            <input
              type="text"
              placeholder="Search by action..."
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.875rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: '0.875rem' }}
            />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: '0.875rem' }}
            />
            <button
              type="button"
              onClick={() => { setPage(0); loadLogs(true); }}
              className="admin-btn-primary"
              style={{ padding: '8px 16px' }}
            >
              Apply
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', marginBottom: 16 }}>{error}</div>
        )}

        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: 16 }}>
          Total: {totalElements} logs {searchAction && `(filtered: ${filteredLogs.length})`}
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.7)' }}>Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.7)' }}>No audit logs found</div>
        ) : viewTab === 'all' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredLogs.map((log) => (
              <LogCard key={log.id} log={log} compact={false} />
            ))}
          </div>
        ) : viewTab === 'entity' ? (
          <div>
            {Object.entries(groupedByEntity)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([entityType, items]) => (
                <GroupSection key={entityType} title={entityType} items={items} view="entity" groupKey={entityType} />
              ))}
          </div>
        ) : viewTab === 'action' ? (
          <div>
            {Object.entries(groupedByAction)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([action, items]) => (
                <GroupSection key={action} title={action.replace(/_/g, ' ')} items={items} view="action" groupKey={action} />
              ))}
          </div>
        ) : (
          <div>
            {timelineOrder.filter((k) => groupedByTimeline[k]?.length).map((key) => (
              <GroupSection key={key} title={key} items={groupedByTimeline[key]} view="timeline" groupKey={key} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Page {page + 1} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="admin-btn-ghost">Previous</button>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="admin-btn-ghost">Next</button>
            </div>
          </div>
        )}
      </div>

      {detailModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
          onClick={() => setDetailModal(null)}
        >
          <div
            className="admin-card"
            style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailModal(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>Activity details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Action</span>
                <span style={{ color: getActionColor(detailModal.action).color, fontWeight: 600 }}>{detailModal.action}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Entity type</span>
                <span style={{ color: '#fff' }}>{detailModal.entityType || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Entity ID</span>
                <code style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{detailModal.entityId || 'N/A'}</code>
              </div>
              {detailModal.user && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Admin user</span>
                  <span style={{ color: '#fff' }}>{detailModal.user.name} ({detailModal.user.role})</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Time</span>
                <span style={{ color: '#fff' }}>{formatDate(detailModal.createdAt)}</span>
              </div>
              {detailModal.details && (
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Details</span>
                  <div style={{ padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{detailModal.details}</div>
                </div>
              )}
              {detailModal.oldValues && (
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Old value</span>
                  <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem', wordBreak: 'break-all' }}>{detailModal.oldValues}</div>
                </div>
              )}
              {detailModal.newValues && (
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>New value</span>
                  <div style={{ padding: 12, background: 'rgba(16,185,129,0.1)', borderRadius: 8, color: '#34d399', fontSize: '0.85rem', wordBreak: 'break-all' }}>{detailModal.newValues}</div>
                </div>
              )}
              {detailModal.ipAddress && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>IP</span>
                  <code style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{detailModal.ipAddress}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
