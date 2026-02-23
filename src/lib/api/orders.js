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
 */
export async function cancelOrder(orderId, reason) {
  const { data } = await api.post(`/orders/${orderId}/cancel`, { reason });
  return data?.data ?? data;
}

/**
 * Create draft order from accepted inquiry (Alibaba-style)
 * POST /api/v1/orders/draft
 */
export async function createDraftOrder(body) {
  const { data } = await api.post('/orders/draft', body);
  return data?.data ?? data;
}

/**
 * Buyer confirms draft order (ready for payment)
 * POST /api/v1/orders/{id}/confirm
 */
export async function confirmOrder(orderId) {
  const { data } = await api.post(`/orders/${orderId}/confirm`);
  return data?.data ?? data;
}

/**
 * Get tracking events for an order
 * GET /api/v1/orders/{id}/tracking
 */
export async function getOrderTracking(orderId) {
  const { data } = await api.get(`/orders/${orderId}/tracking`);
  return data?.data ?? data;
}

/**
 * Add tracking event (business only)
 * POST /api/v1/business/orders/{id}/tracking
 */
export async function addOrderTrackingEvent(orderId, event) {
  const { data } = await api.post(`/business/orders/${orderId}/tracking`, event);
  return data?.data ?? data;
}

/**
 * Update draft order (business only): deliveryFee, discount, sellerNotes
 * PUT /api/v1/business/orders/{id}/draft
 */
export async function updateDraftOrder(orderId, body) {
  const { data } = await api.put(`/business/orders/${orderId}/draft`, body);
  return data?.data ?? data;
}
