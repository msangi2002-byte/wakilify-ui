import { api } from './client';

/**
 * Get current user profile (auth required)
 * GET /api/v1/users/me
 */
export async function getMe() {
  const { data } = await api.get('/users/me');
  return data?.data ?? data;
}

/**
 * Get user profile by id (auth required)
 * GET /api/v1/users/:userId
 */
export async function getUser(userId) {
  const { data } = await api.get(`/users/${userId}`);
  return data?.data ?? data;
}

/**
 * Update current user profile (auth required)
 * PUT /api/v1/users/me
 * Body: { name?, bio?, work?, education?, currentCity?, hometown?, relationshipStatus?, website? }
 */
export async function updateMe(body) {
  const { data } = await api.put('/users/me', body);
  return data?.data ?? data;
}

/**
 * Upload profile picture (avatar)
 * POST /api/v1/users/me/avatar
 * Body: FormData with "file" (image)
 * Returns updated user (with new profilePic URL)
 */
export async function uploadProfilePic(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.data ?? data;
}

/**
 * Upload cover picture (banner)
 * POST /api/v1/users/me/cover
 * Body: FormData with "file" (image)
 * Returns updated user (with new coverPic URL)
 */
export async function uploadCoverPic(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/users/me/cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data?.data ?? data;
}

/**
 * Search users by name/email/phone. Results sorted alphabetically by name.
 * GET /api/v1/users/search?q=...&page=0&size=20
 * Returns { content: UserResponse[], page, size, totalElements, totalPages, last, first }
 */
export async function searchUsers(q, params = {}) {
  const { data } = await api.get('/users/search', {
    params: { q: q ?? '', page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Get suggested users (people you may know) by same region/country. Sorted alphabetically.
 * GET /api/v1/users/suggested?page=0&size=20
 * Returns { content: UserResponse[], page, size, totalElements, totalPages, last, first }
 */
export async function getSuggestedUsers(params = {}) {
  const { data } = await api.get('/users/suggested', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

// ——— Block user ———
/** POST /api/v1/users/:userId/block */
export async function blockUser(userId) {
  const { data } = await api.post(`/users/${userId}/block`);
  return data?.data ?? data;
}

/** DELETE /api/v1/users/:userId/block */
export async function unblockUser(userId) {
  const { data } = await api.delete(`/users/${userId}/block`);
  return data?.data ?? data;
}

/** GET /api/v1/users/me/blocked?page=0&size=20 - list blocked users */
export async function getBlockedUsers(params = {}) {
  const { data } = await api.get('/users/me/blocked', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}
