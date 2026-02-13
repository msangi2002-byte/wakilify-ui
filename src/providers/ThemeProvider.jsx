import { useEffect, useState } from 'react';
import { useUIStore, subscribeUI } from '@/store/ui.store';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => useUIStore().theme);

  useEffect(() => {
    const unsub = subscribeUI((state) => setTheme(state.theme));
    return unsub;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  return <>{children}</>;
}
