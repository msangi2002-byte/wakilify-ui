import { useState, useEffect } from 'react';

let state = {
  user: null,
  token: null,
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
const USER_KEY = 'wakilify_user';

function rehydrate() {
  if (typeof window === 'undefined') return;
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const userJson = window.localStorage.getItem(USER_KEY);
    if (token && userJson) {
      const user = JSON.parse(userJson);
      state = { user, token, isAuthenticated: true };
    }
  } catch (_) {}
}
rehydrate();

export function setAuth(user, token) {
  state = { user, token, isAuthenticated: !!user && !!token };
  if (typeof window !== 'undefined' && token) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (_) {}
  }
  notifyListeners();
}

export function clearAuth() {
  state = { user: null, token: null, isAuthenticated: false };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    } catch (_) {}
  }
  notifyListeners();
}
