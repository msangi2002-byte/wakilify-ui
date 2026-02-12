import { api } from './client';

/**
 * Request to become a business (user selects an agent; agent sees request in dashboard).
 * POST /api/v1/users/me/business-requests
 * Body: { businessName, ownerPhone, category?, region?, district?, ward?, street?, description?, agentCode }
 */
export async function createBusinessRequest(body) {
  const { data } = await api.post('/users/me/business-requests', body);
  return data?.data ?? data;
}

/**
 * Record activity/heartbeat (updates lastSeen for online status)
 * POST /api/v1/users/me/activity
 */
export async function recordActivity() {
  await api.post('/users/me/activity');
}

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
 * Mark onboarding as complete (Facebook-like post-login setup)
 * PATCH /api/v1/users/me/onboarding-complete
 */
export async function completeOnboarding() {
  const { data } = await api.patch('/users/me/onboarding-complete');
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

/**
 * Get nearby users (same country; order: city → region → country)
 * GET /api/v1/users/nearby?page=0&size=20
 */
export async function getNearbyUsers(params = {}) {
  const { data } = await api.get('/users/nearby', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Upload contacts for People You May Know (phones, emails – stored hashed)
 * POST /api/v1/users/me/contacts
 * Body: { phones?: string[], emails?: string[] }
 */
export async function uploadContacts({ phones = [], emails = [] }) {
  const { data } = await api.post('/users/me/contacts', {
    phones: Array.isArray(phones) ? phones : [],
    emails: Array.isArray(emails) ? emails : [],
  });
  return data?.data ?? data;
}

/**
 * Get People You May Know (scored: contact + location + mutuals + interests)
 * GET /api/v1/users/people-you-may-know?page=0&size=20
 */
export async function getPeopleYouMayKnow(params = {}) {
  const { data } = await api.get('/users/people-you-may-know', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/**
 * Get login activity (IP, device, browser)
 * GET /api/v1/users/me/login-activity?page=0&size=20
 */
export async function getLoginActivity(params = {}) {
  const { data } = await api.get('/users/me/login-activity', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

// ——— Restrict user (see only public posts) ———
/** POST /api/v1/users/:userId/restrict */
export async function restrictUser(userId) {
  const { data } = await api.post(`/users/${userId}/restrict`);
  return data?.data ?? data;
}

/** DELETE /api/v1/users/:userId/restrict */
export async function unrestrictUser(userId) {
  const { data } = await api.delete(`/users/${userId}/restrict`);
  return data?.data ?? data;
}

/** GET /api/v1/users/me/restricted?page=0&size=20 */
export async function getRestrictedUsers(params = {}) {
  const { data } = await api.get('/users/me/restricted', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

// ——— Follow (if backend uses /users/:id/follow; else keep using friends.js /social/follow) ———
/** GET /api/v1/users/:userId/followers?page=0&size=20 */
export async function getFollowers(userId, params = {}) {
  const { data } = await api.get(`/users/${userId}/followers`, {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}

/** GET /api/v1/users/:userId/following?page=0&size=20 */
export async function getFollowingList(userId, params = {}) {
  const { data } = await api.get(`/users/${userId}/following`, {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}
