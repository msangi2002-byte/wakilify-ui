import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  DollarSign,
  Users,
  Search,
  Bell,
  Home,
  UserCircle,
  PlayCircle,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { AppProviders } from '@/providers/AppProviders';
import { APP_NAME, LOGO_PNG, LOGO_ICON } from '@/lib/constants/brand';
import '@/styles/global.css';
import '@/styles/landing.css';

function BrandLogo({ size = 40, className = '' }) {
  const [src, setSrc] = useState(LOGO_PNG);
  return (
    <img
      src={src}
      alt={APP_NAME}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', borderRadius: 8 }}
      onError={() => setSrc(LOGO_ICON)}
    />
  );
}

const navLinks = [
  { label: 'Home', href: '#' },
  { label: 'Feed', href: '#connect' },
  { label: 'Reels', href: '#connect' },
  { label: 'Marketplace', href: '#trade' },
];

const footerLinks = [
  { label: 'About Us', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Privacy Policy', href: '#' },
];

const feedPosts = [
  {
    id: '1',
    author: { name: 'Sarah M.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    text: 'Just got these from a shop I found on my feed! 🎧 Best purchase this week.',
    hasProductTag: true,
    productLabel: 'Wireless Headphones · TZS 85,000',
    likes: 124,
    comments: 18,
  },
  {
    id: '2',
    author: { name: 'Juma K.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    text: 'Weekend vibes in Dar. Who else is at the beach? ☀️',
    hasProductTag: false,
    likes: 89,
    comments: 12,
  },
  {
    id: '3',
    author: { name: 'Tech Gadgets Store', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', isBusiness: true },
    text: 'New drop! Tagged in the post – tap to shop.',
    hasProductTag: true,
    productLabel: 'Smart Watch · TZS 120,000',
    likes: 256,
    comments: 34,
  },
];

function LandingContent() {
  return (
    <div className="min-h-screen landing-gradient text-white overflow-x-hidden">
      {/* Soft glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-[10%] w-96 h-96 bg-[#7c3aed]/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-[15%] w-80 h-80 bg-[#d946ef]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#ec4899]/15 rounded-full blur-[90px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto min-w-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center overflow-hidden">
            <BrandLogo size={40} className="w-8 h-8" />
          </div>
          <span className="text-xl font-bold">{APP_NAME}</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-white/90 hover:text-white font-medium transition-colors">
              {link.label}
            </a>
          ))}
        </div>
        <Link
          to="/auth/login"
          className="px-6 py-2.5 rounded-xl bg-[#4078D0] hover:bg-[#2890D8] text-white font-semibold transition-all shadow-lg shadow-[#4078D0]/30"
        >
          Log In
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-4 sm:px-6 pt-6 sm:pt-8 pb-12 md:pt-16 md:pb-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 md:space-y-8 min-w-0"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Connect, Trade, and Earn with {APP_NAME}.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-lg font-medium">
              A social network where you share, follow, and discover – and shop straight from your feed. Like Facebook, plus marketplace and ways to earn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-[#4078D0] via-[#7c3aed] to-[#d946ef] text-white font-bold text-lg shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(217,70,239,0.35)] transition-all hover:scale-[1.02] border border-white/20"
              >
                Sign Up Now
              </Link>
              <a
                href="#connect"
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-transparent border-2 border-[#4078D0] text-white font-semibold hover:bg-[#4078D0]/10 transition-all"
              >
                See the Feed
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/85 text-sm font-medium">
              <span className="flex items-center gap-2"><Heart size={18} /> Like</span>
              <span className="flex items-center gap-2"><MessageCircle size={18} /> Comment</span>
              <span className="flex items-center gap-2"><Share2 size={18} /> Share</span>
            </div>
          </motion.div>

          {/* Phone mockups */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative flex justify-center items-center gap-2 sm:gap-3 md:gap-5 py-6 md:py-8"
          >
            {/* Phone 1 – Social / Feed */}
            <div className="relative w-[130px] sm:w-[152px] md:w-[190px] transform -rotate-[-8deg] shadow-2xl flex-shrink-0">
              <div className="rounded-[2.25rem] border-[8px] border-gray-800 bg-gray-900 overflow-hidden">
                <div className="relative aspect-[9/19] bg-[#FDFAFE] overflow-hidden">
                  <div className="h-9 px-2.5 flex items-center justify-between border-b border-gray-200 bg-white">
                    <span className="font-bold text-[11px] bg-gradient-to-r from-[#7c3aed] to-[#4078D0] bg-clip-text text-transparent">{APP_NAME}</span>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Search size={14} strokeWidth={2} />
                      <MessageCircle size={14} strokeWidth={2} />
                      <Bell size={14} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="h-8 px-2 flex items-center justify-around border-b border-gray-100 bg-white">
                    <Home size={18} className="text-[#7c3aed]" fill="currentColor" />
                    <UserCircle size={18} className="text-gray-400" />
                    <PlayCircle size={18} className="text-gray-400" />
                    <ShoppingBag size={18} className="text-gray-400" />
                    <Bell size={16} className="text-gray-400" />
                  </div>
                  <div className="flex gap-1.5 px-2 py-2 overflow-hidden bg-white border-b border-gray-100">
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-0.5">
                        <Plus size={14} className="text-[#7c3aed]" />
                      </div>
                      <span className="text-[7px] text-gray-600 block truncate">Create</span>
                    </div>
                    {['Ali K.', 'Sarah M.', 'Juma'].map((name) => (
                      <div key={name} className="flex-shrink-0 w-12 text-center">
                        <div className="w-11 h-11 rounded-full p-0.5 mx-auto mb-0.5 bg-gradient-to-br from-[#7c3aed] via-[#d946ef] to-[#ec4899]">
                          <div className="w-full h-full rounded-full bg-gray-200" />
                        </div>
                        <span className="text-[7px] text-gray-600 block truncate">{name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-2 py-2 flex items-center gap-2 bg-white border-b border-gray-100">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c3aed]/30 to-[#d946ef]/30 flex-shrink-0" />
                    <div className="flex-1 h-7 rounded-full bg-gray-100 flex items-center px-3">
                      <span className="text-[9px] text-gray-500">What&apos;s on your mind?</span>
                    </div>
                  </div>
                  <div className="bg-white pb-7">
                    <div className="px-2 py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#d946ef] flex items-center justify-center text-white font-bold text-[10px]">W</div>
                        <div>
                          <p className="text-[9px] font-semibold text-gray-800">{APP_NAME} Official</p>
                          <p className="text-[7px] text-gray-500">29 hrs</p>
                        </div>
                      </div>
                      <MoreHorizontal size={12} className="text-gray-400" />
                    </div>
                    <div className="h-20 bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#d946ef] rounded-none" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-white border-t border-gray-100 flex justify-around items-center px-2">
                    {['Home', 'Reels', 'Shop', 'Wallet', 'Me'].map((t) => (
                      <span key={t} className="text-[6px] text-gray-400">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2 – Marketplace */}
            <div className="relative w-[130px] sm:w-[152px] md:w-[190px] transform rotate-[6deg] shadow-2xl flex-shrink-0">
              <div className="rounded-[2.25rem] border-[8px] border-gray-800 bg-gray-900 overflow-hidden">
                <div className="relative aspect-[9/19] bg-[#FDFAFE] overflow-hidden">
                  <div className="h-9 px-2.5 flex items-center justify-between border-b border-gray-200 bg-white">
                    <span className="font-bold text-[11px] bg-gradient-to-r from-[#7c3aed] to-[#4078D0] bg-clip-text text-transparent">{APP_NAME}</span>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Search size={14} strokeWidth={2} />
                      <MessageCircle size={14} strokeWidth={2} />
                      <Bell size={14} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="h-8 px-2 flex items-center justify-around border-b border-gray-100 bg-white">
                    <Home size={18} className="text-gray-400" />
                    <UserCircle size={18} className="text-gray-400" />
                    <PlayCircle size={18} className="text-gray-400" />
                    <ShoppingBag size={18} className="text-[#7c3aed]" fill="currentColor" />
                    <Bell size={16} className="text-gray-400" />
                  </div>
                  <div className="px-2 py-2 bg-white pb-7">
                    <div className="flex gap-1 mb-2">
                      {['All', 'Women', 'Men', 'Tech'].map((c) => (
                        <span key={c} className="text-[7px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">{c}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
                          <div className="h-14 bg-gradient-to-br from-gray-100 to-gray-200" />
                          <div className="p-1">
                            <p className="text-[7px] text-gray-700 truncate">Product {i}</p>
                            <p className="text-[8px] font-semibold text-[#d946ef]">TZS {[15, 28, 42, 19][i - 1]}k</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-white border-t border-gray-100 flex justify-around items-center px-2">
                    {['Home', 'Reels', 'Shop', 'Wallet', 'Me'].map((t) => (
                      <span key={t} className="text-[6px] text-gray-400">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CONNECT */}
      <section id="connect" className="relative z-10 px-4 sm:px-6 py-10 md:py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Users className="text-[#7c3aed]" size={24} />
          <h2 className="text-xl sm:text-2xl font-bold">Connect – Your feed, your community</h2>
        </div>
        <p className="text-base text-white/90 font-medium mb-6 md:mb-8 max-w-2xl">
          Post, like, comment, and follow – just like on social media. Reels and stories keep the vibe alive.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {feedPosts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 hover:border-[#7c3aed]/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <img src={post.author.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{post.author.name}</p>
                  {post.author.isBusiness && <span className="text-[10px] text-[#f59e0b]">Business</span>}
                </div>
              </div>
              <p className="text-sm text-white/90 mb-3 line-clamp-2">{post.text}</p>
              {post.hasProductTag && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-[#7c3aed]/20 border border-[#7c3aed]/30 mb-3">
                  <ShoppingBag size={14} className="text-[#d946ef]" />
                  <span className="text-xs font-medium text-[#d946ef]">{post.productLabel}</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-white/85 text-xs font-medium">
                <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments}</span>
              </div>
            </motion.article>
          ))}
        </div>
        <p className="mt-5 text-base font-medium text-white/95">Products show up right in the feed – tap to shop without leaving the app.</p>
      </section>

      {/* TRADE */}
      <section id="trade" className="relative z-10 px-4 sm:px-6 py-10 md:py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="text-[#d946ef]" size={24} />
          <h2 className="text-xl sm:text-2xl font-bold">Trade – Shop without leaving your feed</h2>
        </div>
        <p className="text-base text-white/90 font-medium mb-6 md:mb-8 max-w-2xl">
          Browse marketplace, chat with sellers, and place orders. Ecommerce built into the same app you use to connect.
        </p>
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {['Shops & products', 'Product tags in posts', 'Buyer–seller chat', 'Order requests'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/30 flex items-center justify-center">
                  <ShoppingBag size={20} className="text-[#d946ef]" />
                </div>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[#ec4899] hover:bg-[#d946ef] text-white font-semibold transition-colors"
          >
            Explore Marketplace
          </Link>
        </div>
      </section>

      {/* EARN */}
      <section id="earn" className="relative z-10 px-4 sm:px-6 py-10 md:py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="text-[#f59e0b]" size={24} />
          <h2 className="text-xl sm:text-2xl font-bold">Earn – Agents & businesses</h2>
        </div>
        <p className="text-base text-white/90 font-medium mb-6 md:mb-8 max-w-2xl">
          Activate businesses as an agent and earn commissions. Or run your own shop with a subscription. Trust and growth in one place.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="flex-1 min-w-0 sm:min-w-[200px] rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <p className="text-[#f59e0b] font-semibold mb-1">Agents</p>
            <p className="text-sm text-white/85">Onboard businesses, verify, earn per activation & renewal.</p>
          </div>
          <div className="flex-1 min-w-0 sm:min-w-[200px] rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
            <p className="text-[#d946ef] font-semibold mb-1">Business owners</p>
            <p className="text-sm text-white/85">Sell in the marketplace, boost posts, manage orders.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/auth/login" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-gray-900 font-semibold transition-colors">
            Join as Agent
          </Link>
          <Link to="/auth/login" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#ec4899] hover:bg-[#d946ef] text-white font-semibold transition-colors border border-white/20">
            Start Selling
          </Link>
        </div>
      </section>

      {/* App tabs */}
      <div className="relative z-10 px-4 sm:px-6 py-6 md:py-8 max-w-7xl mx-auto">
        <p className="text-center text-white/70 text-sm font-medium mb-4">All in one app</p>
        <div className="max-w-md mx-auto flex justify-around items-center py-3 px-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
          {['Home', 'Reels', 'Marketplace', 'Messages', 'Wallet', 'Profile'].map((item) => (
            <span key={item} className="text-xs text-white/75 font-medium">{item}</span>
          ))}
        </div>
        <p className="text-center text-white/80 text-sm font-medium mt-6 max-w-xl mx-auto">
          Built for Tanzania. Trusted by sellers and buyers across Dar es Salaam, Mwanza, Arusha & beyond.
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col items-center justify-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-white/85 hover:text-white text-sm font-medium transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="text-center pb-6 text-white/70 text-sm font-medium">
          © {new Date().getFullYear()} {APP_NAME}. Social + Marketplace + Agent. Tanzania&apos;s Super App.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <AppProviders>
      {isLanding ? <LandingContent /> : <Outlet />}
    </AppProviders>
  );
}
