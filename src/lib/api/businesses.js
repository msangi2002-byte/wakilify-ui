import { api } from './client';

/**
 * Public Businesses API – marketplace (shops)
 * Base path: /api/v1
 * Auth: Optional (for follow state)
 */

/**
 * Get business by ID (public shop profile)
 * GET /api/v1/businesses/{id}
 */
export async function getBusinessById(businessId) {
  const { data } = await api.get(`/businesses/${businessId}`);
  return data?.data ?? data;
}

/**
 * Search businesses by name, description, category
 * GET /api/v1/businesses/search?q=...&page=0&size=20
 */
export async function searchBusinesses(query, params = {}) {
  const { data } = await api.get('/businesses/search', {
    params: { q: query, page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Submit feedback or advice for a shop (authenticated user)
 * POST /api/v1/businesses/{id}/feedback
 */
export async function submitBusinessFeedback(businessId, content) {
  const { data } = await api.post(`/businesses/${businessId}/feedback`, { content });
  return data?.data ?? data;
}
