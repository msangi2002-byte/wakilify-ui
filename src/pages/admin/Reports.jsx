import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText as FileTextIcon, AlertTriangle, CheckCircle, XCircle, Shield, RefreshCw, Clock, CheckCircle2, Ban, Eye } from 'lucide-react';
import { getAdminReports, getAdminReportsByType, resolveReport, dismissReport } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const STATUS_TABS = [
  { id: 'PENDING', label: 'Pending', icon: Clock },
  { id: 'UNDER_REVIEW', label: 'Under review', icon: Eye },
  { id: 'RESOLVED', label: 'Resolved', icon: CheckCircle2 },
  { id: 'DISMISSED', label: 'Dismissed', icon: Ban },
];

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') || 'PENDING';
  const urlType = searchParams.get('type') || '';
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [typeFilter, setTypeFilter] = useState(urlType);
  const [refreshing, setRefreshing] = useState(false);

  const setStatus = (status) => {
    setStatusFilter(status);
    setPage(0);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('status', status);
      if (!urlType && typeFilter) next.set('type', typeFilter);
      return next;
    });
  };

  const setType = (type) => {
    setTypeFilter(type);
    setPage(0);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('status', statusFilter);
      if (type) next.set('type', type);
      else next.delete('type');
      return next;
    });
  };

  useEffect(() => {
    setStatusFilter(urlStatus);
    setTypeFilter(urlType);
    setPage(0);
  }, [urlStatus, urlType]);

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size,
        status: statusFilter || 'PENDING',
      };
      const response = typeFilter
        ? await getAdminReportsByType(typeFilter, params)
        : await getAdminReports(params);
      setReports(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load reports'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, size, statusFilter, typeFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolve = async (reportId, action = 'DELETE_CONTENT', notes = 'Content removed by admin') => {
    try {
      await resolveReport(reportId, { notes, action });
      loadReports();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to resolve report'));
    }
  };

  const handleDismiss = async (reportId, reason = 'Report dismissed - no violation found') => {
    try {
      await dismissReport(reportId, reason);
      loadReports();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to dismiss report'));
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' };
      case 'UNDER_REVIEW':
        return { bg: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa' };
      case 'RESOLVED':
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'DISMISSED':
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' };
      default:
        return { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
    }
  };

  const getReasonStyle = (reason) => {
    const styles = {
      SPAM: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
      HARASSMENT: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
      FALSE_INFO: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
      INAPPROPRIATE: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)' },
      SCAM: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.2)' },
      OTHER: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' },
    };
    return styles[reason] || { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' };
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Reports Management
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Review and manage user reports
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => loadReports(true)}
              disabled={refreshing}
              className="admin-btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={18} className={refreshing ? 'admin-icon-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(124, 58, 237, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed'
            }}>
              <FileTextIcon size={28} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {STATUS_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatus(id)}
              className={statusFilter === id ? 'admin-btn-primary' : 'admin-btn-ghost'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Types</option>
            <option value="POST">Post</option>
            <option value="USER">User</option>
            <option value="BUSINESS">Business</option>
            <option value="PRODUCT">Product</option>
            <option value="COMMENT">Comment</option>
            <option value="MESSAGE">Message</option>
          </select>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '24px',
          }}>
            {error}
          </div>
        )}
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            No reports found
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="admin-card-title">Reports List</h2>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                Total: {totalElements} reports
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reports.map((report) => {
                const statusStyle = getStatusBadgeColor(report.status);
                const reporterId = report?.reporter?.id ? String(report.reporter.id) : null;
                
                const reasonStyle = getReasonStyle(report.reason);
                return (
                  <div
                    key={report.id}
                    style={{
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <AlertTriangle size={20} style={{ color: reasonStyle.color }} />
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600, marginBottom: '4px' }}>
                              {report.type || report.targetType} Report
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: reasonStyle.bg,
                                color: reasonStyle.color,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}>
                                {report.reason}
                              </span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}>
                                <Shield size={10} />
                                {report.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        {report.description && (
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginTop: '8px', padding: '12px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
                            {report.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        Reported by: {reporterId ? (
                          <Link to={`/app/profile/${reporterId}`} style={{ color: 'rgba(124, 58, 237, 0.8)', textDecoration: 'none' }}>
                            {report.reporter?.name || 'Unknown'}
                          </Link>
                        ) : 'Unknown'}
                        {' • '}
                        {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                      </div>
                      {report.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="admin-btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                          >
                            <CheckCircle size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
                            Resolve
                          </button>
                          <button
                            onClick={() => handleDismiss(report.id)}
                            className="admin-btn-ghost"
                            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                          >
                            <XCircle size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="admin-btn-ghost"
                  style={{ opacity: page === 0 ? 0.5 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="admin-btn-ghost"
                  style={{ opacity: page >= totalPages - 1 ? 0.5 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
