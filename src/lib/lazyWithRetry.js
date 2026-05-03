/**
 * Lazy load a component with automatic retry on failure.
 * This helps handle chunk loading errors when a new deployment
 * changes the chunk filenames.
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function lazyWithRetry(importFn, retries = MAX_RETRIES) {
  return async () => {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error;

        // Check if it's a chunk loading error
        const isChunkError =
          error?.message?.includes('Failed to fetch dynamically imported module') ||
          error?.message?.includes('Loading chunk') ||
          error?.message?.includes('Failed to load module script') ||
          error?.message?.includes('Importing a module script failed');

        // Only retry on chunk loading errors, not on other errors
        if (!isChunkError) {
          throw error;
        }

        // On last attempt, throw the error
        if (attempt === retries) {
          throw error;
        }

        // Wait before retrying
        await delay(RETRY_DELAY * attempt);

        // Clear module cache if possible
        if (window.location.reload && attempt === retries - 1) {
          // On second-to-last attempt, suggest a page reload
          console.warn(`Chunk load failed, retrying... (${attempt}/${retries})`);
        }
      }
    }

    throw lastError;
  };
}

/**
 * Wrap a lazy import with retry logic
 * Usage: const Home = lazy(() => lazyWithRetry(() => import('@/pages/user/Home')))
 */
export function lazyWithRetryImport(importFn) {
  return lazyWithRetry(importFn);
}
