const THEME_STORAGE_KEY = 'wakilify-ui-theme';

function getStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch (_) {}
  return 'light';
}

let state = {
  sidebarOpen: true,
  theme: getStoredTheme(),
};

const listeners = new Set();

export function useUIStore() {
  return {
    get sidebarOpen() {
      return state.sidebarOpen;
    },
    get theme() {
      return state.theme;
    },
  };
}

export function setUI(updates) {
  state = { ...state, ...updates };
  if (updates.theme !== undefined) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, updates.theme);
    } catch (_) {}
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribeUI(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
