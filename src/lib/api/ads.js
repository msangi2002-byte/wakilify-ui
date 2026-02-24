import { api } from './client';

/**
 * Get my posts for boosting
 * GET /api/v1/ads/posts/my?page=0&size=20
 */
export async function getMyPostsForBoost(params = {}) {
  const { data } = await api.get('/ads/posts/my', {
    params: { page: 0, size: 50, ...params },
  });
  // Handle paginated response
  if (data?.data?.content) return data.data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Calculate ad price based on target reach
 * GET /api/v1/ads/calculate-price?targetReach=1000
 */
export async function calculateAdPrice(targetReach) {
  const { data } = await api.get('/ads/calculate-price', {
    params: { targetReach },
  });
  return data?.data ?? data;
}

/**
 * Boost a post - create promotion and initiate USSD payment
 * POST /api/v1/ads/boost-post
 * Body: { postId, targetReach, paymentPhone, objective?, audienceType?, targetRegions?, targetAgeMin?, targetAgeMax?, targetGender?, ctaLink? }
 */
export async function boostPost(postId, targetReach, paymentPhone, options = {}) {
  const body = {
    postId,
    targetReach,
    paymentPhone,
    ...(options.objective && { objective: options.objective }),
    ...(options.audienceType && { audienceType: options.audienceType }),
    ...(options.targetRegions?.length && { targetRegions: options.targetRegions }),
    ...(options.targetAgeMin != null && { targetAgeMin: options.targetAgeMin }),
    ...(options.targetAgeMax != null && { targetAgeMax: options.targetAgeMax }),
    ...(options.targetGender && { targetGender: options.targetGender }),
    ...(options.ctaLink && { ctaLink: options.ctaLink.trim() }),
  };
  const { data } = await api.post('/ads/boost-post', body);
  return data?.data ?? data;
}

/**
 * Check payment status
 * GET /api/v1/payments/status/{orderId}
 */
export async function checkPaymentStatus(orderId) {
  const { data } = await api.get(`/payments/status/${orderId}`);
  return data?.data ?? data;
}

/**
 * Get boost analytics
 * GET /api/v1/ads/analytics
 */
export async function getBoostAnalytics() {
  const { data } = await api.get('/ads/analytics');
  return data?.data ?? data;
}

/**
 * Get active ads for display (feed, etc.)
 * GET /api/v1/ads/active?type=FEED&limit=5
 */
export async function getActiveAds(params = {}) {
  const { data } = await api.get('/ads/active', { params: { limit: 5, ...params } });
  return data?.data ?? data ?? [];
}

/**
 * Record ad impression
 * POST /api/v1/ads/{adId}/impression
 */
export async function recordImpression(adId) {
  await api.post(`/ads/${adId}/impression`);
}

/**
 * Record ad click
 * POST /api/v1/ads/{adId}/click
 */
export async function recordClick(adId) {
  await api.post(`/ads/${adId}/click`);
}
