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
 * Body: { postId: "uuid", targetReach: 1000, paymentPhone: "+255..." }
 */
export async function boostPost(postId, targetReach, paymentPhone) {
  const { data } = await api.post('/ads/boost-post', {
    postId,
    targetReach,
    paymentPhone,
  });
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
