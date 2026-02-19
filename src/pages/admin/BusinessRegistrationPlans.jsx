import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  getBusinessRegistrationPlansAdmin,
  createBusinessRegistrationPlan,
  updateBusinessRegistrationPlan,
  deleteBusinessRegistrationPlan,
} from '@/lib/api/admin';
import { getApiErrorMessage } from '@/lib/utils/apiError';

function formatPrice(price) {
  if (price == null) return 'TZS 0';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function BusinessRegistrationPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sortOrder: 0,
    isActive: true,
  });

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getBusinessRegistrationPlansAdmin();
      setPlans(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load business registration plans'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const priceNum = parseFloat(formData.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid price (number ≥ 0).');
      return;
    }

    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        price: priceNum,
        sortOrder: parseInt(formData.sortOrder, 10) || 0,
        isActive: formData.isActive,
      };

      if (editingPlan) {
        await updateBusinessRegistrationPlan(editingPlan.id, data);
        setSuccess('Plan updated successfully');
      } else {
        await createBusinessRegistrationPlan(data);
        setSuccess('Plan created successfully');
      }

      setShowForm(false);
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        sortOrder: 0,
        isActive: true,
      });
      loadPlans();
    } catch (err) {
      setError(getApiErrorMessage(err, editingPlan ? 'Failed to update plan' : 'Failed to create plan'));
    }
  };

  const handleEdit = (plan) => {
    setSuccess('');
    setError('');
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price?.toString() ?? '',
      sortOrder: plan.sortOrder ?? 0,
      isActive: plan.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan? Users will no longer be able to select it.')) return;
    try {
      await deleteBusinessRegistrationPlan(planId);
      setSuccess('Plan deleted successfully');
      loadPlans();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete plan'));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      sortOrder: 0,
      isActive: true,
    });
  };

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
              Business Registration Plans
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Subscription fees for &quot;Become a business&quot; – users choose a plan when requesting activation.
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
            <CreditCard size={28} />
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => { setSuccess(''); setError(''); setShowForm(true); }}
            className="admin-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Create New Plan
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
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Standard, Premium"
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
                  placeholder="What this plan includes..."
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
                    placeholder="50000"
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
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
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

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  Active (visible to users when choosing a plan)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" className="admin-btn-primary" style={{ flex: 1 }}>
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
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
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255, 255, 255, 0.7)' }}>
            No plans yet. Create your first business registration plan.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className="admin-card-title">Plans</h2>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                Total: {plans.length} plan{plans.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
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
                          {plan.name}
                        </h3>
                        {plan.isActive ? (
                          <CheckCircle size={16} style={{ color: '#10b981' }} />
                        ) : (
                          <XCircle size={16} style={{ color: '#ef4444' }} />
                        )}
                      </div>
                      {plan.description && (
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', margin: 0 }}>
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#fff' }}>
                    <CreditCard size={18} style={{ color: '#7c3aed' }} />
                    <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>
                      {formatPrice(plan.price)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <button
                      onClick={() => handleEdit(plan)}
                      className="admin-btn-ghost"
                      style={{ flex: 1, padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
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
