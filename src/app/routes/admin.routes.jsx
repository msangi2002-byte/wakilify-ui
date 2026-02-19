import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import { AuthGuard } from '@/app/guards/AuthGuard';
import { RoleGuard } from '@/app/guards/RoleGuard';
import { ROLES } from '@/types/roles';

const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Users = lazy(() => import('@/pages/admin/Users'));
const Businesses = lazy(() => import('@/pages/admin/Businesses'));
const Agents = lazy(() => import('@/pages/admin/Agents'));
const Products = lazy(() => import('@/pages/admin/Products'));
const Orders = lazy(() => import('@/pages/admin/Orders'));
const Payments = lazy(() => import('@/pages/admin/Payments'));
const Withdrawals = lazy(() => import('@/pages/admin/Withdrawals'));
const Promotions = lazy(() => import('@/pages/admin/Promotions'));
const Reports = lazy(() => import('@/pages/admin/Reports'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));
const Settings = lazy(() => import('@/pages/admin/Settings'));
const AgentPackages = lazy(() => import('@/pages/admin/AgentPackages'));
const BusinessRegistrationPlans = lazy(() => import('@/pages/admin/BusinessRegistrationPlans'));
const AdminRoles = lazy(() => import('@/pages/admin/AdminRoles'));
const MapView = lazy(() => import('@/pages/admin/MapView'));
const AudienceAnalytics = lazy(() => import('@/pages/admin/AudienceAnalytics'));

const SuspenseWrapper = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

export function AdminRoutes() {
  return (
    <Route path="admin" element={<AuthGuard><RoleGuard allowedRoles={[ROLES.ADMIN]}><AdminLayout /></RoleGuard></AuthGuard>}>
      <Route index element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
      <Route path="users" element={<SuspenseWrapper><Users /></SuspenseWrapper>} />
      <Route path="businesses" element={<SuspenseWrapper><Businesses /></SuspenseWrapper>} />
      <Route path="agents" element={<SuspenseWrapper><Agents /></SuspenseWrapper>} />
      <Route path="products" element={<SuspenseWrapper><Products /></SuspenseWrapper>} />
      <Route path="orders" element={<SuspenseWrapper><Orders /></SuspenseWrapper>} />
      <Route path="payments" element={<SuspenseWrapper><Payments /></SuspenseWrapper>} />
      <Route path="withdrawals" element={<SuspenseWrapper><Withdrawals /></SuspenseWrapper>} />
      <Route path="promotions" element={<SuspenseWrapper><Promotions /></SuspenseWrapper>} />
      <Route path="audience-analytics" element={<SuspenseWrapper><AudienceAnalytics /></SuspenseWrapper>} />
      <Route path="reports" element={<SuspenseWrapper><Reports /></SuspenseWrapper>} />
      <Route path="map" element={<SuspenseWrapper><MapView /></SuspenseWrapper>} />
      <Route path="audit-logs" element={<SuspenseWrapper><AuditLogs /></SuspenseWrapper>} />
      <Route path="agent-packages" element={<SuspenseWrapper><AgentPackages /></SuspenseWrapper>} />
      <Route path="business-registration-plans" element={<SuspenseWrapper><BusinessRegistrationPlans /></SuspenseWrapper>} />
      <Route path="roles" element={<SuspenseWrapper><AdminRoles /></SuspenseWrapper>} />
      <Route path="settings" element={<SuspenseWrapper><Settings /></SuspenseWrapper>} />
    </Route>
  );
}
