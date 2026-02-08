let state = {
  sidebarOpen: true,
  theme: 'light',
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
  listeners.forEach((fn) => fn(state));
}

export function subscribeUI(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
