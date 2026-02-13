import { api } from './client';

const defaultPage = 0;
const defaultSize = 20;

/**
 * Get current user notifications (auth required)
 * GET /api/v1/notifications?page=0&size=20&type=LIKE
 * Returns { content: NotificationResponse[], page, size, totalElements, totalPages, last, first }
 */
export async function getNotifications(params = {}) {
  const { data } = await api.get('/notifications', {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return data?.data ?? data;
}

/**
 * Get unread notifications count
 * GET /api/v1/notifications/unread-count
 */
export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data?.data ?? data;
}

/**
 * Mark a notification as read
 * POST /api/v1/notifications/:id/read
 */
export async function markNotificationRead(id) {
  const { data } = await api.post(`/notifications/${id}/read`);
  return data?.data ?? data;
}

/**
 * Mark all notifications as read
 * POST /api/v1/notifications/read-all
 */
export async function markAllNotificationsRead() {
  const { data } = await api.post('/notifications/read-all');
  return data?.data ?? data;
}
