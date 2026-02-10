import { api } from './client';

const defaultPage = 0;
const defaultSize = 20;

/** Chunk size for resumable upload (500KB). Stays under Nginx default 1MB limit including multipart overhead. */
const CHUNK_SIZE = 512 * 1024;

/** Use chunked upload when file exceeds this (500KB) */
const CHUNK_THRESHOLD = CHUNK_SIZE;

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
 * Add comment or reply (auth required)
 * POST /api/v1/posts/:postId/comments
 * Body: { content: "...", parentId?: "uuid" } - parentId for replies
 */
export async function addComment(postId, content, parentId = null) {
  const body = { content };
  if (parentId) body.parentId = parentId;
  const { data } = await api.post(`/posts/${postId}/comments`, body);
  return data?.data ?? data;
}

/**
 * Like a comment (auth required)
 * POST /api/v1/posts/comments/:commentId/like
 */
export async function likeComment(commentId) {
  const { data } = await api.post(`/posts/comments/${commentId}/like`);
  return data?.data ?? data;
}

/**
 * Unlike a comment (auth required)
 * DELETE /api/v1/posts/comments/:commentId/like
 */
export async function unlikeComment(commentId) {
  const { data } = await api.delete(`/posts/comments/${commentId}/like`);
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
 * Chunked upload – 3-step flow with Upload Ticket (backend-generated unique ID).
 * 1. Start: obtain uploadId from backend (avoids conflicts when many users upload "video.mp4")
 * 2. Chunks: send file in 1MB pieces
 * 3. Complete: merge and get final URL
 *
 * @param {File} file
 * @param {string} subdirectory - e.g. 'posts', 'avatars'
 * @param {(pct: number) => void} [onProgress] - 0–100, called as chunks upload
 */
export async function uploadChunked(file, subdirectory = 'posts', onProgress) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // Step 1: Obtain Upload Ticket (backend generates unique uploadId)
  const startRes = await api.post('/upload/start', {
    filename: file.name,
    subdirectory,
    totalChunks,
  });
  const uploadId = startRes.data?.data?.uploadId ?? startRes.data?.uploadId;
  if (!uploadId) throw new Error('Failed to obtain upload ticket');

  if (onProgress) onProgress(2); // "Preparing..."

  // Step 2: Send chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', String(i));
    formData.append('totalChunks', String(totalChunks));
    formData.append('filename', file.name);
    formData.append('chunk', chunk);

    await api.post('/upload/chunk', formData);
    const progress = Math.round(((i + 1) / totalChunks) * 98); // 2–100% for chunks
    if (onProgress) onProgress(Math.min(98, progress + 2));
  }

  // Step 3: Finalize
  const { data } = await api.post('/upload/complete', {
    uploadId,
    filename: file.name,
    subdirectory,
  });
  if (onProgress) onProgress(100);

  const url = data?.data?.url ?? data?.url;
  if (!url) throw new Error('Upload complete but no URL returned');
  return url;
}

/**
 * Upload a file: chunked if large, otherwise not used here (caller uses createPost with files).
 * @returns {Promise<string>} public URL
 */
export async function uploadFileSmart(file, subdirectory = 'posts', onProgress) {
  if (file.size > CHUNK_THRESHOLD) {
    return uploadChunked(file, subdirectory, onProgress);
  }
  return null; // Caller should use createPost with files for small files
}

/** Threshold in bytes – use chunked upload when file exceeds this */
export const CHUNK_THRESHOLD_BYTES = CHUNK_THRESHOLD;

/**
 * Create a post (text-only, with image(s), or multiple files).
 * - If mediaUrls provided: POST JSON (use after chunked upload).
 * - Else if files provided and all small: multipart/form-data.
 * For repost: pass originalPostId and postType 'POST'.
 * For group post: pass communityId (UUID string).
 * POST /api/v1/posts
 */
export async function createPost({
  caption = '',
  visibility = 'PUBLIC',
  postType = 'POST',
  originalPostId = null,
  communityId = null,
  productTags = null,
  files = [],
  mediaUrls = null,
}) {
  if (mediaUrls && mediaUrls.length > 0) {
    const payload = { caption, visibility, postType, mediaUrls };
    if (originalPostId) payload.originalPostId = originalPostId;
    if (communityId) payload.communityId = communityId;
    if (productTags?.length) payload.productTags = productTags;
    const { data } = await api.post('/posts', payload);
    return data;
  }

  const formData = new FormData();
  const dataPayload = { caption, visibility, postType };
  if (originalPostId) dataPayload.originalPostId = originalPostId;
  if (communityId) dataPayload.communityId = communityId;
  if (productTags?.length) dataPayload.productTags = productTags;
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
