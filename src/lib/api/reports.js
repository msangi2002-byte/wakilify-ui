import { api } from './client';

/**
 * Submit a report (post, user, comment, etc.)
 * POST /api/v1/reports
 * Body: { type: 'USER'|'POST'|'COMMENT'|'PRODUCT'|'BUSINESS'|'MESSAGE', targetId: uuid, reason: string, description?: string }
 */
export async function createReport({ type, targetId, reason, description = '' }) {
  const { data } = await api.post('/reports', { type, targetId, reason, description });
  return data?.data ?? data;
}
