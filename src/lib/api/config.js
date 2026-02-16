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
