import { api } from './client';

const defaultPage = 0;
const defaultSize = 20;

function toList(data) {
  if (Array.isArray(data)) return data;
  // { success, data: { content: [...] } } (wakilfy API)
  if (data?.data?.content && Array.isArray(data.data.content)) return data.data.content;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

/**
 * 1. Your feed (auth required)
 * GET /api/v1/posts/feed?page=0&size=20
 */
export async function getFeed(params = {}) {
  const { data } = await api.get('/posts/feed', {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return toList(data);
}

/**
 * 2. Public feed (no auth)
 * GET /api/v1/posts/public/feed?page=0&size=20
 */
export async function getPublicFeed(params = {}) {
  const { data } = await api.get('/posts/public/feed', {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return toList(data);
}

/**
 * 3. Trending posts (no auth)
 * GET /api/v1/posts/trending?page=0&size=20
 */
export async function getTrendingPosts(params = {}) {
  const { data } = await api.get('/posts/trending', {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return toList(data);
}

/**
 * 4. Reels (auth required)
 * GET /api/v1/posts/reels?page=0&size=20
 */
export async function getReels(params = {}) {
  const { data } = await api.get('/posts/reels', {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return toList(data);
}

/**
 * 4b. Active stories (24h) from self + following
 * GET /api/v1/posts/stories
 * Returns list of PostResponse (postType STORY). Group by author on the client.
 */
export async function getStories() {
  const { data } = await api.get('/posts/stories');
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * 5. Posts by user (auth required)
 * GET /api/v1/posts/user/:userId?page=0&size=20
 */
export async function getPostsByUser(userId, params = {}) {
  const { data } = await api.get(`/posts/user/${userId}`, {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return toList(data);
}

/**
 * Posts in a community (group) (auth required)
 * GET /api/v1/posts/community/:communityId?page=0&size=20
 */
export async function getPostsByCommunity(communityId, params = {}) {
  const { data } = await api.get(`/posts/community/${communityId}`, {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return toList(data);
}

/**
 * 6. Single post by ID (auth required)
 * GET /api/v1/posts/:postId
 */
export async function getPostById(postId) {
  const { data } = await api.get(`/posts/${postId}`);
  return data?.data ?? data;
}

/**
 * Like a post (auth required)
 * POST /api/v1/posts/:postId/like
 */
export async function likePost(postId) {
  const { data } = await api.post(`/posts/${postId}/like`);
  return data?.data ?? data;
}

/**
 * Unlike a post (auth required)
 * DELETE /api/v1/posts/:postId/like
 */
export async function unlikePost(postId) {
  const { data } = await api.delete(`/posts/${postId}/like`);
  return data?.data ?? data;
}

/**
 * Get comments for a post (auth required)
 * GET /api/v1/posts/:postId/comments?page=0&size=20
 */
export async function getComments(postId, params = {}) {
  const { data } = await api.get(`/posts/${postId}/comments`, {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return toList(data);
}

/**
 * Add comment (auth required)
 * POST /api/v1/posts/:postId/comments
 * Body: { content: "..." }
 */
export async function addComment(postId, content) {
  const { data } = await api.post(`/posts/${postId}/comments`, { content });
  return data?.data ?? data;
}

/**
 * Delete comment (auth required)
 * DELETE /api/v1/posts/comments/:commentId
 */
export async function deleteComment(commentId) {
  const { data } = await api.delete(`/posts/comments/${commentId}`);
  return data?.data ?? data;
}

/**
 * Create a post (text-only, with image(s), or multiple files).
 * Uses multipart/form-data: field "data" (JSON) and optional "files" (one or more).
 * For repost: pass originalPostId and postType 'POST'.
 * For group post: pass communityId (UUID string).
 * POST /api/v1/posts
 */
export async function createPost({ caption = '', visibility = 'PUBLIC', postType = 'POST', originalPostId = null, communityId = null, files = [] }) {
  const formData = new FormData();
  const dataPayload = { caption, visibility, postType };
  if (originalPostId) dataPayload.originalPostId = originalPostId;
  if (communityId) dataPayload.communityId = communityId;
  formData.append('data', new Blob([JSON.stringify(dataPayload)], { type: 'application/json' }));
  for (const file of files) {
    if (file instanceof File) formData.append('files', file);
  }
  const { data } = await api.post('/posts', formData);
  return data;
}

// ——— Save post (Hifadhi) ———
/** POST /api/v1/posts/:postId/save */
export async function savePost(postId) {
  const { data } = await api.post(`/posts/${postId}/save`);
  return data?.data ?? data;
}

/** DELETE /api/v1/posts/:postId/save */
export async function unsavePost(postId) {
  const { data } = await api.delete(`/posts/${postId}/save`);
  return data?.data ?? data;
}

/** GET /api/v1/posts/saved?page=0&size=20 - returns { content, page, size, totalElements, totalPages } */
export async function getSavedPosts(params = {}) {
  const { data } = await api.get('/posts/saved', {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  return data?.data ?? data;
}

// ——— Share to story ———
/** POST /api/v1/posts/:postId/share-to-story  Body optional: { caption: "..." } */
export async function sharePostToStory(postId, caption = '') {
  const { data } = await api.post(`/posts/${postId}/share-to-story`, caption ? { caption } : {});
  return data?.data ?? data;
}

// ——— Story viewers ———
/** POST /api/v1/posts/:postId/view - record that current user viewed this story */
export async function recordStoryView(postId) {
  const { data } = await api.post(`/posts/${postId}/view`);
  return data?.data ?? data;
}

/** GET /api/v1/posts/:postId/viewers?page=0&size=50 - list of UserSummary (story author only) */
export async function getStoryViewers(postId, params = {}) {
  const { data } = await api.get(`/posts/${postId}/viewers`, {
    params: { page: 0, size: 50, ...params },
  });
  const res = data?.data ?? data;
  return res?.content ?? toList(data);
}
