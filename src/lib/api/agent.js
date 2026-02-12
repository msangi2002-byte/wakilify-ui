import { api } from './client';

/**
 * Agent API – references: wakify AgentController, route.txt
 * Base path: /api/v1/agent
 * Auth: Bearer token, AGENT (or ADMIN) role for most endpoints.
 */

/**
 * Get agent dashboard summary (wallet, earnings, stats)
 * GET /api/v1/agent/dashboard
 */
export async function getAgentDashboard() {
  const { data } = await api.get('/agent/dashboard');
  return data?.data ?? data;
}

/**
 * Get my agent profile
 * GET /api/v1/agent/me
 */
export async function getAgentMe() {
  const { data } = await api.get('/agent/me');
  return data?.data ?? data;
}

/**
 * Get agent by code (public)
 * GET /api/v1/agent/code/:agentCode
 */
export async function getAgentByCode(agentCode) {
  const { data } = await api.get(`/agent/code/${encodeURIComponent(agentCode)}`);
  return data?.data ?? data;
}

/**
 * Register as agent (authenticated user)
 * POST /api/v1/agent/register
 * Body: { nationalId, region, district, paymentPhone, ward?, street? }
 */
export async function registerAgent(body) {
  const { data } = await api.post('/agent/register', body);
  return data?.data ?? data;
}

/**
 * Activate a business (agent only – for new users without an account)
 * POST /api/v1/agent/activate-business
 * Body: { businessName, ownerName, ownerPhone, ownerEmail?, ownerPassword, category, region, district, paymentPhone, description?, ward?, street? }
 * Owner uses email/phone + password to log in after payment and access business dashboard.
 */
export async function activateBusiness(body) {
  const { data } = await api.post('/agent/activate-business', body);
  return data?.data ?? data;
}

/**
 * Get my activated businesses
 * GET /api/v1/agent/businesses?page=0&size=20
 */
export async function getAgentBusinesses(params = {}) {
  const { data } = await api.get('/agent/businesses', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get business requests (users who selected this agent when requesting to become a business).
 * GET /api/v1/agent/business-requests?page=0&size=20
 */
export async function getAgentBusinessRequests(params = {}) {
  const { data } = await api.get('/agent/business-requests', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get my commissions
 * GET /api/v1/agent/commissions?page=0&size=20
 */
export async function getAgentCommissions(params = {}) {
  const { data } = await api.get('/agent/commissions', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Search agents (public)
 * GET /api/v1/agent/search?q=...&page=0&size=20
 */
export async function searchAgents(q, params = {}) {
  const { data } = await api.get('/agent/search', { params: { q, page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Request withdrawal
 * POST /api/v1/agent/withdrawals
 * Body: { amount, phone }
 */
export async function requestWithdrawal(body) {
  const { data } = await api.post('/agent/withdrawals', body);
  return data?.data ?? data;
}

/**
 * Get withdrawal history
 * GET /api/v1/agent/withdrawals?page=0&size=20
 */
export async function getAgentWithdrawals(params = {}) {
  const { data } = await api.get('/agent/withdrawals', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Cancel pending withdrawal
 * DELETE /api/v1/agent/withdrawals/:id
 */
export async function cancelWithdrawal(id) {
  await api.delete(`/agent/withdrawals/${id}`);
}
