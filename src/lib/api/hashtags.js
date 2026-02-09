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
 * Trending hashtags for Explore
 * GET /api/v1/hashtags/trending?page=0&size=20
 * Returns string[] (tag names without #)
 */
export async function getTrendingHashtags(params = {}) {
  const { data } = await api.get('/hashtags/trending', {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  const list = data?.data ?? data;
  return Array.isArray(list) ? list : list?.content ?? [];
}

/**
 * Posts by hashtag (tagName with or without #)
 * GET /api/v1/hashtags/:tagName/posts?page=0&size=20
 * Returns { content: PostResponse[], page, size, totalElements, totalPages }
 */
export async function getPostsByHashtag(tagName, params = {}) {
  const name = typeof tagName === 'string' && tagName.startsWith('#') ? tagName.slice(1) : tagName;
  const { data } = await api.get(`/hashtags/${encodeURIComponent(name)}/posts`, {
    params: { page: defaultPage, size: defaultSize, ...params },
  });
  const res = data?.data ?? data;
  return { content: toList(res), ...res };
}
