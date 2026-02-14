import { api } from './client';

/**
 * Get admin dashboard statistics
 * GET /api/v1/admin/dashboard
 */
export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data?.data ?? data;
}

/**
 * Get all users (paginated)
 * GET /api/v1/admin/users?page=0&size=20&role=USER&isActive=true
 */
export async function getAdminUsers(params = {}) {
  const { data } = await api.get('/admin/users', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Update user status (activate/deactivate)
 * PUT /api/v1/admin/users/{userId}/status
 */
export async function updateUserStatus(userId, isActive) {
  const { data } = await api.put(`/admin/users/${userId}/status`, { isActive });
  return data?.data ?? data;
}

/**
 * Update user role
 * PUT /api/v1/admin/users/{userId}/role
 */
export async function updateUserRole(userId, role) {
  const { data } = await api.put(`/admin/users/${userId}/role`, { role });
  return data?.data ?? data;
}

/**
 * Get all businesses (paginated)
 * GET /api/v1/admin/businesses?page=0&size=20&status=ACTIVE&search=store
 */
export async function getAdminBusinesses(params = {}) {
  const { data } = await api.get('/admin/businesses', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Update business status
 * PUT /api/v1/admin/businesses/{businessId}/status
 */
export async function updateBusinessStatus(businessId, status, reason = '') {
  const { data } = await api.put(`/admin/businesses/${businessId}/status`, { status, reason });
  return data?.data ?? data;
}

/**
 * Verify business
 * POST /api/v1/admin/businesses/{businessId}/verify
 */
export async function verifyBusiness(businessId) {
  const { data } = await api.post(`/admin/businesses/${businessId}/verify`);
  return data?.data ?? data;
}

/**
 * Get all agents (paginated)
 * GET /api/v1/admin/agents?page=0&size=20&status=PENDING&search=agent
 */
export async function getAdminAgents(params = {}) {
  const { data } = await api.get('/admin/agents', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Update agent status
 * PUT /api/v1/admin/agents/{agentId}/status
 */
export async function updateAgentStatus(agentId, status) {
  const { data } = await api.put(`/admin/agents/${agentId}/status`, { status });
  return data?.data ?? data;
}

/**
 * Verify agent
 * POST /api/v1/admin/agents/{agentId}/verify
 */
export async function verifyAgent(agentId) {
  const { data } = await api.post(`/admin/agents/${agentId}/verify`);
  return data?.data ?? data;
}

/**
 * Get all withdrawals (paginated)
 * GET /api/v1/admin/withdrawals?page=0&size=20&status=PENDING
 */
export async function getAdminWithdrawals(params = {}) {
  const { data } = await api.get('/admin/withdrawals', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Process withdrawal request
 * POST /api/v1/admin/withdrawals/{withdrawalId}/process
 */
export async function processWithdrawal(withdrawalId, action, notes = '') {
  const { data } = await api.post(`/admin/withdrawals/${withdrawalId}/process`, { action, notes });
  return data?.data ?? data;
}

/**
 * Get all reports (paginated)
 * GET /api/v1/admin/reports?page=0&size=20&status=PENDING
 */
export async function getAdminReports(params = {}) {
  const { data } = await api.get('/admin/reports', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Resolve report
 * POST /api/v1/admin/reports/{reportId}/resolve
 */
export async function resolveReport(reportId, action, notes = '') {
  const { data } = await api.post(`/admin/reports/${reportId}/resolve`, { action, notes });
  return data?.data ?? data;
}

/**
 * Dismiss report
 * POST /api/v1/admin/reports/{reportId}/dismiss
 */
export async function dismissReport(reportId, notes = '') {
  const { data } = await api.post(`/admin/reports/${reportId}/dismiss`, { notes });
  return data?.data ?? data;
}

/**
 * Get audit logs (paginated)
 * GET /api/v1/admin/audit-logs?page=0&size=50&action=USER_STATUS_CHANGE
 */
export async function getAdminAuditLogs(params = {}) {
  const { data } = await api.get('/admin/audit-logs', {
    params: { page: 0, size: 50, ...params },
  });
  return data?.data ?? data;
}

/**
 * Get all agent packages
 * GET /api/v1/admin/agent-packages
 */
export async function getAgentPackages() {
  const { data } = await api.get('/admin/agent-packages');
  return data?.data ?? data;
}

/**
 * Create agent package
 * POST /api/v1/admin/agent-packages
 */
export async function createAgentPackage(packageData) {
  const { data } = await api.post('/admin/agent-packages', packageData);
  return data?.data ?? data;
}

/**
 * Update agent package
 * PUT /api/v1/admin/agent-packages/{id}
 */
export async function updateAgentPackage(packageId, packageData) {
  const { data } = await api.put(`/admin/agent-packages/${packageId}`, packageData);
  return data?.data ?? data;
}

/**
 * Delete agent package
 * DELETE /api/v1/admin/agent-packages/{id}
 */
export async function deleteAgentPackage(packageId) {
  const { data } = await api.delete(`/admin/agent-packages/${packageId}`);
  return data?.data ?? data;
}
