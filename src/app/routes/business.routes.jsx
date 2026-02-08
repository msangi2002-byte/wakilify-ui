import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import BusinessLayout from '@/layouts/BusinessLayout';
import { AuthGuard } from '@/app/guards/AuthGuard';
import { RoleGuard } from '@/app/guards/RoleGuard';
import { ROLES } from '@/types/roles';

const Dashboard = lazy(() => import('@/pages/business/Dashboard'));
const Products = lazy(() => import('@/pages/business/Products'));
const ProductNew = lazy(() => import('@/pages/business/ProductNew'));
const ProductEdit = lazy(() => import('@/pages/business/ProductEdit'));
const Orders = lazy(() => import('@/pages/business/Orders'));
const Stats = lazy(() => import('@/pages/business/Stats'));
const Settings = lazy(() => import('@/pages/business/Settings'));

const SuspenseWrapper = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

export function BusinessRoutes() {
  return (
    <Route path="business" element={<AuthGuard><RoleGuard allowedRoles={[ROLES.BUSINESS]}><BusinessLayout /></RoleGuard></AuthGuard>}>
      <Route index element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
      <Route path="products" element={<SuspenseWrapper><Products /></SuspenseWrapper>} />
      <Route path="products/new" element={<SuspenseWrapper><ProductNew /></SuspenseWrapper>} />
      <Route path="products/:id/edit" element={<SuspenseWrapper><ProductEdit /></SuspenseWrapper>} />
      <Route path="orders" element={<SuspenseWrapper><Orders /></SuspenseWrapper>} />
      <Route path="stats" element={<SuspenseWrapper><Stats /></SuspenseWrapper>} />
      <Route path="settings" element={<SuspenseWrapper><Settings /></SuspenseWrapper>} />
    </Route>
  );
}
