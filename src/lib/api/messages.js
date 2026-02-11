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
 * Upload voice note (or message media). Returns { url }.
 * POST /api/v1/messages/upload (multipart: file)
 */
export async function uploadMessageMedia(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const out = data?.data ?? data;
  return out?.url ?? out;
}

/**
 * Send a message (text, voice note, or reply).
 * POST /api/v1/messages
 * Body: { recipientId, content?, type?, mediaUrl?, replyToId? }
 * - replyToId: message ID you're replying to (optional)
 */
export async function sendMessage(recipientId, content, options = {}) {
  const body = {
    recipientId,
    content: content ?? '',
    ...(options.type && { type: options.type }),
    ...(options.mediaUrl && { mediaUrl: options.mediaUrl }),
    ...(options.replyToId && { replyToId: options.replyToId }),
  };
  const { data } = await api.post('/messages', body);
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
