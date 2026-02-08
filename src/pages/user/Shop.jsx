import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Settings, ShoppingBag } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'home', label: 'Home' },
  { id: 'sports', label: 'Sports' },
  { id: 'other', label: 'Other' },
];

const MOCK_PRODUCTS = [
  { id: '1', title: 'Wireless earbuds', price: 49.99, category: 'electronics', image: 'https://picsum.photos/seed/s1/400/400', seller: 'TechDeals' },
  { id: '2', title: 'Vintage denim jacket', price: 89.5, category: 'fashion', image: 'https://picsum.photos/seed/s2/400/400', seller: 'StyleHub' },
  { id: '3', title: 'Desk lamp LED', price: 34.99, category: 'home', image: 'https://picsum.photos/seed/s3/400/400', seller: 'HomeGoods' },
  { id: '4', title: 'Running shoes', price: 120, category: 'sports', image: 'https://picsum.photos/seed/s4/400/400', seller: 'SportZone' },
  { id: '5', title: 'Phone stand', price: 19.99, category: 'electronics', image: 'https://picsum.photos/seed/s5/400/400', seller: 'TechDeals' },
  { id: '6', title: 'Canvas tote bag', price: 24.99, category: 'fashion', image: 'https://picsum.photos/seed/s6/400/400', seller: 'StyleHub' },
  { id: '7', title: 'Throw pillows set', price: 45, category: 'home', image: 'https://picsum.photos/seed/s7/400/400', seller: 'HomeGoods' },
  { id: '8', title: 'Yoga mat', price: 29.99, category: 'sports', image: 'https://picsum.photos/seed/s8/400/400', seller: 'SportZone' },
  { id: '9', title: 'Bluetooth speaker', price: 59.99, category: 'electronics', image: 'https://picsum.photos/seed/s9/400/400', seller: 'TechDeals' },
];

function ProductCard({ product }) {
  return (
    <Link to={`/app/shop/${product.id}`} className="shop-product-card user-app-card">
      <div className="shop-product-image-wrap">
        <img src={product.image} alt="" className="shop-product-image" loading="lazy" />
      </div>
      <div className="shop-product-info">
        <span className="shop-product-title">{product.title}</span>
        <span className="shop-product-seller">{product.seller}</span>
        <span className="shop-product-price">${product.price.toFixed(2)}</span>
      </div>
    </Link>
  );
}

export default function Shop() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchCategory = category === 'all' || p.category === category;
    const matchSearch =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="shop-page">
      <header className="shop-header">
        <div className="shop-header-top">
          <div>
            <h1 className="shop-title">Marketplace</h1>
            <p className="shop-subtitle">Discover and buy from people in your network</p>
          </div>
          <Link to="/app/shop/settings" className="shop-settings-link">
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
        {filtered.length === 0 ? (
          <div className="shop-empty user-app-card">
            <ShoppingBag size={48} className="shop-empty-icon" />
            <p className="shop-empty-title">No products found</p>
            <p className="shop-empty-desc">
              Try a different search or category.
            </p>
            <button
              type="button"
              className="shop-empty-btn"
              onClick={() => { setSearch(''); setCategory('all'); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="shop-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
