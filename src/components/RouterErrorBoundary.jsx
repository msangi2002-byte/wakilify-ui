import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export function RouterErrorBoundary() {
  const error = useRouteError();

  // Check if it's a chunk loading error
  const isChunkError =
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to load module script');

  // Check if it's a 404 route error
  const isRouteNotFound = isRouteErrorResponse(error) && error.status === 404;

  const handleReload = () => {
    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload(true);
  };

  // Chunk loading error - show nice retry UI
  if (isChunkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw size={28} className="text-purple-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            App Update Available
          </h1>
          <p className="text-gray-600 mb-6">
            A new version of the app is available. Please refresh to get the latest updates.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleReload}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
            >
              <RefreshCw size={18} />
              Refresh Page
            </button>
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Home size={18} />
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 404 Not Found
  if (isRouteNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-gray-400">404</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
          >
            <Home size={18} />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Generic error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={28} className="text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={handleReload}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Home size={18} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
