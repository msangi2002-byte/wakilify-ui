import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingBag, Star, Package, MapPin, Loader2, AlertCircle, Plus, Minus, CheckCircle, Image as ImageIcon, Star as StarIcon, TrendingUp, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProductById, getProductsByCategory, getProductsByBusiness, getProducts } from '@/lib/api/products';
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard';
import { ShopGridSkeleton } from '@/components/ui/ShopGridSkeleton';
import { createOrder } from '@/lib/api/orders';
import { createInquiry } from '@/lib/api/inquiries';
import { useAuthStore } from '@/store/auth.store';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import { ProductDetailsSkeleton } from '@/components/ui/ProductDetailsSkeleton';
import '@/styles/user-app.css';

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [orderForm, setOrderForm] = useState({
    deliveryName: user?.name || '',
    deliveryAddress: '',
    deliveryPhone: user?.phone || '',
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Contact Supplier (Request for Quotation)
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryQuantity, setInquiryQuantity] = useState(1);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showRfq, setShowRfq] = useState(false);

  const {
    data: product = null,
    isPending: loading,
    error: queryError,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });

  const { data: similarProducts = [], isPending: similarLoading } = useQuery({
    queryKey: ['product', id, 'similar', product?.category ?? '', product?.business?.id ?? ''],
    queryFn: async () => {
      let data;
      if (product.category) {
        data = await getProductsByCategory(product.category, { page: 0, size: 24 });
      } else if (product.business?.id) {
        data = await getProductsByBusiness(product.business.id, { page: 0, size: 24 });
      } else {
        data = await getProducts({ page: 0, size: 24 });
      }
      const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      return list.filter((p) => p && String(p.id) !== String(id)).slice(0, 8);
    },
    enabled: !!product && !!id,
  });

  const error = !id
    ? 'Product ID is required'
    : queryError
      ? getApiErrorMessage(queryError, 'Failed to load product')
      : '';

  // Update form fields when user changes
  useEffect(() => {
    if (user) {
      setOrderForm(prev => ({
        ...prev,
        deliveryName: prev.deliveryName || user.name || '',
        deliveryPhone: prev.deliveryPhone || user.phone || '',
      }));
    }
  }, [user]);

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, Math.min(quantity + delta, product?.stockQuantity || 999));
    setQuantity(newQuantity);
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setInquiryError('');
    if (!inquiryMessage.trim()) {
      setInquiryError('Please enter your message or requirements.');
      return;
    }
    if (!user) {
      setInquiryError('Please log in to contact the supplier.');
      return;
    }
    setInquirySubmitting(true);
    try {
      await createInquiry({
        productId: product.id,
        message: inquiryMessage.trim(),
        quantity: Math.max(1, inquiryQuantity),
      });
      setInquirySuccess(true);
      setShowRfq(false);
    } catch (err) {
      setInquiryError(getApiErrorMessage(err, 'Failed to send inquiry'));
    } finally {
      setInquirySubmitting(false);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderError('');
    
    if (!orderForm.deliveryName.trim()) {
      setOrderError('Delivery name is required');
      return;
    }
    
    if (!orderForm.deliveryAddress.trim()) {
      setOrderError('Delivery address is required');
      return;
    }
    
    if (!orderForm.deliveryPhone.trim()) {
      setOrderError('Delivery phone number is required');
      return;
    }

    if (!product?.business?.id) {
      setOrderError('Business information is missing');
      return;
    }

    if (product.stockQuantity !== null && product.stockQuantity !== undefined && quantity > product.stockQuantity) {
      setOrderError(`Only ${product.stockQuantity} items available in stock`);
      return;
    }

    setOrderSubmitting(true);

    try {
      const orderData = {
        businessId: product.business.id,
        items: [
          {
            productId: product.id,
            quantity: quantity,
          },
        ],
        deliveryName: orderForm.deliveryName.trim(),
        deliveryAddress: orderForm.deliveryAddress.trim(),
        deliveryPhone: orderForm.deliveryPhone.trim(),
      };

      const order = await createOrder(orderData);
      setOrderSuccess(true);
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        navigate('/app/orders');
      }, 2000);
    } catch (err) {
      setOrderError(getApiErrorMessage(err, 'Failed to create order'));
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="product-details-container">
        <div className="product-details-error-card">
          <div className="product-details-error-header">
            <button type="button" onClick={() => navigate(-1)} className="product-details-back">
              <ArrowLeft size={20} />
            </button>
            <h1 className="product-details-error-title">Product</h1>
          </div>
          <div className="product-details-error-body">
            <AlertCircle size={48} className="product-details-error-icon" />
            <p className="product-details-error-message">{error || 'Product not found'}</p>
            <button type="button" onClick={() => navigate('/app/shop')} className="product-details-error-btn">
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get all product images
  const allImages = [];
  if (product.thumbnail) allImages.push({ url: product.thumbnail, isPrimary: true });
  if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      if (img.url !== product.thumbnail) {
        allImages.push(img);
      }
    });
  }
  const mainImage = allImages[selectedImageIndex]?.url || product.thumbnail || (product.images?.[0]?.url);

  const totalPrice = product.price * quantity;
  const isOutOfStock = product.stockQuantity !== null && product.stockQuantity !== undefined && product.stockQuantity === 0;
  const maxQuantity = product.stockQuantity !== null && product.stockQuantity !== undefined ? product.stockQuantity : 999;

  return (
    <div className="product-details-container product-details-mic">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="product-details-back"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <nav className="product-details-breadcrumb" aria-label="Breadcrumb">
        <Link to="/app/shop">Marketplace</Link>
        <span className="product-details-breadcrumb-sep" aria-hidden>
          /
        </span>
        {product.category ? (
          <>
            <span className="product-details-breadcrumb-muted">{product.category}</span>
            <span className="product-details-breadcrumb-sep" aria-hidden>
              /
            </span>
          </>
        ) : null}
        <span className="product-details-breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-details-grid product-details-mic-grid">
        <div className="product-details-images-col">
          <div className="product-details-image-card product-details-mic-card">
            <div className="product-details-main-image-wrap">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="product-details-main-image"
                />
              ) : (
                <div className="product-details-main-image-placeholder">
                  <ImageIcon size={64} />
                </div>
              )}
            </div>
          </div>
          {allImages.length > 1 && (
            <div className="product-thumbnails">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`product-thumbnails-btn ${selectedImageIndex === index ? 'active' : ''}`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-details-info-col">
          <div className="product-details-ax-card product-details-mic-card">
            <div className="product-details-ax-head">
              <div className="product-details-badges">
                {product.isFeatured && (
                  <span className="product-details-badge product-details-badge-featured">
                    <StarIcon size={14} />
                    Featured
                  </span>
                )}
              </div>
              <h1 className="product-title product-details-ax-title">
                {product.name}
              </h1>
              <div className="product-details-ax-subrow">
                {product.category ? (
                  <span className="product-details-category product-details-ax-cat">{product.category}</span>
                ) : null}
                {(product.ordersCount ?? 0) > 0 ? (
                  <span className="product-details-ax-sold-pill">
                    <TrendingUp size={14} aria-hidden />
                    {product.ordersCount} sold
                  </span>
                ) : null}
                {Number(product.rating) > 0 ? (
                  <span className="product-details-ax-rating-pill">
                    <Star size={14} style={{ fill: '#f59e0b', color: '#f59e0b' }} aria-hidden />
                    {Number(product.rating).toFixed(1)}
                    {product.reviewsCount > 0 ? (
                      <span className="product-details-ax-rating-reviews">
                        ({product.reviewsCount})
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="product-details-ax-price-block">
              <div className="product-price product-details-mic-price">
                <span className="product-details-mic-price-main product-details-ax-price-main">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price ? (
                  <span className="product-details-mic-price-compare">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                ) : null}
              </div>
              {product.minOrderQuantity != null && product.minOrderQuantity > 1 ? (
                <p className="product-details-ax-moq">Min. order: {product.minOrderQuantity} units</p>
              ) : null}
            </div>

            <div className="product-details-ax-stock-row">
              <Package size={18} className={isOutOfStock ? 'product-details-ax-stock-ico out' : 'product-details-ax-stock-ico'} aria-hidden />
              <span className={isOutOfStock ? 'product-details-ax-stock-txt out' : 'product-details-ax-stock-txt'}>
                {isOutOfStock ? 'Out of stock' : product.stockQuantity != null ? `${product.stockQuantity} in stock` : 'In stock'}
              </span>
            </div>

            {!inquirySuccess ? (
              <div className="product-details-ax-qty-actions">
                <div className="product-details-ax-qty">
                  <span className="product-details-ax-qty-label">Quantity</span>
                  <div className="product-details-ax-stepper">
                    <button type="button" className="product-details-ax-step" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1 || isOutOfStock} aria-label="Decrease quantity">
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      className="product-details-ax-qty-input"
                      value={quantity}
                      min={1}
                      max={maxQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!Number.isNaN(val) && val >= 1 && val <= maxQuantity) setQuantity(val);
                      }}
                      disabled={isOutOfStock}
                      aria-label="Quantity"
                    />
                    <button type="button" className="product-details-ax-step" onClick={() => handleQuantityChange(1)} disabled={quantity >= maxQuantity || isOutOfStock} aria-label="Increase quantity">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <div className="product-details-ax-btns">
                  <button
                    type="button"
                    className="product-details-ax-btn-buy"
                    disabled={isOutOfStock || !user}
                    onClick={() => {
                      setShowRfq(false);
                      setShowOrderForm(true);
                    }}
                  >
                    <ShoppingBag size={20} aria-hidden />
                    Buy now
                  </button>
                  <button
                    type="button"
                    className="product-details-ax-btn-rfq"
                    disabled={!user}
                    onClick={() => {
                      setShowOrderForm(false);
                      setShowRfq((v) => !v);
                    }}
                  >
                    <MessageCircle size={20} aria-hidden />
                    Request quote
                  </button>
                </div>
                {!user ? (
                  <p className="product-details-ax-login-hint">Log in to purchase or message the seller.</p>
                ) : (
                  <p className="product-details-ax-ship-hint">Seller ships after payment · You can also request a custom quote below.</p>
                )}
              </div>
            ) : null}

            {product.business ? (
              <Link to={`/app/shop/business/${product.business.id}`} className="product-details-ax-store-row">
                {product.business.logo ? (
                  <img src={product.business.logo} alt="" className="product-details-ax-store-logo" />
                ) : (
                  <span className="product-details-ax-store-logo-fallback">
                    <ShoppingBag size={20} />
                  </span>
                )}
                <div className="product-details-ax-store-text">
                  <span className="product-details-ax-store-name">{product.business.name}</span>
                  {(product.business.district || product.business.region) ? (
                    <span className="product-details-ax-store-loc">
                      <MapPin size={14} aria-hidden />
                      {[product.business.district, product.business.region].filter(Boolean).join(', ')}
                    </span>
                  ) : null}
                </div>
                <span className="product-details-ax-store-cta">Visit store</span>
              </Link>
            ) : null}

            {product.description ? (
              <details className="product-details-ax-panel">
                <summary className="product-details-ax-panel-sum">Description</summary>
                <p className="product-details-desc product-details-ax-desc">{product.description}</p>
              </details>
            ) : null}

            {inquirySuccess ? (
              <div className="product-details-ax-inquiry-done">
                <CheckCircle size={40} className="product-details-ax-inquiry-done-ico" aria-hidden />
                <h2 className="product-details-ax-inquiry-done-title">Inquiry sent</h2>
                <p className="product-details-ax-inquiry-done-txt">The seller will reply with a quote. Check My Inquiries for updates.</p>
                <Link to="/app/inquiries" className="product-details-ax-inquiry-done-link">View My Inquiries</Link>
              </div>
            ) : showRfq ? (
              <div className="product-details-ax-rfq">
                <h2 className="product-details-ax-rfq-title">Request quotation</h2>
                <p className="product-details-ax-rfq-lead">
                  The seller will reply with price and terms. Track replies in{' '}
                  <Link to="/app/inquiries">My Inquiries</Link>.
                </p>
                <form onSubmit={handleInquirySubmit} className="product-details-ax-rfq-form">
                  {inquiryError ? (
                    <div className="product-details-ax-alert product-details-ax-alert-err" role="alert">
                      <AlertCircle size={18} aria-hidden />
                      <span>{inquiryError}</span>
                    </div>
                  ) : null}
                  <div className="product-details-ax-field">
                    <label htmlFor="inquiry-qty">Quantity you need</label>
                    <input
                      id="inquiry-qty"
                      type="number"
                      min={1}
                      max={maxQuantity}
                      value={inquiryQuantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v >= 1) setInquiryQuantity(Math.min(v, maxQuantity));
                      }}
                      className="product-details-ax-input product-details-ax-input-narrow"
                      disabled={inquirySubmitting}
                    />
                  </div>
                  <div className="product-details-ax-field">
                    <label htmlFor="inquiry-msg">Message / requirements</label>
                    <textarea
                      id="inquiry-msg"
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      placeholder="e.g. I need 50 units. Bulk discount? Delivery time?"
                      rows={3}
                      className="product-details-ax-textarea"
                      disabled={inquirySubmitting}
                    />
                  </div>
                  <button type="submit" className="product-details-ax-btn-submit-rfq" disabled={inquirySubmitting || !user}>
                    {inquirySubmitting ? (
                      <>
                        <Loader2 size={20} className="icon-spin" aria-hidden />
                        Sending…
                      </>
                    ) : !user ? (
                      'Log in to send quote request'
                    ) : (
                      <>
                        <MessageCircle size={20} aria-hidden />
                        Send quote request
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : null}

          {(showOrderForm || orderSuccess) && !inquirySuccess ? (
          !orderSuccess ? (
            <form onSubmit={handleOrderSubmit} className="product-details-ax-checkout">
              <h2 className="product-details-ax-checkout-title">Checkout</h2>
              <p className="product-details-ax-checkout-back">
                <button
                  type="button"
                  className="product-details-ax-link-btn"
                  onClick={() => { setShowOrderForm(false); }}
                >
                  ← Back to product
                </button>
              </p>
              
              {orderError && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '16px', color: '#ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    <span>{orderError}</span>
                  </div>
                </div>
              )}

              <p className="product-details-ax-checkout-qty-note">
                Quantity: <strong>{quantity}</strong> × {formatCurrency(product.price)} each
              </p>

              {/* Delivery Name */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="deliveryName" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Delivery Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  id="deliveryName"
                  value={orderForm.deliveryName}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryName: e.target.value }))}
                  required
                  placeholder="Enter recipient name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e6eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                  }}
                  disabled={orderSubmitting || isOutOfStock}
                />
              </div>

              {/* Delivery Address */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="deliveryAddress" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Delivery Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  id="deliveryAddress"
                  value={orderForm.deliveryAddress}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Enter your delivery address"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e6eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  disabled={orderSubmitting || isOutOfStock}
                />
              </div>

              {/* Delivery Phone */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="deliveryPhone" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Delivery Phone <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  id="deliveryPhone"
                  value={orderForm.deliveryPhone}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryPhone: e.target.value }))}
                  required
                  placeholder="+255712345678"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e6eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                  }}
                  disabled={orderSubmitting || isOutOfStock}
                />
              </div>

              {/* Total */}
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'})</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(totalPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, paddingTop: '8px', borderTop: '1px solid #e4e6eb' }}>
                  <span>Total</span>
                  <span style={{ color: '#7c3aed' }}>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={orderSubmitting || isOutOfStock || !user}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isOutOfStock || !user ? '#d1d5db' : '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isOutOfStock || !user ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {orderSubmitting ? (
                  <>
                    <Loader2 size={20} className="icon-spin" />
                    Placing Order...
                  </>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : !user ? (
                  'Please login to order'
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    Place Order
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="product-details-success-card product-details-ax-order-success">
              <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
              <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 600 }}>Order placed successfully</h2>
              <p style={{ margin: '0 0 24px', color: '#65676b' }}>Redirecting to your orders…</p>
            </div>
          )
          ) : null}

        </div>
        </div>
      </div>

      <section className="product-details-similar product-details-similar-ae shop-mp-mic shop-mp-kikuu" aria-labelledby="product-details-similar-heading">
        <div className="product-details-similar-head">
          <h2 id="product-details-similar-heading" className="product-details-similar-title">
            Similar products
          </h2>
          <p className="product-details-similar-sub">Same category or from this seller</p>
        </div>
        {similarLoading ? (
          <ShopGridSkeleton cards={6} />
        ) : similarProducts.length === 0 ? (
          <p className="product-details-similar-empty">No similar listings right now.</p>
        ) : (
          <div className="product-details-similar-track">
            {similarProducts.map((p) => (
              <div key={p.id} className="product-details-similar-slide">
                <MarketplaceProductCard product={p} showSoldBadge />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
