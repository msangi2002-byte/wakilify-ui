import { api } from './client';

function unwrap(res) {
  const data = res?.data;
  if (data?.data !== undefined) return data.data;
  return data;
}

/**
 * Get current user payment history (profile)
 * GET /api/v1/payments/me?page=0&size=20
 * Returns { content: PaymentHistoryResponse[], totalElements, totalPages, ... }
 */
export async function getMyPayments(params = {}) {
  const { data } = await api.get('/payments/me', {
    params: { page: 0, size: 20, ...params },
  });
  return unwrap({ data }) ?? data;
}

/**
 * Check payment status by orderId
 * GET /api/v1/payments/status/{orderId}
 */
export async function checkPaymentStatus(orderId) {
  const { data } = await api.get(`/payments/status/${orderId}`);
  return unwrap({ data }) ?? data;
}