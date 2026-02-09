import { useState, useEffect } from 'react';

let state = {
  user: null,
  token: null, // access token
  refreshToken: null,
  isAuthenticated: false,
}; 
 
const listeners = new Set();

function getState() {
  return { ...state };
}

function notifyListeners() {
  listeners.forEach((fn) => fn(state));
}

export function useAuthStore() {
  const [authState, setAuthStateLocal] = useState(getState);

  useEffect(() => {
    const handler = () => setAuthStateLocal(getState());
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return authState;
}

const TOKEN_KEY = 'wakilify_token';
const REFRESH_TOKEN_KEY = 'wakilify_refresh_token';
const USER_KEY = 'wakilify_user';

/** Returns current access token (in-memory or localStorage). For API client use. */
export function getToken() {
  if (state.token) return state.token;
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch (_) {}
  }
  return null;
}

/** Returns refresh token for token refresh. */
export function getRefreshToken() {
  if (state.refreshToken) return state.refreshToken;
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (_) {}
  }
  return null;
}

/** Current user (for refresh flow). */
export function getAuthUser() {
  return state.user;
}

function rehydrate() {
  if (typeof window === 'undefined') return;
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    const userJson = window.localStorage.getItem(USER_KEY);
    if (token && userJson) {
      const user = JSON.parse(userJson);
      state = { user, token, refreshToken, isAuthenticated: true };
    }
  } catch (_) {}
}
rehydrate();

/**
 * Set auth state after login. Use accessToken for API requests; refreshToken for refreshing when access expires.
 */
export function setAuth(user, accessToken, refreshToken = null) {
  state = {
    user,
    token: accessToken,
    refreshToken: refreshToken ?? state.refreshToken,
    isAuthenticated: !!(user && accessToken),
  };
  if (typeof window !== 'undefined' && accessToken) {
    try {
      window.localStorage.setItem(TOKEN_KEY, accessToken);
      if (state.refreshToken)
        window.localStorage.setItem(REFRESH_TOKEN_KEY, state.refreshToken);
      if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (_) {}
  }
  notifyListeners();
}

export function clearAuth() {
  state = { user: null, token: null, refreshToken: null, isAuthenticated: false };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch (_) {}
  }
  notifyListeners();
}
