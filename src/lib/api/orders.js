import { api } from './client';

/**
 * Orders API
 * Base path: /api/v1/orders
 * Auth: Bearer token required
 */

/**
 * Create a new order
 * POST /api/v1/orders
 * @param {Object} orderData - { businessId, items: [{ productId, quantity }], deliveryAddress, deliveryPhone }
 */
export async function createOrder(orderData) {
  const { data } = await api.post('/orders', orderData);
  return data?.data ?? data;
}

/**
 * Get my orders
 * GET /api/v1/orders/my?page=0&size=20
 */
export async function getMyOrders(params = {}) {
  const { data } = await api.get('/orders/my', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get order by ID
 * GET /api/v1/orders/{id}
 */
export async function getOrderById(orderId) {
  const { data } = await api.get(`/orders/${orderId}`);
  return data?.data ?? data;
}

/**
 * Cancel an order
 * POST /api/v1/orders/{id}/cancel
 * @param {string} orderId
 * @param {string} reason
 */
export async function cancelOrder(orderId, reason) {
  const { data } = await api.post(`/orders/${orderId}/cancel`, { reason });
  return data?.data ?? data;
}
