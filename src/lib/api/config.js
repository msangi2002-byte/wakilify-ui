import { api } from './client';

/**
 * Public config API – e.g. fee amounts for display (no auth required for GET /config/fees).
 */

/**
 * Get fee amounts (agent register, business activation) for display in UI.
 * GET /api/v1/config/fees
 */
export async function getFeeAmounts() {
  const { data } = await api.get('/config/fees');
  return data?.data ?? data;
}

/**
 * Get active business registration plans (for "Become a business" – user chooses subscription).
 * GET /api/v1/config/business-registration-plans
 * Public – no auth required.
 */
export async function getBusinessRegistrationPlans() {
  const { data } = await api.get('/config/business-registration-plans');
  return data?.data ?? data ?? [];
}
