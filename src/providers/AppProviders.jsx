import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
