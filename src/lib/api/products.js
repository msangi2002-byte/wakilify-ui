import { api } from './client';

/**
 * Products API – Marketplace endpoints
 * Base path: /api/v1/products
 * Auth: Not required for most endpoints (public marketplace)
 */

/**
 * Get all products (marketplace)
 * GET /api/v1/products?page=0&size=20
 */
export async function getProducts(params = {}) {
  const { data } = await api.get('/products', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get product by ID
 * GET /api/v1/products/{id}
 */
export async function getProductById(productId) {
  const { data } = await api.get(`/products/${productId}`);
  return data?.data ?? data;
}

/**
 * Search products
 * GET /api/v1/products/search?q=...&page=0&size=20
 */
export async function searchProducts(query, params = {}) {
  const { data } = await api.get('/products/search', { params: { q: query, page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get products by category
 * GET /api/v1/products/category/{category}?page=0&size=20
 */
export async function getProductsByCategory(category, params = {}) {
  const { data } = await api.get(`/products/category/${category}`, { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get trending products
 * GET /api/v1/products/trending?page=0&size=20
 */
export async function getTrendingProducts(params = {}) {
  const { data } = await api.get('/products/trending', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get products by region
 * GET /api/v1/products/region/{region}?page=0&size=20
 */
export async function getProductsByRegion(region, params = {}) {
  const { data } = await api.get(`/products/region/${region}`, { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

/**
 * Get products by business
 * GET /api/v1/products/business/{businessId}?page=0&size=20
 */
export async function getProductsByBusiness(businessId, params = {}) {
  const { data } = await api.get(`/products/business/${businessId}`, { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}
