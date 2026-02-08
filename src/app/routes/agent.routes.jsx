import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import AgentLayout from '@/layouts/AgentLayout';
import { AuthGuard } from '@/app/guards/AuthGuard';
import { RoleGuard } from '@/app/guards/RoleGuard';
import { ROLES } from '@/types/roles';

const Dashboard = lazy(() => import('@/pages/agent/Dashboard'));
const Activate = lazy(() => import('@/pages/agent/Activate'));
const Commissions = lazy(() => import('@/pages/agent/Commissions'));
const Withdrawals = lazy(() => import('@/pages/agent/Withdrawals'));

const SuspenseWrapper = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

export function AgentRoutes() {
  return (
    <Route path="agent" element={<AuthGuard><RoleGuard allowedRoles={[ROLES.AGENT]}><AgentLayout /></RoleGuard></AuthGuard>}>
      <Route index element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
      <Route path="activate" element={<SuspenseWrapper><Activate /></SuspenseWrapper>} />
      <Route path="commissions" element={<SuspenseWrapper><Commissions /></SuspenseWrapper>} />
      <Route path="withdrawals" element={<SuspenseWrapper><Withdrawals /></SuspenseWrapper>} />
    </Route>
  );
}
