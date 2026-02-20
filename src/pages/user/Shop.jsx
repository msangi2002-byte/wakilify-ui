import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Settings, ShoppingBag, Image as ImageIcon, Plus, ChevronDown, MapPin, Store } from 'lucide-react';
import { getProducts, searchProducts, getProductsByCategory, getTrendingProducts } from '@/lib/api/products';
import { searchBusinesses } from '@/lib/api/businesses';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useAuthStore } from '@/store/auth.store';
import { ROLES } from '@/types/roles';
import { ShopGridSkeleton } from '@/components/ui/ShopGridSkeleton';
import { ShopTrendingSkeleton } from '@/components/ui/ShopTrendingSkeleton';
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
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

function ProductCard({ product, size = 'normal' }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const getProductImage = () => {
    if (product.thumbnail) return product.thumbnail;
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find((img) => img.isPrimary);
      return primaryImage ? primaryImage.url : product.images[0].url;
    }
    return null;
  };
  const productImage = getProductImage();

  const isCompact = size === 'compact';

  return (
    <div
      className={`shop-mp-card ${isCompact ? 'compact' : ''}`}
      onClick={() => navigate(`/app/shop/${product.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/shop/${product.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="shop-mp-card-image">
        {productImage && !imageError ? (
          <img
            src={productImage}
            alt={product.name}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="shop-mp-card-placeholder">
            <ImageIcon size={isCompact ? 24 : 32} />
          </div>
        )}
      </div>
      <div className="shop-mp-card-body">
        <span className="shop-mp-card-title">{product.name}</span>
        <span className="shop-mp-card-seller">{product.business?.name || 'Business'}</span>
        {(product.business?.region || product.business?.district) && (
          <span className="shop-mp-card-location">
            <MapPin size={12} />
            {[product.business?.district, product.business?.region].filter(Boolean).join(', ')}
          </span>
        )}
        <span className="shop-mp-card-price">{formatCurrency(product.price)}</span>
      </div>
    </div>
  );
}

/** Group products by business for search results (show shop info + products per shop) */
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

export default function Shop() {
  const { user } = useAuthStore();
  const isBusiness = String(user?.role ?? '').toLowerCase() === ROLES.BUSINESS;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
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
          matchingShops: Array.isArray(businessesRes?.content) ? businessesRes.content : Array.isArray(businessesRes) ? businessesRes : [],
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

  const products = productsData?.products ?? [];
  const matchingShops = productsData?.matchingShops ?? [];
  const error = productsError ? getApiErrorMessage(productsError, 'Failed to load products') : '';

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price_asc') return (a.price ?? 0) - (b.price ?? 0);
    if (sortBy === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const sortLabel = SORT_OPTIONS.find((o) => o.id === sortBy)?.label ?? 'Sort';

  return (
    <div className="shop-mp-page">
      <aside className="shop-mp-sidebar">
        <div className="shop-mp-sidebar-header">
          <h1 className="shop-mp-sidebar-title">Marketplace</h1>
          <Link
            to={isBusiness ? '/business/products/new' : '/app/settings#marketplace'}
            className="shop-mp-sell-btn"
          >
            <Plus size={20} />
            {isBusiness ? 'List item' : 'Start selling'}
          </Link>
        </div>

        <nav className="shop-mp-sidebar-nav" aria-label="Product categories">
          <span className="shop-mp-sidebar-label">Categories</span>
          <div className="shop-mp-categories-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`shop-mp-sidebar-link ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </nav>

      </aside>

      <main className="shop-mp-main">
        <div className="shop-mp-toolbar">
          <div className="shop-mp-search">
            <Search size={20} className="shop-mp-search-icon" />
            <input
              type="search"
              className="shop-mp-search-input"
              placeholder="Search for products or shop names"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search marketplace"
            />
          </div>
          <div className="shop-mp-toolbar-right">
            <div className="shop-mp-sort-wrap">
              <span className="shop-mp-sort-label">Sort by</span>
              <button
                type="button"
                className="shop-mp-sort-btn"
                onClick={() => setSortOpen((o) => !o)}
                aria-expanded={sortOpen}
                title="Order products: Newest, Price low to high, or Price high to low"
              >
                {sortLabel}
                <ChevronDown size={18} />
              </button>
              {sortOpen && (
                <>
                  <div className="shop-mp-sort-backdrop" onClick={() => setSortOpen(false)} aria-hidden="true" />
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
            <Link
              to="/app/settings#marketplace"
              className="shop-mp-settings-link"
              title="Notifications, checkout address & payment preferences"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>

        {trending.length > 0 && !search.trim() && category === 'all' && (
          <section className="shop-mp-section">
            <h2 className="shop-mp-section-title">Trending</h2>
            <div className="shop-mp-trending">
              {trendingLoading ? (
                <ShopTrendingSkeleton cards={6} />
              ) : (
                trending.map((p) => (
                  <ProductCard key={p.id} product={p} size="compact" />
                ))
              )}
            </div>
          </section>
        )}

        <section className="shop-mp-section">
          <h2 className="shop-mp-section-title">
            {search.trim() ? 'Search results' : category === 'all' ? 'All listings' : category}
          </h2>

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
                      <h3 className="shop-mp-section-title" style={{ marginBottom: '12px' }}>Shops</h3>
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
                    <h3 className="shop-mp-section-title" style={{ marginBottom: '12px', marginTop: matchingShops.length > 0 ? '24px' : 0 }}>
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
                          <ProductCard key={product.id} product={product} />
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
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
