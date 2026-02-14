import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck as UserCheckIcon, Search, Eye, Shield, CheckCircle, XCircle, DollarSign, Building2 } from 'lucide-react';
import { getAdminAgents, updateAgentStatus, verifyAgent } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      };
      const response = await getAdminAgents(params);
      setAgents(response?.content || []);
      setTotalPages(response?.totalPages || 0);
      setTotalElements(response?.totalElements || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load agents'));
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter, searchTerm]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadAgents();
  };

  const handleStatusChange = async (agentId, newStatus) => {
    try {
      await updateAgentStatus(agentId, newStatus);
      loadAgents();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update agent status'));
    }
  };

  const handleVerify = async (agentId) => {
    try {
      await verifyAgent(agentId);
      loadAgents();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to verify agent'));
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'PENDING':
        return { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' };
      case 'SUSPENDED':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
      case 'INACTIVE':
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' };
      default:
        return { bg: 'rgba(124, 58, 237, 0.2)', color: '#7c3aed' };
    }
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Agents Management
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Manage and view all agents in the system
            </p>
          </div>
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
            <UserCheckIcon size={28} />
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search by agent code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(124, 58, 237, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            type="submit"
            className="admin-btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            <Search size={18} />
            Search
          </button>
        </form>

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
            Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            No agents found
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="admin-card-title">Agents List</h2>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                Total: {totalElements} agents
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Agent
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Code
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Performance
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Created
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => {
                    const statusStyle = getStatusBadgeColor(agent.status);
                    const userId = agent?.user?.id ? String(agent.user.id) : null;
                    
                    return (
                      <tr
                        key={agent.id || Math.random()}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '16px',
                              overflow: 'hidden',
                            }}>
                              {agent.user?.profilePic ? (
                                <img src={agent.user.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                (agent.user?.name || 'A').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div style={{ color: '#fff', fontWeight: 500, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {agent.user?.name || 'Unknown Agent'}
                                {agent.isVerified && (
                                  <CheckCircle size={16} style={{ color: '#3b82f6', display: 'inline-block' }} />
                                )}
                              </div>
                              {userId && (
                                <Link
                                  to={`/app/profile/${userId}`}
                                  style={{ color: 'rgba(124, 58, 237, 0.8)', fontSize: '0.75rem', textDecoration: 'none' }}
                                >
                                  View Profile
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ color: '#fff', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {agent.agentCode || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            <Shield size={12} />
                            {agent.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                            {agent.totalEarnings !== undefined && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <DollarSign size={12} />
                                TZS {agent.totalEarnings?.toLocaleString() || '0'}
                              </div>
                            )}
                            {agent.businessesActivated !== undefined && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Building2 size={12} />
                                {agent.businessesActivated} businesses
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                            {!agent.isVerified && agent.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleVerify(agent.id)}
                                className="admin-btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Verify
                              </button>
                            )}
                            {agent.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleStatusChange(agent.id, 'SUSPENDED')}
                                className="admin-btn-ghost"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  color: '#ef4444',
                                }}
                              >
                                Suspend
                              </button>
                            )}
                            {agent.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleStatusChange(agent.id, 'ACTIVE')}
                                className="admin-btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Activate
                              </button>
                            )}
                            {agent.status === 'PENDING' && (
                              <button
                                onClick={() => handleStatusChange(agent.id, 'ACTIVE')}
                                className="admin-btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
