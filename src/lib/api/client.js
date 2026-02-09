import axios from 'axios';
import { clearAuth, getToken, getRefreshToken, setAuth, getAuthUser } from '@/store/auth.store';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Use accessToken for Authorization (not refreshToken)
  const accessToken =
    getToken() ||
    (typeof window !== 'undefined' && window.__authToken) ||
    (typeof window !== 'undefined' && window.localStorage?.getItem('wakilify_token'));
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  // Let browser set Content-Type (and boundary) for FormData
  if (typeof FormData !== 'undefined' && config.data instanceof FormData)
    delete config.headers['Content-Type'];
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const config = err.config;

    if (status !== 401 || config?.__retried) {
      if (status === 401) clearAuth();
      return Promise.reject(err);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refreshToken = getRefreshToken();
          if (!refreshToken) return null;
          const { data } = await axios.post(
            `${baseURL}/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          const accessToken = data?.data?.accessToken ?? data?.accessToken;
          const newRefresh = data?.data?.refreshToken ?? data?.refreshToken ?? refreshToken;
          if (accessToken) {
            setAuth(getAuthUser(), accessToken, newRefresh);
            return accessToken;
          }
          return null;
        })();
      }
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        config.__retried = true;
        return api.request(config);
      }
    } catch (_) {
      refreshPromise = null;
    }
    clearAuth();
    return Promise.reject(err);
  }
);
