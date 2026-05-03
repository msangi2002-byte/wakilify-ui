import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  MapPin,
  Store,
  MessageCircle,
  BadgeCheck,
} from 'lucide-react';

export function formatMarketplaceCurrency(amount) {
  if (!amount && amount !== 0) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Marketplace listing card (Shop + product detail “similar”) */
export function MarketplaceProductCard({ product, size = 'normal', showSoldBadge = false }) {
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
  const isHero = size === 'hero';
  const soldCount = product.ordersCount ?? 0;
  const moq = product.minOrderQuantity ?? 1;
  const biz = product.business;
  const responseLabel = biz?.responseRate != null && biz.responseRate > 0
    ? `${Math.round((biz.responseRate ?? 0) * 100)}% response`
    : null;

  return (
    <div
      className={`shop-mp-card shop-mp-card-alibaba ${isCompact ? 'compact' : ''} ${isHero ? 'hero' : ''}`}
      onClick={() => navigate(`/app/shop/${product.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/shop/${product.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="shop-mp-card-image shop-mp-card-image-zoom">
        {productImage && !imageError ? (
          <img
            src={productImage}
            alt={product.name}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="shop-mp-card-placeholder">
            <ImageIcon size={isCompact ? 24 : isHero ? 40 : 32} />
          </div>
        )}
        {showSoldBadge && soldCount > 0 && (
          <span className="shop-mp-card-sold">{soldCount} sold</span>
        )}
      </div>

      <div className="shop-mp-card-body">
        <h3 className="shop-mp-card-title shop-mp-card-title-long" title={product.name}>
          {product.name}
        </h3>
        <div className="shop-mp-card-price-row">
          <span className="shop-mp-card-price">
            {product.compareAtPrice != null && product.compareAtPrice > product.price
              ? `${formatMarketplaceCurrency(product.price)} - ${formatMarketplaceCurrency(product.compareAtPrice)}`
              : `From ${formatMarketplaceCurrency(product.price)}`}
          </span>
        </div>
        {moq > 1 && (
          <span className="shop-mp-card-moq">Min. Order: {moq} Pieces</span>
        )}
      </div>

      <div className="shop-mp-card-trust">
        <div className="shop-mp-card-supplier">
          {biz?.logo ? (
            <img src={biz.logo} alt="" className="shop-mp-card-supplier-logo" />
          ) : (
            <span className="shop-mp-card-supplier-icon"><Store size={14} /></span>
          )}
          <span className="shop-mp-card-supplier-name">{biz?.name || 'Supplier'}</span>
        </div>
        <div className="shop-mp-card-badges">
          {biz?.isVerified && (
            <span className="shop-mp-card-badge shop-mp-card-badge-verified" title="Verified Supplier">
              <BadgeCheck size={14} />
              Verified
            </span>
          )}
          {biz?.supplierLevel && (
            <span className="shop-mp-card-badge shop-mp-card-badge-level">{biz.supplierLevel}</span>
          )}
          {responseLabel && (
            <span className="shop-mp-card-badge shop-mp-card-badge-response" title="Response time">
              <MessageCircle size={12} />
              {responseLabel}
            </span>
          )}
        </div>
        {(biz?.region || biz?.district) && (
          <span className="shop-mp-card-location">
            <MapPin size={12} />
            {[biz.district, biz.region].filter(Boolean).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}
