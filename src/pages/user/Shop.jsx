import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Settings, ShoppingBag, Loader2, Image as ImageIcon } from 'lucide-react';
import { getProducts, searchProducts, getProductsByCategory } from '@/lib/api/products';
import { getApiErrorMessage } from '@/lib/utils/apiError';
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

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  
  // Get product image
  const getProductImage = () => {
    if (product.thumbnail) return product.thumbnail;
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary);
      return primaryImage ? primaryImage.url : product.images[0].url;
    }
    return null;
  };
  const productImage = getProductImage();

  return (
    <div 
      className="shop-product-card user-app-card" 
      onClick={() => navigate(`/app/shop/${product.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="shop-product-image-wrap">
        {productImage && !imageError ? (
          <img 
            src={productImage} 
            alt={product.name} 
            className="shop-product-image" 
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
            <ImageIcon size={32} style={{ color: '#d1d5db' }} />
          </div>
        )}
      </div>
      <div className="shop-product-info">
        <span className="shop-product-title">{product.name}</span>
        <span className="shop-product-seller">{product.business?.name || 'Business'}</span>
        <span className="shop-product-price">{formatCurrency(product.price)}</span>
      </div>
    </div>
  );
}

export default function Shop() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);

  useEffect(() => {
    // Debounce search
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      loadProducts();
    }, 500);

    setSearchDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [search, category]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (search.trim()) {
        // Search products (searches name, description, and business name)
        data = await searchProducts(search.trim());
      } else if (category !== 'all') {
        // Get products by category
        data = await getProductsByCategory(category);
      } else {
        // Get all products
        data = await getProducts({ page: 0, size: 50 });
      }
      
      const productList = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);
      setProducts(productList);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load products'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-page">
      <header className="shop-header">
        <div className="shop-header-top">
          <div>
            <h1 className="shop-title">Marketplace</h1>
            <p className="shop-subtitle">Discover and buy from businesses in your network</p>
          </div>
          <Link to="/app/settings#marketplace" className="shop-settings-link">
            <Settings size={18} />
            Settings
          </Link>
        </div>

        <div className="shop-toolbar">
          <div className="shop-search">
            <Search size={20} className="shop-search-icon" />
            <input
              type="search"
              className="shop-search-input"
              placeholder="Search products or sellers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search marketplace"
            />
          </div>
          <div className="shop-categories" role="tablist" aria-label="Categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={category === cat.id}
                className={`shop-category-btn ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="shop-content">
        {loading ? (
          <div className="shop-empty user-app-card" style={{ padding: '48px' }}>
            <Loader2 size={48} className="shop-empty-icon icon-spin" style={{ color: '#7c3aed' }} />
            <p className="shop-empty-title">Loading products...</p>
          </div>
        ) : error ? (
          <div className="shop-empty user-app-card">
            <ShoppingBag size={48} className="shop-empty-icon" />
            <p className="shop-empty-title">Error loading products</p>
            <p className="shop-empty-desc">{error}</p>
            <button
              type="button"
              className="shop-empty-btn"
              onClick={loadProducts}
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="shop-empty user-app-card">
            <ShoppingBag size={48} className="shop-empty-icon" />
            <p className="shop-empty-title">No products found</p>
            <p className="shop-empty-desc">
              {search.trim() || category !== 'all' 
                ? 'Try a different search or category.' 
                : 'No products available yet. Check back later!'}
            </p>
            {(search.trim() || category !== 'all') && (
              <button
                type="button"
                className="shop-empty-btn"
                onClick={() => { setSearch(''); setCategory('all'); }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="shop-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
