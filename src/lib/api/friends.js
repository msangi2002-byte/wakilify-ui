import { api } from './client';

const defaultPage = 0;
const defaultSize = 20;

function toList(data) {
  if (Array.isArray(data)) return data;
  if (data?.data?.content && Array.isArray(data.data.content)) return data.data.content;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

/**
 * Get my friends (accepted friendships; auth required)
 * GET /api/v1/friends?page=0&size=20
 */
export async function getFriends(params = {}) {
  const { data } = await api.get('/friends', {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return toList(data);
}

/**
 * Get mutual follows: users I follow AND who follow me back (malafiki)
 * GET /api/v1/social/mutual-follows?page=0&size=50
 */
export async function getMutualFollows(params = {}) {
  const { data } = await api.get('/social/mutual-follows', {
    params: { page: 0, size: 50, ...params },
  });
  const content = data?.data?.content ?? data?.content ?? [];
  return Array.isArray(content) ? content : [];
}

/**
 * Get people that a user follows (auth required)
 * GET /api/v1/social/following/:userId?page=0&size=20
 * Returns { content: UserResponse[], page, size, totalElements, ... }
 */
export async function getFollowing(userId, params = {}) {
  const { data } = await api.get(`/social/following/${userId}`, {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return data?.data ?? data;
}

/**
 * Follow user (auth required)
 * POST /api/v1/social/follow/:userId
 */
export async function followUser(userId) {
  const id = String(userId);
  const { data } = await api.post(`/social/follow/${id}`);
  return data?.data ?? data;
}

/**
 * Unfollow user (auth required)
 * DELETE /api/v1/social/follow/:userId
 */
export async function unfollowUser(userId) {
  const id = String(userId);
  const { data } = await api.delete(`/social/follow/${id}`);
  return data?.data ?? data;
}
