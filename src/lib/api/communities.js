import { api } from './client';

function toList(data) {
  if (Array.isArray(data)) return data;
  if (data?.data?.content && Array.isArray(data.data.content)) return data.data.content;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

function toPage(data) {
  const content = toList(data?.data ?? data);
  return {
    content,
    totalElements: data?.data?.totalElements ?? data?.totalElements ?? content.length,
    totalPages: data?.data?.totalPages ?? data?.totalPages ?? 1,
    number: data?.data?.number ?? data?.number ?? 0,
    size: data?.data?.size ?? data?.size ?? 20,
  };
}

/**
 * List communities the current user has joined
 * GET /api/v1/communities/me?page=0&size=20
 */
export async function getMyCommunities(params = {}) {
  const { data } = await api.get('/communities/me', {
    params: { page: 0, size: 50, ...params },
  });
  return toPage(data);
}

/**
 * Get a single community by ID
 * GET /api/v1/communities/:id
 */
export async function getCommunity(id) {
  const { data } = await api.get(`/communities/${id}`);
  if (data && data.success === false) {
    const err = new Error(data.message || 'Failed to load group');
    err.response = { data };
    throw err;
  }
  return data?.data ?? data;
}

/**
 * List all communities (discover)
 * GET /api/v1/communities?page=0&size=20&sortBy=membersCount
 */
export async function getAllCommunities(params = {}) {
  const { data } = await api.get('/communities', {
    params: { page: 0, size: 50, sortBy: 'membersCount', ...params },
  });
  return toPage(data);
}

/**
 * Join a community
 * POST /api/v1/communities/:id/join
 */
export async function joinCommunity(id) {
  const { data } = await api.post(`/communities/${id}/join`);
  return data?.data ?? data;
}

/**
 * Leave a community
 * POST /api/v1/communities/:id/leave
 */
export async function leaveCommunity(id) {
  const { data } = await api.post(`/communities/${id}/leave`);
  return data?.data ?? data;
}

/**
 * Update community settings (admin only)
 * PUT /api/v1/communities/:id/settings
 * Body: { allowMemberPosts: true | false }
 */
export async function updateCommunitySettings(id, { allowMemberPosts }) {
  const { data } = await api.put(`/communities/${id}/settings`, {
    allowMemberPosts: allowMemberPosts !== false,
  });
  return data?.data ?? data;
}

/**
 * Create a community (group)
 * POST /api/v1/communities (multipart: name, type, privacy, optional coverImage)
 */
export async function createCommunity({ name, description, type = 'GROUP', privacy = 'PUBLIC', coverImage = null }) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('type', type);
  formData.append('privacy', privacy);
  if (description) formData.append('description', description);
  if (coverImage && coverImage instanceof File) formData.append('coverImage', coverImage);
  const { data } = await api.post('/communities', formData);
  return data?.data ?? data;
}

/**
 * Pin a post in a community (admin only)
 * POST /api/v1/communities/:id/posts/:postId/pin
 */
export async function pinPost(communityId, postId) {
  const { data } = await api.post(`/communities/${communityId}/posts/${postId}/pin`);
  return data?.data ?? data;
}

/**
 * Unpin a post in a community (admin only)
 * DELETE /api/v1/communities/:id/posts/:postId/pin
 */
export async function unpinPost(communityId, postId) {
  const { data } = await api.delete(`/communities/${communityId}/posts/${postId}/pin`);
  return data?.data ?? data;
}

// ==================== INVITES ====================

/**
 * Invite users to a community (admin/moderator only)
 * POST /api/v1/communities/:id/invite
 * Body: { userIds: string[] }
 */
export async function inviteUsers(communityId, userIds) {
  const { data } = await api.post(`/communities/${communityId}/invite`, {
    userIds: Array.isArray(userIds) ? userIds.map(String) : [String(userIds)],
  });
  return data?.data ?? data;
}

/**
 * Get my pending group invites
 * GET /api/v1/communities/invites/me?page=0&size=20
 */
export async function getMyInvites(params = {}) {
  const { data } = await api.get('/communities/invites/me', {
    params: { page: 0, size: 50, ...params },
  });
  const res = data?.data ?? data;
  return {
    content: res?.content ?? [],
    totalElements: res?.totalElements ?? 0,
    totalPages: res?.totalPages ?? 1,
  };
}

/**
 * Accept a group invite
 * POST /api/v1/communities/invites/:inviteId/accept
 */
export async function acceptInvite(inviteId) {
  const { data } = await api.post(`/communities/invites/${inviteId}/accept`);
  return data?.data ?? data;
}

/**
 * Decline a group invite
 * POST /api/v1/communities/invites/:inviteId/decline
 */
export async function declineInvite(inviteId) {
  const { data } = await api.post(`/communities/invites/${inviteId}/decline`);
  return data?.data ?? data;
}
