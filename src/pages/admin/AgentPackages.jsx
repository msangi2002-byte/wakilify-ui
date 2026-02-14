import { useState, useEffect, useCallback } from 'react';
import { Package as PackageIcon, Plus, Edit, Trash2, DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';
import { getAgentPackages, createAgentPackage, updateAgentPackage, deleteAgentPackage } from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

export default function AgentPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    numberOfBusinesses: '',
    isActive: true,
    isPopular: false,
    sortOrder: 0,
  });

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAgentPackages();
      setPackages(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load agent packages'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        numberOfBusinesses: parseInt(formData.numberOfBusinesses),
        isActive: formData.isActive,
        isPopular: formData.isPopular,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      if (editingPackage) {
        await updateAgentPackage(editingPackage.id, data);
        setSuccess('Agent package updated successfully');
      } else {
        await createAgentPackage(data);
        setSuccess('Agent package created successfully');
      }

      setShowForm(false);
      setEditingPackage(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        numberOfBusinesses: '',
        isActive: true,
        isPopular: false,
        sortOrder: 0,
      });
      loadPackages();
    } catch (err) {
      setError(getApiErrorMessage(err, editingPackage ? 'Failed to update package' : 'Failed to create package'));
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      description: pkg.description || '',
      price: pkg.price?.toString() || '',
      numberOfBusinesses: pkg.numberOfBusinesses?.toString() || '',
      isActive: pkg.isActive ?? true,
      isPopular: pkg.isPopular ?? false,
      sortOrder: pkg.sortOrder || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (packageId) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await deleteAgentPackage(packageId);
      setSuccess('Agent package deleted successfully');
      loadPackages();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete package'));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPackage(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      numberOfBusinesses: '',
      isActive: true,
      isPopular: false,
      sortOrder: 0,
    });
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Agent Packages Management
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Create and manage agent packages (price and number of businesses)
            </p>
          </div>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'rgba(124, 58, 237, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7c3aed'
          }}>
            <PackageIcon size={28} />
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="admin-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Create New Package
          </button>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            marginTop: '24px',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#10b981',
            marginTop: '24px',
          }}>
            {success}
          </div>
        )}
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '32px' }}>
          <h2 className="admin-card-title" style={{ marginBottom: '24px' }}>
            {editingPackage ? 'Edit Agent Package' : 'Create New Agent Package'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Starter Package, Business Package"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Package description..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>
                    Price (TZS) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="50000.00"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>
                    Number of Businesses *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.numberOfBusinesses}
                    onChange={(e) => setFormData({ ...formData, numberOfBusinesses: e.target.value })}
                    placeholder="5"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Active
                  </label>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Popular
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.875rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="admin-btn-primary" style={{ flex: 1 }}>
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </button>
                <button type="button" onClick={handleCancel} className="admin-btn-ghost">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Loading packages...
          </div>
        ) : packages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            No packages found. Create your first package!
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="admin-card-title">Agent Packages</h2>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                Total: {packages.length} packages
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  style={{
                    padding: '24px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ color: '#fff', fontWeight: 600, fontSize: '1.125rem', margin: 0 }}>
                          {pkg.name}
                        </h3>
                        {pkg.isPopular && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            Popular
                          </span>
                        )}
                        {pkg.isActive ? (
                          <CheckCircle size={16} style={{ color: '#10b981' }} />
                        ) : (
                          <XCircle size={16} style={{ color: '#ef4444' }} />
                        )}
                      </div>
                      {pkg.description && (
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', margin: 0 }}>
                          {pkg.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                      <DollarSign size={18} style={{ color: '#7c3aed' }} />
                      <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>
                        TZS {pkg.price?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                      <Users size={18} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.875rem' }}>
                        {pkg.numberOfBusinesses || 0} businesses
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="admin-btn-ghost"
                      style={{ flex: 1, padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="admin-btn-ghost"
                      style={{ padding: '8px 16px', fontSize: '0.875rem', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
