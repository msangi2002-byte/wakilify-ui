import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import AuthLayout from '@/layouts/AuthLayout';
import UserLayout from '@/layouts/UserLayout';
import BusinessLayout from '@/layouts/BusinessLayout';
import AgentLayout from '@/layouts/AgentLayout';
import AdminLayout from '@/layouts/AdminLayout';
import { AuthGuard } from '@/app/guards/AuthGuard';
import { RoleGuard } from '@/app/guards/RoleGuard';
import { GuestOnly } from '@/app/guards/GuestOnly';
import { ROLES } from '@/types/roles';

const Welcome = lazy(() => import('@/pages/auth/Welcome'));
const Register = lazy(() => import('@/pages/auth/Register'));
const Otp = lazy(() => import('@/pages/auth/Otp'));
const Login = lazy(() => import('@/pages/auth/Login'));

const Home = lazy(() => import('@/pages/user/Home'));
const Explore = lazy(() => import('@/pages/user/Explore'));
const Create = lazy(() => import('@/pages/user/Create'));
const Reels = lazy(() => import('@/pages/user/Reels'));
const Stories = lazy(() => import('@/pages/user/Stories'));
const Shop = lazy(() => import('@/pages/user/Shop'));
const ProductDetails = lazy(() => import('@/pages/user/ProductDetails'));
const Cart = lazy(() => import('@/pages/user/Cart'));
const Checkout = lazy(() => import('@/pages/user/Checkout'));
const Live = lazy(() => import('@/pages/user/Live'));
const LiveViewer = lazy(() => import('@/pages/user/LiveViewer'));
const Wallet = lazy(() => import('@/pages/user/Wallet'));
const Messages = lazy(() => import('@/pages/user/Messages'));
const Chat = lazy(() => import('@/pages/user/Chat'));
const Profile = lazy(() => import('@/pages/user/Profile'));
const UserSettings = lazy(() => import('@/pages/user/Settings'));

const BusinessDashboard = lazy(() => import('@/pages/business/Dashboard'));
const BusinessProducts = lazy(() => import('@/pages/business/Products'));
const ProductNew = lazy(() => import('@/pages/business/ProductNew'));
const ProductEdit = lazy(() => import('@/pages/business/ProductEdit'));
const BusinessOrders = lazy(() => import('@/pages/business/Orders'));
const Stats = lazy(() => import('@/pages/business/Stats'));
const BusinessSettings = lazy(() => import('@/pages/business/Settings'));

const AgentDashboard = lazy(() => import('@/pages/agent/Dashboard'));
const Activate = lazy(() => import('@/pages/agent/Activate'));
const Commissions = lazy(() => import('@/pages/agent/Commissions'));
const AgentWithdrawals = lazy(() => import('@/pages/agent/Withdrawals'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Users = lazy(() => import('@/pages/admin/Users'));
const Businesses = lazy(() => import('@/pages/admin/Businesses'));
const Agents = lazy(() => import('@/pages/admin/Agents'));
const AdminProducts = lazy(() => import('@/pages/admin/Products'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));
const Payments = lazy(() => import('@/pages/admin/Payments'));
const AdminWithdrawals = lazy(() => import('@/pages/admin/Withdrawals'));
const Promotions = lazy(() => import('@/pages/admin/Promotions'));
const Reports = lazy(() => import('@/pages/admin/Reports'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));
const AdminSettings = lazy(() => import('@/pages/admin/Settings'));

const NotFound = lazy(() => import('@/pages/NotFound'));

const Fallback = () => <div>Loading...</div>;

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        path: 'auth',
        element: (
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        ),
        children: [
          { path: 'welcome', element: <Suspense fallback={<Fallback />}><Welcome /></Suspense> },
          { path: 'register', element: <Suspense fallback={<Fallback />}><Register /></Suspense> },
          { path: 'otp', element: <Suspense fallback={<Fallback />}><Otp /></Suspense> },
          { path: 'login', element: <Suspense fallback={<Fallback />}><Login /></Suspense> },
        ],
      },
      {
        path: '/',
        element: (
          <AuthGuard>
            <UserLayout />
          </AuthGuard>
        ),
        children: [
          { index: true, element: <Suspense fallback={<Fallback />}><Home /></Suspense> },
          { path: 'explore', element: <Suspense fallback={<Fallback />}><Explore /></Suspense> },
          { path: 'create', element: <Suspense fallback={<Fallback />}><Create /></Suspense> },
          { path: 'reels', element: <Suspense fallback={<Fallback />}><Reels /></Suspense> },
          { path: 'stories', element: <Suspense fallback={<Fallback />}><Stories /></Suspense> },
          { path: 'shop', element: <Suspense fallback={<Fallback />}><Shop /></Suspense> },
          { path: 'shop/:id', element: <Suspense fallback={<Fallback />}><ProductDetails /></Suspense> },
          { path: 'cart', element: <Suspense fallback={<Fallback />}><Cart /></Suspense> },
          { path: 'checkout', element: <Suspense fallback={<Fallback />}><Checkout /></Suspense> },
          { path: 'live', element: <Suspense fallback={<Fallback />}><Live /></Suspense> },
          { path: 'live/:id', element: <Suspense fallback={<Fallback />}><LiveViewer /></Suspense> },
          { path: 'wallet', element: <Suspense fallback={<Fallback />}><Wallet /></Suspense> },
          { path: 'messages', element: <Suspense fallback={<Fallback />}><Messages /></Suspense> },
          { path: 'chat/:id', element: <Suspense fallback={<Fallback />}><Chat /></Suspense> },
          { path: 'profile', element: <Suspense fallback={<Fallback />}><Profile /></Suspense> },
          { path: 'settings', element: <Suspense fallback={<Fallback />}><UserSettings /></Suspense> },
        ],
      },
      {
        path: 'business',
        element: (
          <AuthGuard>
            <RoleGuard allowedRoles={[ROLES.BUSINESS]}>
              <BusinessLayout />
            </RoleGuard>
          </AuthGuard>
        ),
        children: [
          { index: true, element: <Suspense fallback={<Fallback />}><BusinessDashboard /></Suspense> },
          { path: 'products', element: <Suspense fallback={<Fallback />}><BusinessProducts /></Suspense> },
          { path: 'products/new', element: <Suspense fallback={<Fallback />}><ProductNew /></Suspense> },
          { path: 'products/:id/edit', element: <Suspense fallback={<Fallback />}><ProductEdit /></Suspense> },
          { path: 'orders', element: <Suspense fallback={<Fallback />}><BusinessOrders /></Suspense> },
          { path: 'stats', element: <Suspense fallback={<Fallback />}><Stats /></Suspense> },
          { path: 'settings', element: <Suspense fallback={<Fallback />}><BusinessSettings /></Suspense> },
        ],
      },
      {
        path: 'agent',
        element: (
          <AuthGuard>
            <RoleGuard allowedRoles={[ROLES.AGENT]}>
              <AgentLayout />
            </RoleGuard>
          </AuthGuard>
        ),
        children: [
          { index: true, element: <Suspense fallback={<Fallback />}><AgentDashboard /></Suspense> },
          { path: 'activate', element: <Suspense fallback={<Fallback />}><Activate /></Suspense> },
          { path: 'commissions', element: <Suspense fallback={<Fallback />}><Commissions /></Suspense> },
          { path: 'withdrawals', element: <Suspense fallback={<Fallback />}><AgentWithdrawals /></Suspense> },
        ],
      },
      {
        path: 'admin',
        element: (
          <AuthGuard>
            <RoleGuard allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout />
            </RoleGuard>
          </AuthGuard>
        ),
        children: [
          { index: true, element: <Suspense fallback={<Fallback />}><AdminDashboard /></Suspense> },
          { path: 'users', element: <Suspense fallback={<Fallback />}><Users /></Suspense> },
          { path: 'businesses', element: <Suspense fallback={<Fallback />}><Businesses /></Suspense> },
          { path: 'agents', element: <Suspense fallback={<Fallback />}><Agents /></Suspense> },
          { path: 'products', element: <Suspense fallback={<Fallback />}><AdminProducts /></Suspense> },
          { path: 'orders', element: <Suspense fallback={<Fallback />}><AdminOrders /></Suspense> },
          { path: 'payments', element: <Suspense fallback={<Fallback />}><Payments /></Suspense> },
          { path: 'withdrawals', element: <Suspense fallback={<Fallback />}><AdminWithdrawals /></Suspense> },
          { path: 'promotions', element: <Suspense fallback={<Fallback />}><Promotions /></Suspense> },
          { path: 'reports', element: <Suspense fallback={<Fallback />}><Reports /></Suspense> },
          { path: 'audit-logs', element: <Suspense fallback={<Fallback />}><AuditLogs /></Suspense> },
          { path: 'settings', element: <Suspense fallback={<Fallback />}><AdminSettings /></Suspense> },
        ],
      },
      {
        path: '*',
        element: <Suspense fallback={<Fallback />}><NotFound /></Suspense>,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
