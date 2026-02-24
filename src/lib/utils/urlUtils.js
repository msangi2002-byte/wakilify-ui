/**
 * Normalize a CTA / sponsor link so external URLs open correctly.
 * - Internal path (starts with /) → return as is.
 * - Already absolute (http://, https://, //) → return as is.
 * - Plain host (e.g. youtube.com) → prepend https:// so it opens as external.
 * @param {string|null|undefined} url
 * @returns {string} URL safe for href or window.open
 */
export function normalizeCtaLink(url) {
  if (url == null || typeof url !== 'string') return url ?? '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) return trimmed;
  return 'https://' + trimmed;
}

/**
 * Whether the link is internal (same app path). Use for navigate() vs open in new tab.
 */
export function isInternalCtaLink(url) {
  if (url == null || typeof url !== 'string') return false;
  return url.trim().startsWith('/');
}
