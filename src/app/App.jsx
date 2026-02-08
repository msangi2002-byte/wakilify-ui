import { Outlet } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import '@/styles/global.css';

export default function App() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
