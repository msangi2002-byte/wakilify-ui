import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, Save, X, AlertCircle, Loader2, ImagePlus, Camera } from 'lucide-react';
import { getProductById, updateProduct } from '@/lib/api/business';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

export default function ProductEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stockQuantity: '',
  });

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        setError('Product ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const product = await getProductById(id);
        setFormData({
          name: product.name || '',
          price: product.price || '',
          description: product.description || '',
          category: product.category || '',
          stockQuantity: product.stockQuantity !== null && product.stockQuantity !== undefined ? product.stockQuantity : '',
        });
        // Store existing images (first primary/thumbnail is cover, rest are gallery)
        if (product.images && product.images.length > 0) {
          setExistingImages(product.images);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load product'));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stockQuantity' ? (value === '' ? '' : parseFloat(value) || '') : value,
    }));
    setError('');
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverImage(null);
    setCoverPreview(null);
  };

  const handleGalleryChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) return;
    const maxGallery = 9;
    const existingCount = existingImages.filter((img) => !img.isPrimary).length;
    const availableSlots = maxGallery - existingCount - galleryImages.length;
    if (availableSlots <= 0) {
      setError('Maximum 9 gallery images allowed');
      return;
    }
    const newImages = [...galleryImages, ...chosen].slice(0, galleryImages.length + availableSlots);
    setGalleryImages(newImages);
    const newPreviews = [...galleryPreviews];
    chosen.slice(0, availableSlots).forEach((file) => {
      newPreviews.push(URL.createObjectURL(file));
    });
    setGalleryPreviews(newPreviews);
    e.target.value = '';
  };

  const removeNewGalleryImage = (index) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (imageId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  // Current cover URL: new preview, or existing primary/thumbnail
  const currentCoverUrl = coverPreview || (existingImages.find((img) => img.isPrimary)?.url) || (existingImages[0]?.url);

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      galleryPreviews.forEach((url) => { if (url) URL.revokeObjectURL(url); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setError('Valid price is required (must be greater than 0)');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare payload - only include fields that have values
      const payload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
      };

      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      if (formData.category.trim()) {
        payload.category = formData.category.trim();
      }

      if (formData.stockQuantity !== '' && formData.stockQuantity !== null) {
        const stock = parseInt(formData.stockQuantity, 10);
        if (!isNaN(stock) && stock >= 0) {
          payload.stockQuantity = stock;
        }
      }

      const newCover = coverImage && coverImage instanceof File ? coverImage : null;
      const newGallery = Array.isArray(galleryImages) && galleryImages.length > 0 ? galleryImages : [];
      await updateProduct(id, payload, newCover, newGallery);
      navigate('/business/products');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update product'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/business/products');
  };

  if (loading) {
    return (
      <div className="business-loading">
        <Loader2 size={32} className="icon-spin" />
        <div>Loading product...</div>
      </div>
    );
  }

  return (
    <div className="business-main" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="business-dashboard-title" style={{ margin: 0, marginBottom: '8px' }}>
          <Package size={28} />
          Edit Product
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
          Update your product information
        </p>
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

      <form onSubmit={handleSubmit} className="business-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
            Product Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="business-input"
            placeholder="e.g., Smart Watch Pro"
            style={{ width: '100%' }}
            disabled={submitting}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="price" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
            Price (TZS) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="business-input"
            placeholder="e.g., 120000"
            style={{ width: '100%' }}
            disabled={submitting}
          />
          {formData.price && (
            <p style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6b7280' }}>
              {new Intl.NumberFormat('en-TZ', {
                style: 'currency',
                currency: 'TZS',
                minimumFractionDigits: 0,
              }).format(parseFloat(formData.price) || 0)}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="business-input"
            placeholder="Describe your product (features, benefits, etc.)"
            style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            disabled={submitting}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="category" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="business-input"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            <option value="">Select a category</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Home">Home</option>
            <option value="Sports">Sports</option>
            <option value="Beauty & Personal Care">Beauty & Personal Care</option>
            <option value="Books & Media">Books & Media</option>
            <option value="Toys & Games">Toys & Games</option>
            <option value="Automotive">Automotive</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="stockQuantity" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
            Stock Quantity
          </label>
          <input
            type="number"
            id="stockQuantity"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleChange}
            min="0"
            step="1"
            className="business-input"
            placeholder="e.g., 10 (leave empty for unlimited)"
            style={{ width: '100%' }}
            disabled={submitting}
          />
          <p style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6b7280' }}>
            Leave empty if you have unlimited stock
          </p>
        </div>

        {/* Cover image – thumbnail and main image on product details */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
            Cover image
          </label>
          <p style={{ marginBottom: '10px', fontSize: '0.875rem', color: '#6b7280' }}>
            Used as thumbnail in listings and as the main image on the product details page.
          </p>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            style={{ display: 'none' }}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={submitting}
            className="business-btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
          >
            <Camera size={18} />
            {coverPreview ? 'Change cover image' : currentCoverUrl ? 'Replace cover image' : 'Choose cover image'}
          </button>
          {currentCoverUrl && (
            <div
              style={{
                position: 'relative',
                maxWidth: '280px',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
              }}
            >
              <img
                src={currentCoverUrl}
                alt="Cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  background: 'rgba(59, 130, 246, 0.9)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Thumbnail &amp; main image
              </div>
              {coverPreview && (
                <button
                  type="button"
                  onClick={removeCover}
                  disabled={submitting}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  aria-label="Remove cover"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Gallery images – shown on product details */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
            Gallery images
          </label>
          <p style={{ marginBottom: '10px', fontSize: '0.875rem', color: '#6b7280' }}>
            Additional images shown on the product details page (up to 9). Existing images below can be removed; new ones are added on save.
          </p>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryChange}
            style={{ display: 'none' }}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={submitting || (existingImages.filter((i) => !i.isPrimary).length + galleryImages.length) >= 9}
            className="business-btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
          >
            <ImagePlus size={18} />
            {(existingImages.filter((i) => !i.isPrimary).length + galleryImages.length) >= 9
              ? 'Maximum 9 gallery images'
              : `Add gallery images (${existingImages.filter((i) => !i.isPrimary).length + galleryImages.length}/9)`}
          </button>

          {/* Existing gallery (non-cover) images */}
          {existingImages.filter((img) => !img.isPrimary).length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              {existingImages.filter((img) => !img.isPrimary).map((img) => (
                <div
                  key={img.id}
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                  }}
                >
                  <img
                    src={img.url}
                    alt="Product"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.id)}
                    disabled={submitting}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New gallery previews */}
          {galleryPreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginTop: '12px' }}>
              {galleryPreviews.map((preview, index) => (
                <div
                  key={`new-${index}`}
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                  }}
                >
                  <img
                    src={preview}
                    alt={`New ${index + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeNewGalleryImage(index)}
                    disabled={submitting}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button
            type="button"
            className="business-btn-ghost"
            onClick={handleCancel}
            disabled={submitting}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            type="submit"
            className="business-btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="icon-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save size={18} />
                Update Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
