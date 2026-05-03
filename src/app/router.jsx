import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from '../App';
import AuthLayout from '@/layouts/AuthLayout';
import UserLayout from '@/layouts/UserLayout';
import GroupsLayout from '@/layouts/GroupsLayout';
import BusinessLayout from '@/layouts/BusinessLayout';
import AgentLayout from '@/layouts/AgentLayout';
import AdminLayout from '@/layouts/AdminLayout';
import { AuthGuard } from '@/app/guards/AuthGuard';
import { RoleGuard } from '@/app/guards/RoleGuard';
import { GuestOnly } from '@/app/guards/GuestOnly';
import { OnboardingGuard } from '@/app/guards/OnboardingGuard';
import { ROLES } from '@/types/roles';
import { RouterErrorBoundary } from '@/components/RouterErrorBoundary';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

const Register = lazy(() => lazyWithRetry(() => import('@/pages/auth/Register')));
const Otp = lazy(() => lazyWithRetry(() => import('@/pages/auth/Otp')));
const Login = lazy(() => lazyWithRetry(() => import('@/pages/auth/Login')));
const Impersonate = lazy(() => lazyWithRetry(() => import('@/pages/auth/Impersonate')));

const Home = lazy(() => lazyWithRetry(() => import('@/pages/user/Home')));
const Explore = lazy(() => lazyWithRetry(() => import('@/pages/user/Explore')));
const Create = lazy(() => lazyWithRetry(() => import('@/pages/user/Create')));
const Reels = lazy(() => lazyWithRetry(() => import('@/pages/user/Reels')));
const Stories = lazy(() => lazyWithRetry(() => import('@/pages/user/Stories')));
const StoryCreate = lazy(() => lazyWithRetry(() => import('@/pages/user/StoryCreate')));
const StoryViewer = lazy(() => lazyWithRetry(() => import('@/pages/user/StoryViewer')));
const Shop = lazy(() => lazyWithRetry(() => import('@/pages/user/Shop')));
const ShopBusiness = lazy(() => lazyWithRetry(() => import('@/pages/user/ShopBusiness')));
const ProductDetails = lazy(() => lazyWithRetry(() => import('@/pages/user/ProductDetails')));
const Cart = lazy(() => lazyWithRetry(() => import('@/pages/user/Cart')));
const Checkout = lazy(() => lazyWithRetry(() => import('@/pages/user/Checkout')));
const Orders = lazy(() => lazyWithRetry(() => import('@/pages/user/Orders')));
const Inquiries = lazy(() => lazyWithRetry(() => import('@/pages/user/Inquiries')));
const Live = lazy(() => lazyWithRetry(() => import('@/pages/user/Live')));
const LiveViewer = lazy(() => lazyWithRetry(() => import('@/pages/user/LiveViewer')));
const Wallet = lazy(() => lazyWithRetry(() => import('@/pages/user/Wallet')));
const BuyCoins = lazy(() => lazyWithRetry(() => import('@/pages/user/BuyCoins')));
const Messages = lazy(() => lazyWithRetry(() => import('@/pages/user/Messages')));
const Chat = lazy(() => lazyWithRetry(() => import('@/pages/user/Chat')));
const Call = lazy(() => lazyWithRetry(() => import('@/pages/user/Call')));
const Profile = lazy(() => lazyWithRetry(() => import('@/pages/user/Profile')));
const Friends = lazy(() => lazyWithRetry(() => import('@/pages/user/Friends')));
const Groups = lazy(() => lazyWithRetry(() => import('@/pages/user/Groups')));
const GroupDetail = lazy(() => lazyWithRetry(() => import('@/pages/user/GroupDetail')));
const GroupCreate = lazy(() => lazyWithRetry(() => import('@/pages/user/GroupCreate')));
const UserSettings = lazy(() => lazyWithRetry(() => import('@/pages/user/Settings')));
const RegisterAgent = lazy(() => lazyWithRetry(() => import('@/pages/user/RegisterAgent')));
const Notifications = lazy(() => lazyWithRetry(() => import('@/pages/user/Notifications')));
const Onboarding = lazy(() => lazyWithRetry(() => import('@/pages/user/Onboarding')));
const Boost = lazy(() => lazyWithRetry(() => import('@/pages/user/Boost')));
const PostDetail = lazy(() => lazyWithRetry(() => import('@/pages/user/PostDetail')));

const BusinessDashboard = lazy(() => lazyWithRetry(() => import('@/pages/business/Dashboard')));
const BusinessProducts = lazy(() => lazyWithRetry(() => import('@/pages/business/Products')));
const ProductNew = lazy(() => lazyWithRetry(() => import('@/pages/business/ProductNew')));
const ProductEdit = lazy(() => lazyWithRetry(() => import('@/pages/business/ProductEdit')));
const BusinessOrders = lazy(() => lazyWithRetry(() => import('@/pages/business/Orders')));
const BusinessInquiries = lazy(() => lazyWithRetry(() => import('@/pages/business/Inquiries')));
const BusinessFeedback = lazy(() => lazyWithRetry(() => import('@/pages/business/Feedback')));
const Stats = lazy(() => lazyWithRetry(() => import('@/pages/business/Stats')));
const BusinessSettings = lazy(() => lazyWithRetry(() => import('@/pages/business/Settings')));

const AgentDashboard = lazy(() => lazyWithRetry(() => import('@/pages/agent/Dashboard')));
const AgentRequests = lazy(() => lazyWithRetry(() => import('@/pages/agent/Requests')));
const Activate = lazy(() => lazyWithRetry(() => import('@/pages/agent/Activate')));
const Commissions = lazy(() => lazyWithRetry(() => import('@/pages/agent/Commissions')));
const AgentWithdrawals = lazy(() => lazyWithRetry(() => import('@/pages/agent/Withdrawals')));
const AgentRequestDetail = lazy(() => lazyWithRetry(() => import('@/pages/agent/RequestDetail')));

const AdminDashboard = lazy(() => lazyWithRetry(() => import('@/pages/admin/Dashboard')));
const Users = lazy(() => lazyWithRetry(() => import('@/pages/admin/Users')));
const Businesses = lazy(() => lazyWithRetry(() => import('@/pages/admin/Businesses')));
const Agents = lazy(() => lazyWithRetry(() => import('@/pages/admin/Agents')));
const AdminProducts = lazy(() => lazyWithRetry(() => import('@/pages/admin/Products')));
const AdminOrders = lazy(() => lazyWithRetry(() => import('@/pages/admin/Orders')));
const Payments = lazy(() => lazyWithRetry(() => import('@/pages/admin/Payments')));
const AdminWithdrawals = lazy(() => lazyWithRetry(() => import('@/pages/admin/Withdrawals')));
const Promotions = lazy(() => lazyWithRetry(() => import('@/pages/admin/Promotions')));
const Reports = lazy(() => lazyWithRetry(() => import('@/pages/admin/Reports')));
const AuditLogs = lazy(() => lazyWithRetry(() => import('@/pages/admin/AuditLogs')));
const AdminSettings = lazy(() => lazyWithRetry(() => import('@/pages/admin/Settings')));
const AgentPackages = lazy(() => lazyWithRetry(() => import('@/pages/admin/AgentPackages'));
const BusinessRegistrationPlans = lazy(() => lazyWithRetry(() => import('@/pages/admin/BusinessRegistrationPlans')));
const AdminRoles = lazy(() => lazyWithRetry(() => import('@/pages/admin/AdminRoles')));
const MapView = lazy(() => lazyWithRetry(() => import('@/pages/admin/MapView')));
const AudienceAnalytics = lazy(() => lazyWithRetry(() => import('@/pages/admin/AudienceAnalytics')));

const NotFound = lazy(() => lazyWithRetry(() => import('@/pages/NotFound')));

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      <span className="text-gray-500 font-medium">Loading...</span>
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <RouterErrorBoundary />,
    children: [
      {
        path: 'auth',
        element: (
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        ),
        children: [
          { path: 'register', element: <Suspense fallback={<Fallback />}><Register /></Suspense> },
          { path: 'otp', element: <Suspense fallback={<Fallback />}><Otp /></Suspense> },
          { path: 'login', element: <Suspense fallback={<Fallback />}><Login /></Suspense> },
          { path: 'impersonate', element: <Suspense fallback={<Fallback />}><Impersonate /></Suspense> },
        ],
      },
      {
        path: 'app',
        element: (
          <AuthGuard>
            <OnboardingGuard />
          </AuthGuard>
        ),
        children: [
          { path: 'onboarding', element: <Suspense fallback={<Fallback />}><Onboarding /></Suspense> },
          {
            path: '',
            element: <UserLayout />,
            children: [
              { index: true, element: <Suspense fallback={<Fallback />}><Home /></Suspense> },
          { path: 'explore', element: <Suspense fallback={<Fallback />}><Explore /></Suspense> },
          { path: 'explore/hashtag/:tagName', element: <Suspense fallback={<Fallback />}><Explore /></Suspense> },
          { path: 'create', element: <Suspense fallback={<Fallback />}><Create /></Suspense> },
          { path: 'reels', element: <Suspense fallback={<Fallback />}><Reels /></Suspense> },
          { path: 'stories', element: <Suspense fallback={<Fallback />}><Stories /></Suspense> },
          { path: 'stories/create', element: <Suspense fallback={<Fallback />}><StoryCreate /></Suspense> },
          { path: 'stories/view/:userId', element: <Suspense fallback={<Fallback />}><StoryViewer /></Suspense> },
          { path: 'shop', element: <Suspense fallback={<Fallback />}><Shop /></Suspense> },
          { path: 'shop/settings', element: <Navigate to="/app/settings#marketplace" replace /> },
          { path: 'shop/business/:id', element: <Suspense fallback={<Fallback />}><ShopBusiness /></Suspense> },
          { path: 'shop/:id', element: <Suspense fallback={<Fallback />}><ProductDetails /></Suspense> },
          { path: 'boost', element: <Suspense fallback={<Fallback />}><Boost /></Suspense> },
          { path: 'post/:postId', element: <Suspense fallback={<Fallback />}><PostDetail /></Suspense> },
          { path: 'orders', element: <Suspense fallback={<Fallback />}><Orders /></Suspense> },
          { path: 'inquiries', element: <Suspense fallback={<Fallback />}><Inquiries /></Suspense> },
          { path: 'notifications', element: <Suspense fallback={<Fallback />}><Notifications /></Suspense> },
          { path: 'cart', element: <Suspense fallback={<Fallback />}><Cart /></Suspense> },
          { path: 'checkout', element: <Suspense fallback={<Fallback />}><Checkout /></Suspense> },
          { path: 'live', element: <Suspense fallback={<Fallback />}><Live /></Suspense> },
          { path: 'live/:id', element: <Suspense fallback={<Fallback />}><LiveViewer /></Suspense> },
          { path: 'wallet', element: <Suspense fallback={<Fallback />}><Wallet /></Suspense> },
          { path: 'wallet/buy-coins', element: <Suspense fallback={<Fallback />}><BuyCoins /></Suspense> },
          { path: 'messages', element: <Suspense fallback={<Fallback />}><Messages /></Suspense> },
          { path: 'chat/:id', element: <Suspense fallback={<Fallback />}><Chat /></Suspense> },
          { path: 'call', element: <Suspense fallback={<Fallback />}><Call /></Suspense> },
          { path: 'profile/:userId?', element: <Suspense fallback={<Fallback />}><Profile /></Suspense> },
          { path: 'friends', element: <Suspense fallback={<Fallback />}><Friends /></Suspense> },
          {
            path: 'groups',
            element: <Suspense fallback={<Fallback />}><GroupsLayout /></Suspense>,
            children: [
              { index: true, element: <Suspense fallback={<Fallback />}><Groups /></Suspense> },
              { path: 'create', element: <Suspense fallback={<Fallback />}><GroupCreate /></Suspense> },
              { path: ':id', element: <Suspense fallback={<Fallback />}><GroupDetail /></Suspense> },
            ],
          },
          { path: 'settings', element: <Suspense fallback={<Fallback />}><UserSettings /></Suspense> },
          { path: 'register-agent', element: <Suspense fallback={<Fallback />}><RegisterAgent /></Suspense> },
            ],
          },
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
          { path: 'inquiries', element: <Suspense fallback={<Fallback />}><BusinessInquiries /></Suspense> },
          { path: 'feedback', element: <Suspense fallback={<Fallback />}><BusinessFeedback /></Suspense> },
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
          { path: 'requests', element: <Suspense fallback={<Fallback />}><AgentRequests /></Suspense> },
          { path: 'requests/:id', element: <Suspense fallback={<Fallback />}><AgentRequestDetail /></Suspense> },
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
          { path: 'audience-analytics', element: <Suspense fallback={<Fallback />}><AudienceAnalytics /></Suspense> },
          { path: 'reports', element: <Suspense fallback={<Fallback />}><Reports /></Suspense> },
          { path: 'map', element: <Suspense fallback={<Fallback />}><MapView /></Suspense> },
          { path: 'audit-logs', element: <Suspense fallback={<Fallback />}><AuditLogs /></Suspense> },
          { path: 'agent-packages', element: <Suspense fallback={<Fallback />}><AgentPackages /></Suspense> },
          { path: 'business-registration-plans', element: <Suspense fallback={<Fallback />}><BusinessRegistrationPlans /></Suspense> },
          { path: 'roles', element: <Suspense fallback={<Fallback />}><AdminRoles /></Suspense> },
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
