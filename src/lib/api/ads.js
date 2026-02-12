import { api } from './client';

/**
 * Get active ads to display
 * GET /api/v1/ads/active?type=FEED&region=&limit=5
 * @param {Object} params - { type?: 'BANNER'|'FEED'|'PRODUCT'|'STORY'|'POPUP', region?: string, limit?: number }
 */
export async function getActiveAds(params = {}) {
  const { data } = await api.get('/ads/active', {
    params: { limit: 5, ...params },
  });
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : [];
}

/**
 * Record ad impression (fire when ad is shown)
 * POST /api/v1/ads/:adId/impression
 */
export async function recordImpression(adId) {
  await api.post(`/ads/${adId}/impression`);
}

/**
 * Record ad click (fire when user clicks ad)
 * POST /api/v1/ads/:adId/click
 */
export async function recordClick(adId) {
  await api.post(`/ads/${adId}/click`);
}
