import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import UserLayout from '@/layouts/UserLayout';
import { AuthGuard } from '@/app/guards/AuthGuard';

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
const Settings = lazy(() => import('@/pages/user/Settings'));

const SuspenseWrapper = ({ children }) => <Suspense fallback={null}>{children}</Suspense>;

export function UserRoutes() {
  return (
    <Route element={<AuthGuard><UserLayout /></AuthGuard>}>
      <Route index element={<SuspenseWrapper><Home /></SuspenseWrapper>} />
      <Route path="explore" element={<SuspenseWrapper><Explore /></SuspenseWrapper>} />
      <Route path="create" element={<SuspenseWrapper><Create /></SuspenseWrapper>} />
      <Route path="reels" element={<SuspenseWrapper><Reels /></SuspenseWrapper>} />
      <Route path="stories" element={<SuspenseWrapper><Stories /></SuspenseWrapper>} />
      <Route path="shop" element={<SuspenseWrapper><Shop /></SuspenseWrapper>} />
      <Route path="shop/:id" element={<SuspenseWrapper><ProductDetails /></SuspenseWrapper>} />
      <Route path="cart" element={<SuspenseWrapper><Cart /></SuspenseWrapper>} />
      <Route path="checkout" element={<SuspenseWrapper><Checkout /></SuspenseWrapper>} />
      <Route path="live" element={<SuspenseWrapper><Live /></SuspenseWrapper>} />
      <Route path="live/:id" element={<SuspenseWrapper><LiveViewer /></SuspenseWrapper>} />
      <Route path="wallet" element={<SuspenseWrapper><Wallet /></SuspenseWrapper>} />
      <Route path="messages" element={<SuspenseWrapper><Messages /></SuspenseWrapper>} />
      <Route path="chat/:id" element={<SuspenseWrapper><Chat /></SuspenseWrapper>} />
      <Route path="profile" element={<SuspenseWrapper><Profile /></SuspenseWrapper>} />
      <Route path="settings" element={<SuspenseWrapper><Settings /></SuspenseWrapper>} />
    </Route>
  );
}
