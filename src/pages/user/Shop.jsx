import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Settings,
  ShoppingBag,
  Plus,
  ChevronDown,
  MapPin,
  Store,
  TrendingUp,
  Star,
  Zap,
} from 'lucide-react';
import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  getTrendingProducts,
  getTopSellingProducts,
  getFeaturedProducts,
} from '@/lib/api/products';
import { searchBusinesses } from '@/lib/api/businesses';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useAuthStore } from '@/store/auth.store';
import { ROLES } from '@/types/roles';
import { ShopGridSkeleton } from '@/components/ui/ShopGridSkeleton';
import { ShopTrendingSkeleton } from '@/components/ui/ShopTrendingSkeleton';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import '@/styles/user-app.css';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Electronics', label: 'Electronics' },
  { id: 'Clothing', label: 'Fashion' },
  { id: 'Food & Beverage', label: 'Food & Beverage' },
  { id: 'Home', label: 'Home' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Other', label: 'Other' },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

/** Group products by business for search results */
function groupProductsByBusiness(products) {
  const byBusiness = new Map();
  for (const p of products) {
    const biz = p.business;
    const key = biz?.id ?? 'unknown';
    if (!byBusiness.has(key)) {
      byBusiness.set(key, { business: biz || { name: 'Shop', id: key }, products: [] });
    }
    byBusiness.get(key).products.push(p);
  }
  return Array.from(byBusiness.values());
}

function toProductList(data) {
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
}

/** Section header with icon for marketplace sections */
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="shop-mp-section-header">
      <span className="shop-mp-section-icon">
        <Icon size={22} strokeWidth={2.2} />
      </span>
      <div>
        <h2 className="shop-mp-section-title">{title}</h2>
        {subtitle && <p className="shop-mp-section-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Shop() {
  const { user } = useAuthStore();
  const isBusiness = String(user?.role ?? '').toLowerCase() === ROLES.BUSINESS;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data: productsData,
    isPending: loading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['shop', 'products', debouncedSearch, category],
    queryFn: async () => {
      const query = debouncedSearch;
      if (query) {
        const [productsRes, businessesRes] = await Promise.all([
          searchProducts(query, { page: 0, size: 60 }),
          searchBusinesses(query, { page: 0, size: 10 }),
        ]);
        return {
          products: toProductList(productsRes),
          matchingShops: Array.isArray(businessesRes?.content)
            ? businessesRes.content
            : Array.isArray(businessesRes)
              ? businessesRes
              : [],
        };
      }
      if (category !== 'all') {
        const data = await getProductsByCategory(category, { page: 0, size: 60 });
        return { products: toProductList(data), matchingShops: [] };
      }
      const data = await getProducts({ page: 0, size: 60 });
      return { products: toProductList(data), matchingShops: [] };
    },
  });

  const { data: trending = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['shop', 'trending'],
    queryFn: () => getTrendingProducts({ page: 0, size: 8 }),
    select: (data) => toProductList(data),
  });

  const { data: topSelling = [], isLoading: topSellingLoading } = useQuery({
    queryKey: ['shop', 'top-selling'],
    queryFn: () => getTopSellingProducts({ page: 0, size: 8 }),
    select: (data) => toProductList(data),
  });

  const { data: featured = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['shop', 'featured'],
    queryFn: () => getFeaturedProducts({ page: 0, size: 8 }),
    select: (data) => toProductList(data),
  });

  const products = productsData?.products ?? [];
  const matchingShops = productsData?.matchingShops ?? [];
  const rawError = productsError ? getApiErrorMessage(productsError, 'Failed to load products') : '';
  const isNetworkError = rawError.toLowerCase().includes('network') || productsError?.message?.toLowerCase().includes('network');
  const error = isNetworkError
    ? 'Cannot reach the server. Make sure the backend is running (e.g. port 8080) and that VITE_API_URL in .env points to it (e.g. http://localhost:8080/api/v1).'
    : rawError;

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'popular') return (b.ordersCount ?? 0) - (a.ordersCount ?? 0);
    if (sortBy === 'price_asc') return (a.price ?? 0) - (b.price ?? 0);
    if (sortBy === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const sortLabel = SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? 'Sort';
  const showHeroSections = !search.trim() && category === 'all';
  const listingTitle = search.trim()
    ? 'Search results'
    : category === 'all'
      ? 'All listings'
      : category;
  const productCount = sortedProducts.length;

  return (
    <div className="shop-mp-page shop-mp-kikuu shop-mp-mic">
      {/* Top bar – Alibaba-style: title + search + actions */}
      <header className="shop-mp-topbar">
        <div className="shop-mp-topbar-inner">
          <Link to="/app/shop" className="shop-mp-brand">
            <ShoppingBag size={24} aria-hidden />
            <span>Marketplace</span>
          </Link>
          <div className="shop-mp-search-wrap">
            <Search size={20} className="shop-mp-search-icon" aria-hidden />
            <input
              type="search"
              className="shop-mp-search-input"
              placeholder="Search products or shops..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search marketplace"
            />
          </div>
          <div className="shop-mp-topbar-actions">
            <Link
              to={isBusiness ? '/business/products/new' : '/app/settings#marketplace'}
              className="shop-mp-sell-btn"
            >
              <Plus size={18} />
              {isBusiness ? 'List item' : 'Sell'}
            </Link>
            <Link to="/app/cart" className="shop-mp-topbar-icon" title="Cart">
              <ShoppingBag size={20} />
            </Link>
            <Link to="/app/settings#marketplace" className="shop-mp-topbar-icon" title="Settings">
              <Settings size={20} />
            </Link>
          </div>
        </div>
      </header>

      {/* Category strip – horizontal like Alibaba */}
      <nav className="shop-mp-category-bar" aria-label="Categories">
        <div className="shop-mp-category-strip">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`shop-mp-cat-pill ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="shop-mp-main">
        <div className="shop-mp-content">
          {/* Hero – compact, only when no search */}
          {showHeroSections && (
            <section className="shop-mp-hero" aria-label="Marketplace hero">
              <div className="shop-mp-hero-content">
                <h2 className="shop-mp-hero-title">Discover. Shop. Sell.</h2>
                <p className="shop-mp-hero-subtitle">
                  Tanzania’s marketplace — verified businesses. Add to cart or buy now.
                </p>
                <div className="shop-mp-hero-actions">
                  <Link
                    to={isBusiness ? '/business/products' : '/app/settings#marketplace'}
                    className="shop-mp-hero-cta"
                  >
                    {isBusiness ? 'Manage products' : 'Start selling'}
                  </Link>
                  <Link to="/app/cart" className="shop-mp-hero-cta secondary">
                    View cart
                  </Link>
                </div>
              </div>
            </section>
          )}

        {/* Top Sells – only when no search, category all */}
        {showHeroSections && (topSelling.length > 0 || topSellingLoading) && (
          <section className="shop-mp-section shop-mp-section-highlight" aria-label="Top selling products">
            <SectionHeader
              icon={Zap}
              title="Top Sells"
              subtitle="Best sellers this period"
            />
            <div className="shop-mp-trending shop-mp-row-scroll">
              {topSellingLoading ? (
                <ShopTrendingSkeleton cards={6} />
              ) : (
                topSelling.map((p) => (
                  <MarketplaceProductCard key={p.id} product={p} size="compact" showSoldBadge />
                ))
              )}
            </div>
          </section>
        )}

        {/* Top Trends – only when no search, category all */}
        {showHeroSections && (trending.length > 0 || trendingLoading) && (
          <section className="shop-mp-section" aria-label="Trending products">
            <SectionHeader
              icon={TrendingUp}
              title="Top Trends"
              subtitle="Most viewed right now"
            />
            <div className="shop-mp-trending shop-mp-row-scroll">
              {trendingLoading ? (
                <ShopTrendingSkeleton cards={6} />
              ) : (
                trending.map((p) => (
                  <MarketplaceProductCard key={p.id} product={p} size="compact" />
                ))
              )}
            </div>
          </section>
        )}

        {/* Featured / Picked for you */}
        {showHeroSections && (featured.length > 0 || featuredLoading) && (
          <section className="shop-mp-section" aria-label="Featured products">
            <SectionHeader
              icon={Star}
              title="Picked for you"
              subtitle="Featured by sellers"
            />
            <div className="shop-mp-trending shop-mp-row-scroll">
              {featuredLoading ? (
                <ShopTrendingSkeleton cards={6} />
              ) : (
                featured.map((p) => (
                  <MarketplaceProductCard key={p.id} product={p} size="compact" />
                ))
              )}
            </div>
          </section>
        )}

        {/* Catalog: left filters (MIC-style) + main grid */}
        <div className="shop-mp-catalog-layout">
          <aside className="shop-mp-filters" aria-label="Refine results">
            <details className="shop-mp-filters-mobile">
              <summary className="shop-mp-filters-mobile-summary">Filter &amp; sort</summary>
              <div className="shop-mp-filters-mobile-body">
                <p className="shop-mp-filter-heading">Sort by</p>
                <div className="shop-mp-filter-stack">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`shop-mp-filter-option ${sortBy === opt.id ? 'active' : ''}`}
                      onClick={() => setSortBy(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            <div className="shop-mp-filters-desktop">
              <div className="shop-mp-filter-block">
                <p className="shop-mp-filter-heading">Product categories</p>
                <div className="shop-mp-filter-stack">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`shop-mp-filter-option ${category === cat.id ? 'active' : ''}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="shop-mp-filter-block">
                <p className="shop-mp-filter-heading">Sort by</p>
                <div className="shop-mp-filter-stack">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`shop-mp-filter-option ${sortBy === opt.id ? 'active' : ''}`}
                      onClick={() => setSortBy(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="shop-mp-listing">
            <div className="shop-mp-listing-header">
              <div className="shop-mp-listing-heading">
                <h2 className="shop-mp-listing-title">{listingTitle}</h2>
                <p className="shop-mp-result-count">
                  {productCount} product{productCount !== 1 ? 's' : ''}
                  {search.trim() && matchingShops.length > 0
                    ? ` · ${matchingShops.length} shop${matchingShops.length !== 1 ? 's' : ''}`
                    : ''}
                </p>
              </div>
              <div className="shop-mp-listing-sort-mobile">
                <div className="shop-mp-sort-wrap">
                  <span className="shop-mp-sort-label">Sort</span>
                  <button
                    type="button"
                    className="shop-mp-sort-btn"
                    onClick={() => setSortOpen((o) => !o)}
                    aria-expanded={sortOpen}
                    title="Sort products"
                  >
                    {sortLabel}
                    <ChevronDown size={18} />
                  </button>
                  {sortOpen && (
                    <>
                      <div
                        className="shop-mp-sort-backdrop"
                        onClick={() => setSortOpen(false)}
                        aria-hidden="true"
                      />
                      <div className="shop-mp-sort-dropdown" role="menu">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            role="menuitem"
                            className={`shop-mp-sort-item ${sortBy === opt.id ? 'active' : ''}`}
                            onClick={() => {
                              setSortBy(opt.id);
                              setSortOpen(false);
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

        <section className="shop-mp-section shop-mp-listing-section" aria-label="All products">

          {loading ? (
            <ShopGridSkeleton cards={8} />
          ) : error ? (
            <div className="shop-mp-empty">
              <ShoppingBag size={48} className="shop-mp-empty-icon" />
              <p className="shop-mp-empty-title">Error loading products</p>
              <p className="shop-mp-empty-desc">{error}</p>
              <button type="button" className="shop-mp-empty-btn" onClick={() => refetchProducts()}>
                Try again
              </button>
            </div>
          ) : sortedProducts.length === 0 && matchingShops.length === 0 ? (
            <div className="shop-mp-empty">
              <ShoppingBag size={48} className="shop-mp-empty-icon" />
              <p className="shop-mp-empty-title">No products or shops found</p>
              <p className="shop-mp-empty-desc">
                {search.trim() || category !== 'all'
                  ? 'Try a different search or category.'
                  : 'No products available yet. Check back later!'}
              </p>
              {(search.trim() || category !== 'all') && (
                <button
                  type="button"
                  className="shop-mp-empty-btn"
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : search.trim() ? (
            (() => {
              const byShop = groupProductsByBusiness(sortedProducts);
              return (
                <div className="shop-mp-search-by-shop">
                  {matchingShops.length > 0 && (
                    <div className="shop-mp-shop-block">
                      <h3 className="shop-mp-section-title" style={{ marginBottom: '12px' }}>
                        Shops
                      </h3>
                      <div className="shop-mp-shops-row">
                        {matchingShops.map((biz) => (
                          <Link
                            key={biz.id}
                            to={`/app/shop/business/${biz.id}`}
                            className="shop-mp-shop-card-link"
                          >
                            <div className="shop-mp-shop-header shop-mp-shop-card">
                              {biz.logo ? (
                                <img src={biz.logo} alt="" className="shop-mp-shop-logo" />
                              ) : (
                                <div className="shop-mp-shop-logo-placeholder">
                                  <Store size={24} />
                                </div>
                              )}
                              <div className="shop-mp-shop-info">
                                <span className="shop-mp-shop-name">{biz.name || 'Shop'}</span>
                                {(biz.region || biz.district) && (
                                  <span className="shop-mp-shop-location">
                                    <MapPin size={14} />
                                    {[biz.district, biz.region].filter(Boolean).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {byShop.length > 0 && (
                    <h3
                      className="shop-mp-section-title"
                      style={{
                        marginBottom: '12px',
                        marginTop: matchingShops.length > 0 ? '24px' : 0,
                      }}
                    >
                      Products by shop
                    </h3>
                  )}
                  {byShop.map(({ business, products: shopProducts }) => (
                    <div key={business?.id ?? 'shop'} className="shop-mp-shop-block">
                      <div className="shop-mp-shop-header">
                        {business?.logo ? (
                          <img src={business.logo} alt="" className="shop-mp-shop-logo" />
                        ) : (
                          <div className="shop-mp-shop-logo-placeholder">
                            <Store size={24} />
                          </div>
                        )}
                        <div className="shop-mp-shop-info">
                          <Link
                            to={`/app/shop/business/${business?.id}`}
                            className="shop-mp-shop-name-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="shop-mp-shop-name">{business?.name || 'Shop'}</span>
                          </Link>
                          {(business?.region || business?.district) && (
                            <span className="shop-mp-shop-location">
                              <MapPin size={14} />
                              {[business?.district, business?.region].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shop-mp-grid shop-mp-shop-grid">
                        {shopProducts.map((product) => (
                          <MarketplaceProductCard
                            key={product.id}
                            product={product}
                            showSoldBadge
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="shop-mp-grid">
              {sortedProducts.map((product) => (
                <MarketplaceProductCard key={product.id} product={product} showSoldBadge />
              ))}
            </div>
          )}
        </section>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
