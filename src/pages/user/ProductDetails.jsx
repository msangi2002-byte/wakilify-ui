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
          <div className="product-details-info-card product-details-mic-card">
            <div className="product-details-badges">
              {product.isFeatured && (
                <span className="product-details-badge product-details-badge-featured">
                  <StarIcon size={14} />
                  Featured
                </span>
              )}
              {(product.ordersCount ?? 0) > 0 && (
                <span className="product-details-badge product-details-badge-sold">
                  <TrendingUp size={14} />
                  {product.ordersCount} sold
                </span>
              )}
            </div>
            <h1 className="product-title">
              {product.name}
            </h1>
            {product.category && (
              <span className="product-details-category">{product.category}</span>
            )}
            <div className="product-price product-details-mic-price">
              <span className="product-details-mic-price-main">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="product-details-mic-price-compare">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
            {product.rating && product.rating > 0 && (
              <div className="product-details-rating">
                <Star size={20} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                <span style={{ fontWeight: 600 }}>{product.rating.toFixed(1)}</span>
                {product.reviewsCount > 0 && (
                  <span style={{ color: '#65676b', fontSize: '0.875rem' }}>
                    ({product.reviewsCount} {product.reviewsCount === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>
            )}
            {product.description && (
              <div className="product-details-block">
                <h3 className="product-details-block-title">Description</h3>
                <p className="product-details-desc">{product.description}</p>
              </div>
            )}
            {product.stockQuantity !== null && product.stockQuantity !== undefined && (
              <div className="product-details-block">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} style={{ color: isOutOfStock ? '#ef4444' : '#22c55e' }} />
                  <span style={{ fontWeight: 600, color: isOutOfStock ? '#ef4444' : '#22c55e' }}>
                    {isOutOfStock ? 'Out of Stock' : `${product.stockQuantity} in stock`}
                  </span>
                </div>
              </div>
            )}
            {product.business && (
              <div className="product-details-block">
                <h3 className="product-details-block-title">Seller</h3>
                <Link
                  to={`/app/shop/business/${product.business.id}`}
                  className="product-details-seller-link"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {product.business.logo ? (
                      <img
                        src={product.business.logo}
                        alt={product.business.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingBag size={20} style={{ color: '#6b7280' }} />
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: 'inherit' }}>{product.business.name}</p>
                      {(product.business.region || product.business.district) && (
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#65676b' }}>
                          <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {[product.business.district, product.business.region].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                <Link to={`/app/shop/business/${product.business.id}`} className="product-details-view-shop">
                  View shop
                </Link>
              </div>
            )}
          </div>

          {/* Contact Supplier (Request for Quotation) – primary CTA */}
          {!inquirySuccess ? (
            <div className="product-details-order-card" style={{ marginBottom: '24px' }}>
              <h2 className="product-details-order-title">
                <MessageCircle size={22} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Contact Supplier
              </h2>
              <p style={{ color: '#65676b', fontSize: '0.9375rem', marginBottom: '16px' }}>
                Send a request for quotation. The seller will reply with price and terms. You can then confirm and pay.
              </p>
              <form onSubmit={handleInquirySubmit}>
                {inquiryError && (
                  <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '16px', color: '#ef4444' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={18} />
                      <span>{inquiryError}</span>
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Quantity you need</label>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={inquiryQuantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1) setInquiryQuantity(Math.min(v, maxQuantity));
                    }}
                    style={{ width: '100px', padding: '10px', border: '1px solid #e4e6eb', borderRadius: '8px', fontSize: '1rem' }}
                    disabled={inquirySubmitting}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Message / requirements</label>
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="e.g. I need 50 units. Do you offer bulk discount? What is the delivery time?"
                    rows={3}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e4e6eb', borderRadius: '8px', fontSize: '0.9375rem', fontFamily: 'inherit', resize: 'vertical' }}
                    disabled={inquirySubmitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={inquirySubmitting || !user}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: !user ? '#d1d5db' : '#0d9488',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: !user ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {inquirySubmitting ? (
                    <>
                      <Loader2 size={20} className="icon-spin" />
                      Sending...
                    </>
                  ) : !user ? (
                    'Log in to contact supplier'
                  ) : (
                    <>
                      <MessageCircle size={20} />
                      Request for Quotation
                    </>
                  )}
                </button>
              </form>
              <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#65676b' }}>
                Or{' '}
                <button type="button" onClick={() => setShowOrderForm(true)} style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  buy now (direct checkout)
                </button>
              </p>
            </div>
          ) : (
            <div className="product-details-order-card" style={{ marginBottom: '24px', background: 'rgba(13, 148, 136, 0.08)', border: '1px solid #0d9488' }}>
              <CheckCircle size={48} style={{ color: '#0d9488', margin: '0 auto 12px', display: 'block' }} />
              <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 600, textAlign: 'center' }}>Inquiry sent</h2>
              <p style={{ margin: '0 0 16px', color: '#65676b', textAlign: 'center' }}>The seller will reply with a quote. Check My Inquiries for updates.</p>
              <Link to="/app/inquiries" style={{ display: 'block', textAlign: 'center', color: '#0d9488', fontWeight: 600 }}>View My Inquiries</Link>
            </div>
          )}

          {/* Order Form (direct checkout) – secondary */}
          {(showOrderForm || orderSuccess) && !inquirySuccess && (
          !orderSuccess ? (
            <form onSubmit={handleOrderSubmit} className="product-details-order-card">
              <h2 className="product-details-order-title">Place Order (direct checkout)</h2>
              <p style={{ color: '#65676b', fontSize: '0.875rem', marginBottom: '16px' }}>
                <button type="button" onClick={() => setShowOrderForm(false)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', textDecoration: 'underline' }}>← Back to Contact Supplier</button>
              </p>
              
              {orderError && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '16px', color: '#ef4444' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} />
                    <span>{orderError}</span>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Quantity</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || orderSubmitting}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e4e6eb',
                      borderRadius: '8px',
                      background: '#fff',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      opacity: quantity <= 1 ? 0.5 : 1,
                    }}
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1 && val <= maxQuantity) {
                        setQuantity(val);
                      }
                    }}
                    min="1"
                    max={maxQuantity}
                    style={{
                      width: '80px',
                      height: '40px',
                      textAlign: 'center',
                      border: '1px solid #e4e6eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                    disabled={orderSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxQuantity || orderSubmitting}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e4e6eb',
                      borderRadius: '8px',
                      background: '#fff',
                      cursor: quantity >= maxQuantity ? 'not-allowed' : 'pointer',
                      opacity: quantity >= maxQuantity ? 0.5 : 1,
                    }}
                  >
                    <Plus size={18} />
                  </button>
                  <span style={{ color: '#65676b', fontSize: '0.875rem', width: '100%' }}>
                    {formatCurrency(product.price)} each
                  </span>
                </div>
              </div>

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
            <div className="product-details-success-card">
              <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
              <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 600 }}>Order Placed Successfully!</h2>
              <p style={{ margin: '0 0 24px', color: '#65676b' }}>Redirecting to your orders...</p>
            </div>
          ) )}
        </div>
      </div>

      <section className="product-details-similar shop-mp-mic shop-mp-kikuu" aria-labelledby="product-details-similar-heading">
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
          <div className="shop-mp-grid">
            {similarProducts.map((p) => (
              <MarketplaceProductCard key={p.id} product={p} showSoldBadge />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
