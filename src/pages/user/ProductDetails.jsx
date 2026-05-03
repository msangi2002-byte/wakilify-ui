import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ShoppingBag,
  Star,
  Package,
  MapPin,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  CheckCircle,
  Image as ImageIcon,
  Star as StarIcon,
  TrendingUp,
  MessageCircle,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  ChevronRight,
  ZoomIn,
  X,
  Check,
  Clock,
  Award,
  BadgeCheck
} from 'lucide-react';
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

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'shipping', label: 'Shipping & Returns' },
];

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
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Contact Supplier (Request for Quotation)
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryQuantity, setInquiryQuantity] = useState(1);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showRfq, setShowRfq] = useState(false);

  const imageRef = useRef(null);

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

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showLightbox) return;
      if (e.key === 'Escape') setShowLightbox(false);
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, lightboxIndex]);

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
      setTimeout(() => {
        navigate('/app/orders');
      }, 2000);
    } catch (err) {
      setOrderError(getApiErrorMessage(err, 'Failed to create order'));
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Image zoom handlers
  const handleMouseMove = (e) => {
    if (!imageRef.current || !isZoomed) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const navigateLightbox = (direction) => {
    const newIndex = lightboxIndex + direction;
    if (newIndex >= 0 && newIndex < allImages.length) {
      setLightboxIndex(newIndex);
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
  const discountPercentage = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : null;

  // Determine business badge level
  const getBusinessBadge = () => {
    if (product.business?.isVerified) return { icon: BadgeCheck, label: 'Verified', color: '#7c3aed' };
    if (product.business?.isGold) return { icon: Award, label: 'Gold Supplier', color: '#f59e0b' };
    return null;
  };
  const businessBadge = getBusinessBadge();

  return (
    <div className="product-details-container product-details-pro">
      {/* Lightbox */}
      {showLightbox && (
        <div className="product-lightbox" onClick={() => setShowLightbox(false)}>
          <button className="product-lightbox-close" onClick={() => setShowLightbox(false)}>
            <X size={24} />
          </button>
          {lightboxIndex > 0 && (
            <button className="product-lightbox-nav product-lightbox-prev" onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}>
              <ArrowLeft size={24} />
            </button>
          )}
          {lightboxIndex < allImages.length - 1 && (
            <button className="product-lightbox-nav product-lightbox-next" onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}>
              <ChevronRight size={24} />
            </button>
          )}
          <div className="product-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={allImages[lightboxIndex]?.url} alt={product.name} />
            <div className="product-lightbox-counter">
              {lightboxIndex + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div className="product-details-pro-header">
        <button type="button" onClick={() => navigate(-1)} className="product-details-back">
          <ArrowLeft size={18} />
          Back
        </button>
        <nav className="product-details-breadcrumb" aria-label="Breadcrumb">
          <Link to="/app/shop">Marketplace</Link>
          <ChevronRight size={14} className="product-details-breadcrumb-sep" />
          {product.category ? (
            <>
              <span className="product-details-breadcrumb-muted">{product.category}</span>
              <ChevronRight size={14} className="product-details-breadcrumb-sep" />
            </>
          ) : null}
          <span className="product-details-breadcrumb-current">{product.name}</span>
        </nav>
      </div>

      {/* Main Content Grid */}
      <div className="product-details-pro-grid">
        {/* Left Column - Images */}
        <div className="product-details-pro-images">
          <div className="product-details-pro-main-image">
            <div
              ref={imageRef}
              className={`product-details-pro-image-wrapper ${isZoomed ? 'zoomed' : ''}`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => openLightbox(selectedImageIndex)}
            >
              {mainImage ? (
                <>
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="product-details-pro-image"
                    style={isZoomed ? {
                      transform: `scale(2)`,
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    } : {}}
                  />
                  <div className="product-details-pro-zoom-hint">
                    <ZoomIn size={16} />
                    <span>Click to zoom</span>
                  </div>
                </>
              ) : (
                <div className="product-details-pro-image-placeholder">
                  <ImageIcon size={64} />
                </div>
              )}
              {discountPercentage && (
                <div className="product-details-pro-discount-badge">
                  -{discountPercentage}%
                </div>
              )}
              {product.isFeatured && (
                <div className="product-details-pro-featured-badge">
                  <StarIcon size={12} />
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="product-details-pro-thumbnails">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`product-details-pro-thumb ${selectedImageIndex === index ? 'active' : ''}`}
                >
                  <img src={img.url} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Trust Badges */}
          <div className="product-details-pro-trust">
            <div className="trust-badge">
              <ShieldCheck size={20} />
              <span>Secure Payment</span>
            </div>
            <div className="trust-badge">
              <Truck size={20} />
              <span>Nationwide Delivery</span>
            </div>
            <div className="trust-badge">
              <RotateCcw size={20} />
              <span>Easy Returns</span>
            </div>
          </div>
        </div>

        {/* Right Column - Product Info */}
        <div className="product-details-pro-info">
          {/* Title & Meta */}
          <div className="product-details-pro-header-info">
            <div className="product-details-pro-meta">
              {product.category && (
                <span className="product-details-pro-category">{product.category}</span>
              )}
              <div className="product-details-pro-rating-row">
                {Number(product.rating) > 0 ? (
                  <>
                    <div className="product-details-pro-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.floor(product.rating) ? 'filled' : ''}
                        />
                      ))}
                    </div>
                    <span className="product-details-pro-rating-value">{Number(product.rating).toFixed(1)}</span>
                    {product.reviewsCount > 0 && (
                      <span className="product-details-pro-reviews">({product.reviewsCount} reviews)</span>
                    )}
                  </>
                ) : (
                  <span className="product-details-pro-no-rating">No ratings yet</span>
                )}
                {(product.ordersCount ?? 0) > 0 && (
                  <span className="product-details-pro-sold">
                    <TrendingUp size={12} />
                    {product.ordersCount} sold
                  </span>
                )}
              </div>
            </div>
            <h1 className="product-details-pro-title">{product.name}</h1>
          </div>

          {/* Price Block */}
          <div className="product-details-pro-price-block">
            <div className="product-details-pro-price-main">
              {formatCurrency(product.price)}
            </div>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="product-details-pro-price-compare">
                {formatCurrency(product.compareAtPrice)}
              </div>
            )}
            {discountPercentage && (
              <div className="product-details-pro-save-badge">
                Save {formatCurrency(product.compareAtPrice - product.price)}
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="product-details-pro-stock">
            <Package size={18} className={isOutOfStock ? 'out' : ''} />
            <span className={isOutOfStock ? 'out' : ''}>
              {isOutOfStock ? 'Out of stock' : product.stockQuantity != null ? `${product.stockQuantity} units available` : 'In stock'}
            </span>
            {product.minOrderQuantity > 1 && (
              <span className="product-details-pro-moq">
                Min. order: {product.minOrderQuantity} units
              </span>
            )}
          </div>

          {/* Actions Card */}
          {!inquirySuccess && (
            <div className="product-details-pro-actions">
              {/* Quantity Selector */}
              <div className="product-details-pro-quantity">
                <span className="quantity-label">Quantity</span>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || isOutOfStock}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
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
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxQuantity || isOutOfStock}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {product.stockQuantity && product.stockQuantity <= 10 && product.stockQuantity > 0 && (
                  <span className="stock-warning">Only {product.stockQuantity} left!</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="product-details-pro-buttons">
                <button
                  type="button"
                  className="btn-buy-now"
                  disabled={isOutOfStock || !user}
                  onClick={() => {
                    setShowRfq(false);
                    setShowOrderForm(true);
                  }}
                >
                  <ShoppingBag size={20} />
                  Buy Now
                </button>
                <button
                  type="button"
                  className="btn-get-quote"
                  disabled={!user}
                  onClick={() => {
                    setShowOrderForm(false);
                    setShowRfq((v) => !v);
                  }}
                >
                  <MessageCircle size={20} />
                  Get Quote
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="product-details-pro-secondary-actions">
                <button
                  type="button"
                  className={`btn-wishlist ${isWishlisted ? 'active' : ''}`}
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart size={18} className={isWishlisted ? 'filled' : ''} />
                  {isWishlisted ? 'Saved' : 'Save'}
                </button>
                <button type="button" className="btn-share">
                  <Share2 size={18} />
                  Share
                </button>
              </div>

              {!user && (
                <p className="login-hint">
                  <Link to="/login">Log in</Link> to purchase or contact the seller
                </p>
              )}
            </div>
          )}

          {/* Business Card */}
          {product.business && (
            <Link to={`/app/shop/business/${product.business.id}`} className="product-details-pro-business">
              <div className="business-avatar">
                {product.business.logo ? (
                  <img src={product.business.logo} alt={product.business.name} />
                ) : (
                  <Store size={24} />
                )}
              </div>
              <div className="business-info">
                <div className="business-name">
                  {product.business.name}
                  {businessBadge && (
                    <span className="business-badge" style={{ color: businessBadge.color }}>
                      <businessBadge.icon size={14} />
                      {businessBadge.label}
                    </span>
                  )}
                </div>
                <div className="business-meta">
                  {(product.business.district || product.business.region) && (
                    <span className="business-location">
                      <MapPin size={12} />
                      {[product.business.district, product.business.region].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="business-chevron" />
            </Link>
          )}

          {/* RFQ Form */}
          {showRfq && !inquirySuccess && (
            <div className="product-details-pro-rfq">
              <h3>Request a Quote</h3>
              <p className="rfq-description">
                Contact the seller for bulk pricing or custom requirements
              </p>
              <form onSubmit={handleInquirySubmit}>
                {inquiryError && (
                  <div className="rfq-error" role="alert">
                    <AlertCircle size={16} />
                    <span>{inquiryError}</span>
                  </div>
                )}
                <div className="rfq-field">
                  <label htmlFor="inquiry-qty">Quantity Needed</label>
                  <input
                    id="inquiry-qty"
                    type="number"
                    min={1}
                    value={inquiryQuantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v) && v >= 1) setInquiryQuantity(v);
                    }}
                    disabled={inquirySubmitting}
                  />
                </div>
                <div className="rfq-field">
                  <label htmlFor="inquiry-msg">Message / Requirements</label>
                  <textarea
                    id="inquiry-msg"
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Describe your requirements, delivery timeline, or ask for bulk discount..."
                    rows={3}
                    disabled={inquirySubmitting}
                  />
                </div>
                <button type="submit" className="btn-submit-rfq" disabled={inquirySubmitting || !user}>
                  {inquirySubmitting ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageCircle size={18} />
                      Send Quote Request
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Checkout Form */}
          {showOrderForm && !orderSuccess && !inquirySuccess && (
            <div className="product-details-pro-checkout">
              <div className="checkout-header">
                <h3>Checkout</h3>
                <button type="button" className="btn-close-checkout" onClick={() => setShowOrderForm(false)}>
                  <X size={18} />
                </button>
              </div>

              {orderError && (
                <div className="checkout-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{orderError}</span>
                </div>
              )}

              <div className="checkout-summary">
                <div className="summary-row">
                  <span>{quantity} × {formatCurrency(product.price)}</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <form onSubmit={handleOrderSubmit}>
                <div className="checkout-field">
                  <label htmlFor="deliveryName">Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="deliveryName"
                    value={orderForm.deliveryName}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryName: e.target.value }))}
                    placeholder="Enter your full name"
                    disabled={orderSubmitting}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="deliveryPhone">Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    id="deliveryPhone"
                    value={orderForm.deliveryPhone}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryPhone: e.target.value }))}
                    placeholder="+255712345678"
                    disabled={orderSubmitting}
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="deliveryAddress">Delivery Address <span className="required">*</span></label>
                  <textarea
                    id="deliveryAddress"
                    value={orderForm.deliveryAddress}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="Enter your complete delivery address"
                    rows={2}
                    disabled={orderSubmitting}
                    required
                  />
                </div>

                <button type="submit" className="btn-place-order" disabled={orderSubmitting || isOutOfStock || !user}>
                  {orderSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      Place Order
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Success States */}
          {orderSuccess && (
            <div className="product-details-pro-success">
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>
              <h3>Order Placed!</h3>
              <p>Redirecting to your orders...</p>
            </div>
          )}

          {inquirySuccess && (
            <div className="product-details-pro-success inquiry">
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>
              <h3>Quote Request Sent!</h3>
              <p>The seller will reply soon.</p>
              <Link to="/app/inquiries" className="btn-view-inquiries">View My Inquiries</Link>
            </div>
          )}
        </div>
      </div>

      {/* Tabbed Content Section */}
      <div className="product-details-pro-tabs-section">
        <div className="product-details-pro-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="product-details-pro-tab-content">
          {activeTab === 'description' && (
            <div className="tab-panel description-panel">
              {product.description ? (
                <div className="description-content">
                  <h4>About this product</h4>
                  <p>{product.description}</p>
                </div>
              ) : (
                <p className="no-content">No description available</p>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="tab-panel specs-panel">
              <div className="specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Category</span>
                  <span className="spec-value">{product.category || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Stock Available</span>
                  <span className="spec-value">{product.stockQuantity ?? 'Unlimited'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Minimum Order</span>
                  <span className="spec-value">{product.minOrderQuantity || 1} units</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Product ID</span>
                  <span className="spec-value">#{product.id}</span>
                </div>
                {product.sku && (
                  <div className="spec-item">
                    <span className="spec-label">SKU</span>
                    <span className="spec-value">{product.sku}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="tab-panel shipping-panel">
              <div className="shipping-info">
                <div className="shipping-item">
                  <Truck size={24} />
                  <div>
                    <h5>Nationwide Delivery</h5>
                    <p>We deliver to all regions across the country. Delivery times vary by location.</p>
                  </div>
                </div>
                <div className="shipping-item">
                  <Clock size={24} />
                  <div>
                    <h5>Processing Time</h5>
                    <p>Orders are typically processed within 1-2 business days.</p>
                  </div>
                </div>
                <div className="shipping-item">
                  <RotateCcw size={24} />
                  <div>
                    <h5>Return Policy</h5>
                    <p>Returns accepted within 7 days of delivery if product is unused and in original packaging.</p>
                  </div>
                </div>
                <div className="shipping-item">
                  <ShieldCheck size={24} />
                  <div>
                    <h5>Secure Packaging</h5>
                    <p>All items are carefully packaged to ensure they arrive in perfect condition.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      <section className="product-details-pro-similar">
        <div className="similar-header">
          <div>
            <h2>Similar Products</h2>
            <p>More items from this category or seller</p>
          </div>
          <Link to="/app/shop" className="btn-view-all">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        {similarLoading ? (
          <ShopGridSkeleton cards={6} />
        ) : similarProducts.length === 0 ? (
          <p className="similar-empty">No similar products found</p>
        ) : (
          <div className="similar-grid">
            {similarProducts.map((p) => (
              <MarketplaceProductCard key={p.id} product={p} showSoldBadge />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
