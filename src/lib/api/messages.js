import { api } from './client';

/**
 * Get list of conversations (people you've chatted with)
 * GET /api/v1/messages/conversations?limit=50
 */
export async function getConversations(limit = 50) {
  const { data } = await api.get('/messages/conversations', { params: { limit } });
  return data?.data ?? data ?? [];
}

/**
 * Get chat history with a user
 * GET /api/v1/messages/:otherUserId?page=0&size=20
 */
export async function getConversation(otherUserId, params = {}) {
  const { data } = await api.get(`/messages/${otherUserId}`, {
    params: { page: 0, size: 50, ...params },
  });
  const content = data?.data?.content ?? data?.content ?? [];
  return Array.isArray(content) ? content : [];
}

/**
 * Send a message
 * POST /api/v1/messages
 * Body: { recipientId, content }
 */
export async function sendMessage(recipientId, content) {
  const { data } = await api.post('/messages', { recipientId, content });
  return data?.data ?? data;
}

/**
 * Mark conversation with a user as read
 * PUT /api/v1/messages/:otherUserId/read
 */
export async function markConversationRead(otherUserId) {
  await api.put(`/messages/${otherUserId}/read`);
}

/**
 * Get total unread count
 * GET /api/v1/messages/unread-count
 */
export async function getUnreadCount() {
  const { data } = await api.get('/messages/unread-count');
  return data?.data ?? data ?? 0;
}
