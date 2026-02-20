import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Store, MapPin, Package, Loader2, AlertCircle, Image as ImageIcon, MessageSquare, Send } from 'lucide-react';
import { getBusinessById, submitBusinessFeedback } from '@/lib/api/businesses';
import { getProductsByBusiness } from '@/lib/api/products';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/user-app.css';

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

function ProductCard({ product, navigate }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl =
    product.thumbnail ||
    (product.images?.find((img) => img.isPrimary)?.url) ||
    product.images?.[0]?.url;

  return (
    <div
      className="shop-mp-card"
      onClick={() => navigate(`/app/shop/${product.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/shop/${product.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="shop-mp-card-image">
        {imageUrl && !imageError ? (
          <img src={imageUrl} alt={product.name} loading="lazy" onError={() => setImageError(true)} />
        ) : (
          <div className="shop-mp-card-placeholder">
            <ImageIcon size={32} />
          </div>
        )}
      </div>
      <div className="shop-mp-card-body">
        <span className="shop-mp-card-title">{product.name}</span>
        <span className="shop-mp-card-price">{formatCurrency(product.price)}</span>
      </div>
    </div>
  );
}

export default function ShopBusiness() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Shop not found');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      getBusinessById(id),
      getProductsByBusiness(id, { page: 0, size: 60 }),
    ])
      .then(([bizData, productsData]) => {
        if (cancelled) return;
        setBusiness(bizData);
        const list = Array.isArray(productsData?.content) ? productsData.content : Array.isArray(productsData) ? productsData : [];
        setProducts(list);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load shop'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="product-details-container">
        <div className="product-details-loading">
          <Loader2 size={48} className="icon-spin product-details-spinner" />
          <p className="product-details-loading-text">Loading shop…</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="product-details-container">
        <div className="product-details-error-card">
          <button type="button" onClick={() => navigate('/app/shop')} className="product-details-back">
            <ArrowLeft size={20} /> Back
          </button>
          <div className="product-details-error-body">
            <AlertCircle size={48} className="product-details-error-icon" />
            <p className="product-details-error-message">{error || 'Shop not found'}</p>
            <button type="button" onClick={() => navigate('/app/shop')} className="product-details-error-btn">
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-container">
      <button type="button" onClick={() => navigate(-1)} className="product-details-back">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="shop-business-header">
        <div className="shop-business-cover">
          {business.coverImage ? (
            <img src={business.coverImage} alt="" className="shop-business-cover-img" />
          ) : (
            <div className="shop-business-cover-placeholder" />
          )}
        </div>
        <div className="shop-business-profile">
          {business.logo ? (
            <img src={business.logo} alt="" className="shop-business-logo" />
          ) : (
            <div className="shop-business-logo-placeholder">
              <Store size={40} />
            </div>
          )}
          <div className="shop-business-info">
            <h1 className="shop-business-name">{business.name}</h1>
            {business.category && (
              <span className="shop-business-category">{business.category}</span>
            )}
            {(business.region || business.district) && (
              <span className="shop-business-location">
                <MapPin size={16} /> {[business.district, business.region].filter(Boolean).join(', ')}
              </span>
            )}
            {business.productsCount != null && (
              <span className="shop-business-stats">
                <Package size={16} /> {business.productsCount} {business.productsCount === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>
        </div>
      </div>

      {business.description && (
        <div className="shop-business-description">
          <h2 className="shop-business-section-title">About</h2>
          <p className="shop-business-desc-text">{business.description}</p>
        </div>
      )}

      <div className="shop-business-products">
        <h2 className="shop-business-section-title">
          Products ({products.length})
        </h2>
        {products.length === 0 ? (
          <div className="shop-mp-empty">
            <Package size={48} className="shop-mp-empty-icon" />
            <p className="shop-mp-empty-title">No products yet</p>
            <p className="shop-mp-empty-desc">This shop has not listed any products.</p>
          </div>
        ) : (
          <div className="shop-mp-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} navigate={navigate} />
            ))}
          </div>
        )}
      </div>

      {/* Feedback / advice section: authenticated users can leave feedback for the shop */}
      <div className="shop-business-feedback-section">
        <h2 className="shop-business-section-title">
          <MessageSquare size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Feedback &amp; advice
        </h2>
        <p className="shop-business-feedback-desc">
          Share feedback or advice for this shop. The owner can see it in their business dashboard.
        </p>
        {user ? (
          feedbackSuccess ? (
            <p className="shop-business-feedback-success">Thank you! Your feedback has been sent to the shop owner.</p>
          ) : (
            <form
              className="shop-business-feedback-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const content = feedbackText.trim();
                if (!content || feedbackSubmitting) return;
                setFeedbackSubmitting(true);
                try {
                  await submitBusinessFeedback(id, content);
                  setFeedbackText('');
                  setFeedbackSuccess(true);
                } catch (err) {
                  alert(getApiErrorMessage(err, 'Failed to send feedback'));
                } finally {
                  setFeedbackSubmitting(false);
                }
              }}
            >
              <textarea
                className="shop-business-feedback-textarea"
                placeholder="Your feedback or advice for this shop…"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
                maxLength={2000}
                disabled={feedbackSubmitting}
              />
              <button type="submit" className="shop-business-feedback-submit" disabled={!feedbackText.trim() || feedbackSubmitting}>
                <Send size={18} /> {feedbackSubmitting ? 'Sending…' : 'Send feedback'}
              </button>
            </form>
          )
        ) : (
          <p className="shop-business-feedback-login">
            <Link to="/auth/login">Sign in</Link> to leave feedback or advice for this shop.
          </p>
        )}
      </div>
    </div>
  );
}
