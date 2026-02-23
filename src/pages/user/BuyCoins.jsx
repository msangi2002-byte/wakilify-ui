import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coins, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { getCoinPackages, getWallet } from '@/lib/api/gifts';
import { checkPaymentStatus } from '@/lib/api/payments';
import { api } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/user-app.css';

const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 60; // ~4 min

function unwrap(res) {
  const data = res?.data;
  if (data?.data !== undefined) return data.data;
  return data;
}

export default function BuyCoins() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // { coins, packageName }

  const coinToTzs = Number(wallet?.coinToTzsBuyRate ?? 43);

  useEffect(() => {
    Promise.all([getCoinPackages(), getWallet()])
      .then(([list, w]) => {
        setPackages(Array.isArray(list) ? list : []);
        setWallet(w ?? null);
      })
      .catch(() => {
        setPackages([]);
        setWallet(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const initiatePurchase = async () => {
    const pkgId = selectedId;
    const phoneTrim = (phone || '').trim();
    if (!pkgId || !phoneTrim) {
      setError('Chagua pakiti na ingiza nambari ya simu.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/coins/purchase', {
        packageId: pkgId,
        phone: phoneTrim,
      });
      const payload = unwrap({ data });
      const transactionId = payload?.transactionId || payload?.orderId;
      if (!transactionId) {
        setError('Malipo yalianza lakini hakuna order ID. Angalia Wallet.');
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      setPolling(true);
      let attempts = 0;
      const pkg = packages.find((p) => p.id === pkgId);
      const coinsToReceive = pkg?.coinAmount ?? 0;
      const pkgName = pkg?.name ?? 'Coins';

      const poll = async () => {
        if (attempts >= POLL_MAX_ATTEMPTS) {
          setPolling(false);
          setError('Muda umekwisha. Angalia Wallet au jaribu tena.');
          return;
        }
        attempts += 1;
        try {
          const statusRes = await checkPaymentStatus(transactionId);
          const status = (statusRes?.status || '').toUpperCase();
          if (status === 'SUCCESS') {
            setPolling(false);
            setSuccess({ coins: coinsToReceive, packageName: pkgName });
            return;
          }
          if (['FAILED', 'CANCELLED', 'REFUNDED'].includes(status)) {
            setPolling(false);
            setError('Malipo yameshindikana au yameghairiwa.');
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
        } catch (e) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      };
      poll();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Kuna tatizo kuanzisha malipo.'));
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="user-app-card buy-coins-page">
        <div className="buy-coins-success">
          <CheckCircle className="buy-coins-success-icon" size={64} />
          <h2>Umepata coins!</h2>
          <p>Umepokea <strong>{Number(success.coins).toLocaleString()}</strong> coins ({success.packageName}).</p>
          <div className="buy-coins-success-actions">
            <Link to="/wallet" className="wallet-btn wallet-btn-primary">Angalia Wallet</Link>
            <button type="button" className="wallet-btn wallet-btn-secondary" onClick={() => navigate('/live')}>
              Nenda Live
            </button>
          </div>
        </div>
        <style>{`
          .buy-coins-page { max-width: 480px; margin: 0 auto; padding: 24px; }
          .buy-coins-success { text-align: center; padding: 32px 0; }
          .buy-coins-success-icon { color: #22c55e; margin-bottom: 16px; }
          .buy-coins-success h2 { margin: 0 0 8px 0; font-size: 1.5rem; }
          .buy-coins-success p { margin: 0 0 24px 0; color: #65676b; }
          .buy-coins-success-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
          .wallet-btn { padding: 10px 20px; font-size: 0.9375rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; text-decoration: none; display: inline-block; }
          .wallet-btn-primary { background: #7c3aed; color: #fff; }
          .wallet-btn-secondary { background: #e4e6eb; color: #050505; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="user-app-card buy-coins-page">
      <header className="buy-coins-header">
        <Link to="/wallet" className="buy-coins-back">
          <ArrowLeft size={20} /> Wallet
        </Link>
        <h1 className="buy-coins-title">
          <Coins size={28} /> Nunua Coins
        </h1>
        <p className="buy-coins-subtitle">Chagua pakiti, ingiza nambari ya simu, kisha kukamilisha malipo kwa USSD. (1 coin ≈ {coinToTzs} TZS)</p>
      </header>

      {loading ? (
        <div className="buy-coins-loading">
          <Loader2 className="animate-spin" size={32} />
          <p>Inapakia pakiti…</p>
        </div>
      ) : (
        <>
          <div className="buy-coins-packages">
            {packages.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`buy-coins-pkg ${selectedId === p.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(p.id)}
              >
                <span className="pkg-coins">{Number(p.coinAmount ?? 0).toLocaleString()} coins</span>
                <span className="pkg-price">{Number(p.price ?? 0).toLocaleString()} TZS</span>
                <span className="pkg-name">{p.name ?? ''}</span>
              </button>
            ))}
          </div>
          {packages.length === 0 && (
            <p className="buy-coins-empty">Hakuna pakiti za coins kwa sasa.</p>
          )}

          <div className="buy-coins-form">
            <label htmlFor="buy-coins-phone">Nambari ya simu (kwa USSD push)</label>
            <input
              id="buy-coins-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="255712345678"
              disabled={submitting || polling}
            />
          </div>

          {error && <p className="wallet-error" role="alert">{error}</p>}

          {polling && (
            <p className="buy-coins-polling">
              <Loader2 className="animate-spin" size={20} /> Subiri malipo kukamilika kwenye simu yako…
            </p>
          )}

          <button
            type="button"
            className="wallet-btn wallet-btn-primary buy-coins-submit"
            disabled={submitting || polling || !selectedId || !(phone || '').trim()}
            onClick={initiatePurchase}
          >
            {submitting ? 'Inatumwa…' : polling ? 'Subiri…' : 'Anzisha malipo'}
          </button>
        </>
      )}

      <style>{`
        .buy-coins-page { max-width: 480px; margin: 0 auto; padding: 24px; }
        .buy-coins-header { margin-bottom: 24px; }
        .buy-coins-back { display: inline-flex; align-items: center; gap: 8px; color: #7c3aed; text-decoration: none; font-size: 0.9375rem; margin-bottom: 12px; }
        .buy-coins-title { display: flex; align-items: center; gap: 10px; margin: 0 0 8px 0; font-size: 1.5rem; font-weight: 700; }
        .buy-coins-subtitle { margin: 0; font-size: 0.9375rem; color: #65676b; }
        .buy-coins-loading { padding: 48px; text-align: center; color: #65676b; }
        .buy-coins-packages { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .buy-coins-pkg { background: #f3e8ff; border: 2px solid #e9d5ff; border-radius: 12px; padding: 16px; text-align: center; cursor: pointer; display: flex; flex-direction: column; gap: 4px; }
        .buy-coins-pkg.selected { border-color: #7c3aed; background: #ede9fe; }
        .buy-coins-pkg .pkg-coins { font-weight: 700; font-size: 1.125rem; color: #050505; }
        .buy-coins-pkg .pkg-price { font-size: 0.875rem; color: #6b21a8; }
        .buy-coins-pkg .pkg-name { font-size: 0.75rem; color: #65676b; }
        .buy-coins-empty { padding: 24px; color: #65676b; margin: 0; }
        .buy-coins-form { margin-bottom: 16px; }
        .buy-coins-form label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 6px; }
        .buy-coins-form input { width: 100%; padding: 10px 12px; border: 1px solid #e4e6eb; border-radius: 8px; font-size: 0.9375rem; box-sizing: border-box; }
        .wallet-error { margin: 0 0 12px 0; font-size: 0.875rem; color: #b91c1c; }
        .buy-coins-polling { display: flex; align-items: center; gap: 8px; margin: 0 0 12px 0; font-size: 0.9375rem; color: #6b21a8; }
        .buy-coins-submit { width: 100%; padding: 12px; }
        .wallet-btn { font-weight: 600; border-radius: 8px; border: none; cursor: pointer; }
        .wallet-btn-primary { background: #7c3aed; color: #fff; }
        .wallet-btn-primary:hover:not(:disabled) { background: #6d28d9; }
        .wallet-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
