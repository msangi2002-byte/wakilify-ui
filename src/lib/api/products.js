import { api } from './client';

/**
 * Products API – Marketplace endpoints
 * Base path: /api/v1/products
 * Auth: Not required for most endpoints (public marketplace)
 */

export async function getProducts(params = {}) {
  const { data } = await api.get('/products', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function getProductById(productId) {
  const { data } = await api.get(`/products/${productId}`);
  return data?.data ?? data;
}

export async function searchProducts(query, params = {}) {
  const { data } = await api.get('/products/search', { params: { q: query, page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function getProductsByCategory(category, params = {}) {
  const { data } = await api.get(`/products/category/${category}`, { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function getTrendingProducts(params = {}) {
  const { data } = await api.get('/products/trending', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function getTopSellingProducts(params = {}) {
  const { data } = await api.get('/products/top-selling', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function getFeaturedProducts(params = {}) {
  const { data } = await api.get('/products/featured', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function getProductsByRegion(region, params = {}) {
  const { data } = await api.get(`/products/region/${region}`, { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function getProductsByBusiness(businessId, params = {}) {
  const { data } = await api.get(`/products/business/${businessId}`, { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}
