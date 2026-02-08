/**
 * Extract error message from API error response.
 * When the API returns "Validation failed" with errors, we show the actual validation messages.
 */
function messageFrom(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value?.message === 'string') return value.message.trim();
  if (typeof value?.msg === 'string') return value.msg.trim();
  return '';
}

export function getApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err.response?.data;
  if (!data || typeof data !== 'object') {
    return err.message || fallback;
  }

  // Prefer detailed validation errors over generic "Validation failed" message
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const parts = data.errors
      .map((e) => messageFrom(e))
      .filter(Boolean);
    if (parts.length > 0) return parts.join('. ');
  }

  if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    const parts = [];
    for (const [field, value] of Object.entries(data.errors)) {
      const list = Array.isArray(value) ? value : [value];
      for (const item of list) {
        const msg = messageFrom(item);
        if (msg) parts.push(msg);
      }
    }
    if (parts.length > 0) return parts.join('. ');
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }
  return err.message || fallback;
}
