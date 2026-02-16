import { api } from './client';

const base = '/admin';

/**
 * Admin API – base path: /api/v1/admin
 * Auth: Bearer token, ADMIN role required.
 */

export async function getAdminDashboard() {
  const { data } = await api.get(`${base}/dashboard`);
  return data?.data ?? data;
}

export async function getAdminUsers(params = {}) {
  const { data } = await api.get(`${base}/users`, { params });
  return data?.data ?? data;
}

export async function updateUserStatus(userId, isActive, reason = '') {
  const { data } = await api.put(`${base}/users/${userId}/status`, { isActive, reason });
  return data?.data ?? data;
}

export async function updateUserRole(userId, role, reason = '') {
  const { data } = await api.put(`${base}/users/${userId}/role`, { role, reason });
  return data?.data ?? data;
}

export async function getAdminBusinesses(params = {}) {
  const { data } = await api.get(`${base}/businesses`, { params });
  return data?.data ?? data;
}

export async function updateBusinessStatus(businessId, status, reason = '') {
  const { data } = await api.put(`${base}/businesses/${businessId}/status`, { status, reason });
  return data?.data ?? data;
}

export async function verifyBusiness(businessId) {
  const { data } = await api.post(`${base}/businesses/${businessId}/verify`);
  return data?.data ?? data;
}

export async function getAdminAgents(params = {}) {
  const { data } = await api.get(`${base}/agents`, { params });
  return data?.data ?? data;
}

export async function updateAgentStatus(agentId, status, reason = '') {
  const { data } = await api.put(`${base}/agents/${agentId}/status`, { status, reason });
  return data?.data ?? data;
}

export async function verifyAgent(agentId) {
  const { data } = await api.post(`${base}/agents/${agentId}/verify`);
  return data?.data ?? data;
}

export async function getAdminWithdrawals(params = {}) {
  const { data } = await api.get(`${base}/withdrawals`, { params });
  return data?.data ?? data;
}

export async function processWithdrawal(withdrawalId, actionOrApprove, notes = '', transactionId = null) {
  const approve = typeof actionOrApprove === 'boolean' ? actionOrApprove : actionOrApprove === 'APPROVE';
  const { data } = await api.post(`${base}/withdrawals/${withdrawalId}/process`, {
    approve,
    notes,
    ...(transactionId && { transactionId }),
  });
  return data?.data ?? data;
}

export async function getAdminReports(params = {}) {
  const { data } = await api.get(`${base}/reports`, { params });
  return data?.data ?? data;
}

export async function resolveReport(reportId, body = {}) {
  const { data } = await api.post(`${base}/reports/${reportId}/resolve`, body);
  return data?.data ?? data;
}

export async function dismissReport(reportId, reason = '') {
  const { data } = await api.post(`${base}/reports/${reportId}/dismiss`, { reason });
  return data?.data ?? data;
}

export async function getAdminAuditLogs(params = {}) {
  const { data } = await api.get(`${base}/audit-logs`, { params });
  return data?.data ?? data;
}

export async function getAgentPackages() {
  const { data } = await api.get('/agent/packages');
  return data?.data ?? data;
}

export async function createAgentPackage(body) {
  const { data } = await api.post(`${base}/agent-packages`, body);
  return data?.data ?? data;
}

export async function updateAgentPackage(packageId, body) {
  const { data } = await api.put(`${base}/agent-packages/${packageId}`, body);
  return data?.data ?? data;
}

export async function deleteAgentPackage(packageId) {
  await api.delete(`${base}/agent-packages/${packageId}`);
}

// ==================== SETTINGS ====================

/**
 * Get admin settings (agent register amount, to-be-business amount, ads price per person)
 * GET /api/v1/admin/settings
 */
export async function getAdminSettings() {
  const { data } = await api.get(`${base}/settings`);
  return data?.data ?? data;
}

/**
 * Update admin settings
 * PUT /api/v1/admin/settings
 * Body: { agentRegisterAmount: number, toBeBusinessAmount: number, adsPricePerPerson: number }
 */
export async function updateAdminSettings(payload) {
  const { data } = await api.put(`${base}/settings`, payload);
  return data?.data ?? data;
}
