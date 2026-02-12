import { api } from './client';

/**
 * Business API – references: wakify BusinessController, route.txt
 * Base path: /api/v1/business
 * Auth: Bearer token, BUSINESS role required
 */

/**
 * Get business dashboard summary
 * GET /api/v1/business/dashboard
 */
export async function getBusinessDashboard() {
  const { data } = await api.get('/business/dashboard');
  return data?.data ?? data;
}

/**
 * Get my business profile
 * GET /api/v1/business/me
 */
export async function getBusinessMe() {
  const { data } = await api.get('/business/me');
  return data?.data ?? data;
}

/**
 * Update business profile
 * PUT /api/v1/business/me
 */
export async function updateBusinessMe(body) {
  const { data } = await api.put('/business/me', body);
  return data?.data ?? data;
}

/**
 * Get business products
 * GET /api/v1/business/products?page=0&size=20
 */
export async function getBusinessProducts(params = {}) {
  const { data } = await api.get('/business/products', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get a single product by ID
 * GET /api/v1/products/{id}
 */
export async function getProductById(productId) {
  const { data } = await api.get(`/products/${productId}`);
  return data?.data ?? data;
}

/**
 * Create a new product
 * POST /api/v1/business/products
 * Accepts multipart/form-data with product data and optional images
 * @param {Object} productData - Product fields (name, price, description, category, stockQuantity)
 * @param {File[]} images - Optional array of image files
 */
export async function createProduct(productData, images = []) {
  const formData = new FormData();
  
  // Add product data as JSON
  formData.append('product', new Blob([JSON.stringify(productData)], { type: 'application/json' }));
  
  // Add images if provided
  if (images && images.length > 0) {
    images.forEach((image) => {
      if (image instanceof File) {
        formData.append('images', image);
      }
    });
  }
  
  const { data } = await api.post('/business/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data?.data ?? data;
}

/**
 * Update a product
 * PUT /api/v1/business/products/:id
 */
export async function updateProduct(id, body) {
  const { data } = await api.put(`/business/products/${id}`, body);
  return data?.data ?? data;
}

/**
 * Delete a product
 * DELETE /api/v1/business/products/:id
 */
export async function deleteProduct(id) {
  const { data } = await api.delete(`/business/products/${id}`);
  return data;
}

/**
 * Get business orders
 * GET /api/v1/business/orders?page=0&size=20
 */
export async function getBusinessOrders(params = {}) {
  const { data } = await api.get('/business/orders', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Update order status
 * PUT /api/v1/business/orders/:id/status
 */
export async function updateOrderStatus(id, body) {
  const { data } = await api.put(`/business/orders/${id}/status`, body);
  return data?.data ?? data;
}

/**
 * Confirm order
 * POST /api/v1/business/orders/:id/confirm
 */
export async function confirmOrder(id) {
  const { data } = await api.post(`/business/orders/${id}/confirm`);
  return data?.data ?? data;
}

/**
 * Ship order
 * POST /api/v1/business/orders/:id/ship
 */
export async function shipOrder(id, body = {}) {
  const { data } = await api.post(`/business/orders/${id}/ship`, body);
  return data?.data ?? data;
}

/**
 * Deliver order
 * POST /api/v1/business/orders/:id/deliver
 */
export async function deliverOrder(id) {
  const { data } = await api.post(`/business/orders/${id}/deliver`);
  return data?.data ?? data;
}
