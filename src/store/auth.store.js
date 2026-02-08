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

export function setAuth(user, token) {
  state = { user, token, isAuthenticated: !!user && !!token };
  notifyListeners();
}

export function clearAuth() {
  state = { user: null, token: null, isAuthenticated: false };
  notifyListeners();
}
