import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, Image as ImageIcon, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { getBusinessProducts, deleteProduct } from '@/lib/api/business';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

function ProductCard({ product, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      onDelete?.(product.id);
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete product'));
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/business/products/${product.id}/edit`);
  };

  // Get product image (thumbnail, primary image, or first image)
  const getProductImage = () => {
    // Helper to ensure URL is absolute
    const normalizeUrl = (url) => {
      if (!url) return null;
      // If already absolute URL (starts with http:// or https://), return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // If relative URL, prepend storage base URL
      // Default storage URL from backend is https://storage.wakilfy.com
      const storageBaseUrl = 'https://storage.wakilfy.com';
      // Remove leading slash if present to avoid double slashes
      const cleanPath = url.startsWith('/') ? url.substring(1) : url;
      return `${storageBaseUrl}/${cleanPath}`;
    };

    // Use thumbnail if available (set from first image)
    if (product.thumbnail) {
      return normalizeUrl(product.thumbnail);
    }
    if (!product.images || product.images.length === 0) {
      return null;
    }
    // Find primary image first, otherwise use first image
    const primaryImage = product.images.find(img => img.isPrimary);
    const imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
    return normalizeUrl(imageUrl);
  };
  const productImage = getProductImage();

  return (
    <div className="business-product-card">
      <div className="business-product-image-wrap">
        {productImage && !imageError ? (
          <img 
            src={productImage} 
            alt={product.name} 
            className="business-product-image"
            onError={(e) => {
              console.error('Failed to load product image:', productImage, 'Product:', product.name);
              console.error('Image error details:', e);
              setImageError(true);
            }}
            onLoad={() => {
              setImageLoading(false);
              // Reset error state if image loads successfully after an error
              if (imageError) {
                setImageError(false);
              }
            }}
            onLoadStart={() => setImageLoading(true)}
            loading="lazy"
          />
        ) : (
          <div className="business-product-image-placeholder">
            <ImageIcon size={32} />
            {!productImage && (
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                No image
              </span>
            )}
          </div>
        )}
        {product.isActive === false && (
          <div className="business-product-badge business-product-badge-inactive">
            Inactive
          </div>
        )}
        <div className="business-product-actions">
          <button
            type="button"
            className="business-product-action-btn"
            onClick={handleEdit}
            title="Edit product"
          >
            <Edit size={16} />
          </button>
          <button
            type="button"
            className="business-product-action-btn business-product-action-btn-danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete product"
          >
            {deleting ? (
              <Loader2 size={16} className="icon-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>
      <div className="business-product-info">
        <h3 className="business-product-title">{product.name}</h3>
        {product.category && (
          <span className="business-product-category">{product.category}</span>
        )}
        <div className="business-product-price">{formatCurrency(product.price)}</div>
        {product.stockQuantity !== null && product.stockQuantity !== undefined && (
          <div className="business-product-stock">
            Stock: {product.stockQuantity}
          </div>
        )}
        {product.description && (
          <p className="business-product-description" title={product.description}>
            {product.description.length > 60 
              ? `${product.description.substring(0, 60)}...` 
              : product.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBusinessProducts({ page: 0, size: 50 });
      setProducts(Array.isArray(data?.content) ? { content: data.content, totalElements: data.totalElements || data.content.length } : { content: [], totalElements: 0 });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleProductDeleted = (deletedId) => {
    setProducts((prev) => ({
      ...prev,
      content: prev.content.filter((p) => p.id !== deletedId),
      totalElements: prev.totalElements - 1,
    }));
  };

  if (loading) {
    return (
      <div className="business-loading">
        <Loader2 size={32} className="icon-spin" />
        <div>Loading products...</div>
      </div>
    );
  }

  return (
    <div className="business-main" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="business-dashboard-title" style={{ margin: 0, marginBottom: '4px' }}>
            <Package size={28} />
            Products
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            {products.totalElements} {products.totalElements === 1 ? 'product' : 'products'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="business-btn-ghost"
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw size={18} style={{ marginRight: '6px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <Link to="/business/products/new" className="business-btn-primary">
            <Plus size={18} />
            Create Product
          </Link>
        </div>
      </div>

      {error && (
        <div
          className="business-card"
          style={{
            marginBottom: '24px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: '#ef4444',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
            <AlertCircle size={20} />
            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
          </div>
        </div>
      )}

      {products.content.length === 0 ? (
        <div className="business-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Package size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
            No products yet
          </h2>
          <p style={{ margin: '0 0 24px', color: '#6b7280' }}>
            Get started by creating your first product
          </p>
          <Link to="/business/products/new" className="business-btn-primary">
            <Plus size={18} />
            Create Your First Product
          </Link>
        </div>
      ) : (
        <div className="business-products-grid">
          {products.content.map((product) => (
            <ProductCard key={product.id} product={product} onDelete={handleProductDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
