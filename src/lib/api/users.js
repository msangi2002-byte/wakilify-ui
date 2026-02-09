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
