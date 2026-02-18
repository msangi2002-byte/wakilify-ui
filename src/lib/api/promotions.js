import { api } from './client';

const base = '/promotions';

/**
 * Create promotion (POST, PRODUCT, BUSINESS)
 * POST /api/v1/promotions
 * Body: { type, targetId, title, description, budget, startDate, endDate, paymentPhone, targetRegions?, targetAgeMin?, targetAgeMax?, targetGender? }
 */
export async function createPromotion(body) {
  const { data } = await api.post(base, body);
  return data?.data ?? data;
}

/**
 * Get my promotions
 * GET /api/v1/promotions?page=0&size=20
 */
export async function getMyPromotions(params = {}) {
  const { data } = await api.get(base, { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Boost Product or Business – create promotion + initiate USSD
 * POST /api/v1/promotions/boost
 * Body: { type: 'PRODUCT'|'BUSINESS', targetId, budget, paymentPhone }
 */
export async function boostProductOrBusiness(body) {
  const { data } = await api.post(`${base}/boost`, body);
  return data?.data ?? data;
}

/**
 * Get promotion packages (for display)
 * GET /api/v1/promotions/packages?type=PRODUCT
 */
export async function getPromotionPackages(type) {
  const { data } = await api.get(`${base}/packages`, { params: type ? { type } : {} });
  return data?.data ?? data;
}
