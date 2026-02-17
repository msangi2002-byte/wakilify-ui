import { useState, useEffect, useCallback } from 'react';

/**
 * Gets current position once (for registration / forms).
 * Capture in background when screen mounts; no user action required.
 * Returns { position: { latitude, longitude } | null, error, loading, retry }.
 */
export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPosition = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setPosition(null);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      }
    );
  }, []);

  useEffect(() => {
    fetchPosition();
  }, [fetchPosition]);

  return { position, error, loading, retry: fetchPosition };
}
