import { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { boostProductOrBusiness } from '@/lib/api/promotions';
import { checkPaymentStatus } from '@/lib/api/ads';
import { getApiErrorMessage } from '@/lib/utils/apiError';

export default function PromoteModal({ type, targetId, title, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [budget, setBudget] = useState(10000);
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (user?.phone) setPaymentPhone(user.phone); }, [user?.phone]);

  const handlePromote = async () => {
    if (!paymentPhone?.trim()) {
      setError('Namba ya simu ya malipo inahitajika');
      return;
    }
    if (budget < 5000) {
      setError('Budget lazima angalau TZS 5,000');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await boostProductOrBusiness({
        type,
        targetId,
        budget,
        paymentPhone: paymentPhone.trim(),
      });
      setSuccess(result?.message || 'USSD imetumwa. Fuata maelekezo kukamilisha malipo.');
      const interval = setInterval(async () => {
        try {
          const status = await checkPaymentStatus(result.orderId);
          if (status?.status === 'SUCCESS') {
            clearInterval(interval);
            setSuccess('Malipo yametumwa! Tangazo lako linaanza kuonyeshwa.');
            onSuccess?.();
            setTimeout(onClose, 2000);
          } else if (status?.status === 'FAILED' || status?.status === 'CANCELLED') {
            clearInterval(interval);
            setError('Malipo yameshindwa au yameghairiwa.');
          }
        } catch (_) {}
      }, 3000);
      setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Shida wakati wa kutangaza'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="promote-modal-backdrop" onClick={onClose} role="presentation">
      <div className="promote-modal" onClick={(e) => e.stopPropagation()}>
        <div className="promote-modal-header">
          <h3><TrendingUp size={22} /> Tangaza {type === 'PRODUCT' ? 'Bidhaa' : 'Biashara'}</h3>
          <button type="button" className="promote-modal-close" onClick={onClose} aria-label="Funga">
            <X size={20} />
          </button>
        </div>
        <div className="promote-modal-body">
          <p className="promote-modal-desc">{title}</p>
          <div className="promote-form-group">
            <label>Budget (TZS)</label>
            <input
              type="number"
              min={5000}
              step={1000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 5000)}
            />
          </div>
          <div className="promote-form-group">
            <label>Namba ya simu (malipo)</label>
            <input
              type="tel"
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              placeholder="+255712345678"
            />
          </div>
          {error && <p className="promote-error">{error}</p>}
          {success && <p className="promote-success">{success}</p>}
        </div>
        <div className="promote-modal-footer">
          <button type="button" className="business-btn-ghost" onClick={onClose}>Ghairi</button>
          <button
            type="button"
            className="business-btn-primary"
            onClick={handlePromote}
            disabled={loading}
          >
            {loading ? 'Inaendesha...' : 'Tangaza'}
          </button>
        </div>
      </div>
    </div>
  );
}
