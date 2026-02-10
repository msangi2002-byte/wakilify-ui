/**
 * Parse a date from the API. Backend sends LocalDateTime (no timezone);
 * we treat it as UTC so relative times (e.g. "5m ago") are correct.
 * @param {string|number|Date|null|undefined} value - ISO string, timestamp, or Date
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseApiDate(value) {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') return new Date(value);
  const str = String(value).trim();
  if (!str) return null;
  // If already has timezone (Z or ±offset), parse as-is
  if (str.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(str)) return new Date(str);
  // Backend LocalDateTime is server time (UTC); parse as UTC
  const asUtc = str.includes('T') ? `${str.replace(/Z$/, '')}Z` : `${str}T00:00:00Z`;
  const date = new Date(asUtc);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format post/comment time as relative (e.g. "5m", "2h") or absolute date.
 * Uses parseApiDate so API datetimes without timezone are interpreted as UTC.
 */
export function formatPostTime(createdAt) {
  const date = parseApiDate(createdAt);
  if (!date) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

/**
 * Same as formatPostTime; use for comments.
 */
export function formatCommentTime(createdAt) {
  return formatPostTime(createdAt);
}
