import { Skeleton, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for product detail page – image col + info col (title, price, description, seller, order form).
 */
export function ProductDetailsSkeleton() {
  return (
    <div className="product-details-container">
      <div style={{ marginBottom: 16 }}>
          <Skeleton style={{ width: 80, height: 40, borderRadius: 8 }} />
        </div>

      <div className="product-details-grid">
        <div className="product-details-images-col">
          <div className="product-details-image-card">
            <Skeleton style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }} />
          </div>
        </div>

        <div className="product-details-info-col">
          <div className="product-details-info-card">
            <Skeleton style={{ height: 28, width: '80%', marginBottom: 12 }} />
            <Skeleton style={{ height: 20, width: 100, marginBottom: 16 }} />
            <Skeleton style={{ height: 36, width: 140, marginBottom: 20 }} />
            <div className="product-details-block" style={{ marginBottom: 16 }}>
              <Skeleton style={{ height: 18, width: 120, marginBottom: 8 }} />
              <Skeleton style={{ height: 14, width: '100%', marginBottom: 6 }} />
              <Skeleton style={{ height: 14, width: '90%', marginBottom: 6 }} />
              <Skeleton style={{ height: 14, width: '70%' }} />
            </div>
            <div className="product-details-block" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SkeletonCircle size={40} />
              <div style={{ flex: 1 }}>
                <Skeleton style={{ height: 16, width: 120, marginBottom: 6 }} />
                <Skeleton style={{ height: 14, width: 80 }} />
              </div>
            </div>
          </div>

          <div className="product-details-order-card" style={{ marginTop: 24 }}>
            <Skeleton style={{ height: 24, width: 140, marginBottom: 16 }} />
            <Skeleton style={{ height: 48, width: '100%', marginBottom: 16, borderRadius: 8 }} />
            <Skeleton style={{ height: 44, width: '100%', marginBottom: 16, borderRadius: 8 }} />
            <Skeleton style={{ height: 72, width: '100%', marginBottom: 16, borderRadius: 8 }} />
            <Skeleton style={{ height: 44, width: '100%', marginBottom: 16, borderRadius: 8 }} />
            <Skeleton style={{ height: 80, width: '100%', marginBottom: 16, borderRadius: 8 }} />
            <Skeleton style={{ height: 48, width: '100%', borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
