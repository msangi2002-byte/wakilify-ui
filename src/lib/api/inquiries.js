import { api } from './client';

/**
 * Product Inquiries (Request for Quotation) API
 * Base path: /api/v1
 * Auth: Bearer required
 */

export async function createInquiry({ productId, message, quantity }) {
  const { data } = await api.post('/inquiries', { productId, message, quantity: quantity ?? 1 });
  return data?.data ?? data;
}

export async function getMyInquiries(params = {}) {
  const { data } = await api.get('/inquiries/my', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function getInquiryById(inquiryId) {
  const { data } = await api.get(`/inquiries/${inquiryId}`);
  return data?.data ?? data;
}

export async function acceptInquiry(inquiryId) {
  const { data } = await api.post(`/inquiries/${inquiryId}/accept`);
  return data?.data ?? data;
}

export async function rejectInquiry(inquiryId, asSeller = false) {
  const { data } = await api.post(`/inquiries/${inquiryId}/reject`, null, { params: { asSeller } });
  return data?.data ?? data;
}

export async function getBusinessInquiries(params = {}) {
  const { data } = await api.get('/business/inquiries', { params: { page: 0, size: 20, ...params } });
  return data?.data ?? data;
}

export async function quoteInquiry(inquiryId, { sellerReply, quotedPrice, quotedDeliveryFee }) {
  const { data } = await api.post(`/business/inquiries/${inquiryId}/quote`, {
    sellerReply,
    quotedPrice,
    quotedDeliveryFee: quotedDeliveryFee ?? 0,
  });
  return data?.data ?? data;
}
