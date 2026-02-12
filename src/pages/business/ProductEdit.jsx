import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, Save, X, AlertCircle, Loader2, ImagePlus } from 'lucide-react';
import { getProductById, updateProduct } from '@/lib/api/business';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/business.css';

export default function ProductEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
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
        // Store existing images
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

  const handleImageChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) return;
    
    // Limit to 10 total images (existing + new)
    const maxImages = 10;
    const totalImages = existingImages.length + images.length;
    const availableSlots = maxImages - totalImages;
    
    if (availableSlots <= 0) {
      setError('Maximum 10 images allowed');
      return;
    }

    const newImages = [...images, ...chosen].slice(0, availableSlots);
    setImages(newImages);
    
    // Create previews
    const newPreviews = [...imagePreviews];
    chosen.slice(0, availableSlots).forEach((file) => {
      const url = URL.createObjectURL(file);
      newPreviews.push(url);
    });
    setImagePreviews(newPreviews);
    
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (imageId) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
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

      await updateProduct(id, payload);
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

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#111827' }}>
            Product Images
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            style={{ display: 'none' }}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting || (existingImages.length + images.length) >= 10}
            className="business-btn-ghost"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
          >
            <ImagePlus size={18} />
            {(existingImages.length + images.length) >= 10 
              ? 'Maximum 10 images' 
              : `Add Images (${existingImages.length + images.length}/10)`}
          </button>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              {existingImages.map((img) => (
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
                  {img.isPrimary && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: 'rgba(59, 130, 246, 0.9)',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Primary
                    </div>
                  )}
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

          {/* New Image Previews */}
          {imagePreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginTop: '12px' }}>
              {imagePreviews.map((preview, index) => (
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
                    alt={`Preview ${index + 1}`}
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
                    onClick={() => removeNewImage(index)}
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
          <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
            {existingImages.length === 0 && imagePreviews.length === 0 
              ? 'Add up to 10 images. The first image will be used as the primary/thumbnail.'
              : 'Note: Image updates may require a separate API endpoint. Current images are shown for reference.'}
          </p>
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
