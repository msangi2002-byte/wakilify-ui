import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Star, Package, MapPin, Phone, Loader2, AlertCircle, Plus, Minus, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { getProductById } from '@/lib/api/products';
import { createOrder } from '@/lib/api/orders';
import { useAuthStore } from '@/store/auth.store';
import { getApiErrorMessage } from '@/lib/utils/apiError';
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
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    if (!id) {
      setError('Product ID is required');
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load product'));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

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
    return (
      <div className="user-app-card" style={{ padding: '48px', textAlign: 'center' }}>
        <Loader2 size={48} className="icon-spin" style={{ color: '#7c3aed', margin: '0 auto 16px' }} />
        <p style={{ color: '#65676b' }}>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="user-app-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Product</h1>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#ef4444' }} />
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{error || 'Product not found'}</p>
          <button
            type="button"
            onClick={() => navigate('/app/shop')}
            style={{ marginTop: '16px', padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            Back to Marketplace
          </button>
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }} className="product-details-container">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#65676b',
          marginBottom: '16px',
          fontSize: '0.9375rem',
        }}
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr',
        gap: '24px',
        marginBottom: '32px',
      }}
      className="product-details-grid"
      >
        {/* Product Images */}
        <div>
          <div className="user-app-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ width: '100%', aspectRatio: 1, background: '#f0f2f5', position: 'relative' }}>
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={64} style={{ color: '#d1d5db' }} />
                </div>
              )}
            </div>
          </div>
          {allImages.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }} className="product-thumbnails">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  style={{
                    width: '80px',
                    height: '80px',
                    padding: 0,
                    border: selectedImageIndex === index ? '2px solid #7c3aed' : '2px solid #e4e6eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#f0f2f5',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="user-app-card" style={{ marginBottom: '16px' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '1.75rem', fontWeight: 700, color: '#050505' }} className="product-title">
              {product.name}
            </h1>
            {product.category && (
              <span style={{ display: 'inline-block', padding: '4px 12px', background: '#f0f2f5', borderRadius: '12px', fontSize: '0.875rem', color: '#65676b', marginBottom: '16px' }}>
                {product.category}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }} className="product-price">
              <span style={{ fontSize: '2rem', fontWeight: 700, color: '#7c3aed' }}>
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span style={{ fontSize: '1.25rem', color: '#65676b', textDecoration: 'line-through' }}>
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
            {product.rating && product.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
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
              <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #e4e6eb' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>Description</h3>
                <p style={{ margin: 0, color: '#65676b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {product.description}
                </p>
              </div>
            )}
            {product.stockQuantity !== null && product.stockQuantity !== undefined && (
              <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #e4e6eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={20} style={{ color: isOutOfStock ? '#ef4444' : '#22c55e' }} />
                  <span style={{ fontWeight: 600, color: isOutOfStock ? '#ef4444' : '#22c55e' }}>
                    {isOutOfStock ? 'Out of Stock' : `${product.stockQuantity} in stock`}
                  </span>
                </div>
              </div>
            )}
            {product.business && (
              <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: '1px solid #e4e6eb' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600 }}>Seller</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {product.business.logo && (
                    <img
                      src={product.business.logo}
                      alt={product.business.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{product.business.name}</p>
                    {product.business.region && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#65676b' }}>
                        <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {product.business.region}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Form */}
          {!orderSuccess ? (
            <form onSubmit={handleOrderSubmit} className="user-app-card">
              <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 600 }}>Place Order</h2>
              
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
            <div className="user-app-card" style={{ textAlign: 'center', padding: '32px' }}>
              <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 16px' }} />
              <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 600 }}>Order Placed Successfully!</h2>
              <p style={{ margin: '0 0 24px', color: '#65676b' }}>Redirecting to your orders...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
