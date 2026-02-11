import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Coins, Banknote, History, CreditCard } from 'lucide-react';
import { getWallet, getMyWithdrawals, requestWithdraw } from '@/lib/api/gifts';
import { getMyPayments } from '@/lib/api/payments';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/user-app.css';

function formatDate(str) {
  if (!str) return '—';
  try {
    const d = new Date(str);
    return d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return str;
  }
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [activeTab, setActiveTab] = useState('payments'); // payments | withdrawals

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getWallet(),
      getMyWithdrawals().then((r) => r?.content ?? []),
      getMyPayments().then((r) => r?.content ?? []),
    ])
      .then(([w, wd, pm]) => {
        if (!cancelled) {
          setWallet(w ?? null);
          setWithdrawals(Array.isArray(wd) ? wd : []);
          setPayments(Array.isArray(pm) ? pm : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWallet(null);
          setWithdrawals([]);
          setPayments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    const phone = (withdrawPhone || '').trim();
    if (!amount || amount <= 0 || !phone) {
      setWithdrawError('Enter amount and phone number.');
      return;
    }
    const cash = wallet?.cashBalance ?? 0;
    if (amount > cash) {
      setWithdrawError('Amount exceeds your cash balance.');
      return;
    }
    setWithdrawing(true);
    setWithdrawError('');
    try {
      await requestWithdraw({ amount, phone });
      setWithdrawAmount('');
      setWithdrawPhone('');
      const wd = await getMyWithdrawals();
      setWithdrawals(wd?.content ?? []);
      const w = await getWallet();
      setWallet(w ?? null);
    } catch (err) {
      setWithdrawError(getApiErrorMessage(err, 'Withdrawal request failed.'));
    } finally {
      setWithdrawing(false);
    }
  };

  const cashBalance = wallet?.cashBalance ?? 0;
  const coinBalance = wallet?.coinBalance ?? 0;

  if (loading) {
    return (
      <div className="user-app-card wallet-page">
        <div className="wallet-loading">
          <p>Loading wallet…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-app-card wallet-page">
      <header className="wallet-header">
        <h1 className="wallet-title">
          <WalletIcon size={24} />
          Wallet
        </h1>
        <p className="wallet-subtitle">Coins for gifts · Cash from live (withdraw via Haraka Pay)</p>
      </header>

      <div className="wallet-balances">
        <div className="wallet-balance-card">
          <Coins size={28} />
          <span className="wallet-balance-label">Coins</span>
          <span className="wallet-balance-value">{Number(coinBalance).toLocaleString()}</span>
          <span className="wallet-balance-hint">Send gifts on live</span>
        </div>
        <div className="wallet-balance-card">
          <Banknote size={28} />
          <span className="wallet-balance-label">Cash balance</span>
          <span className="wallet-balance-value">{Number(cashBalance).toLocaleString()} TZS</span>
          <span className="wallet-balance-hint">Earned from gifts · withdraw to phone</span>
        </div>
      </div>

      {cashBalance > 0 && (
        <section className="wallet-section wallet-withdraw">
          <h2 className="wallet-section-title">Withdraw cash</h2>
          <form onSubmit={handleWithdraw} className="wallet-withdraw-form">
            <div className="wallet-field">
              <label htmlFor="withdraw-amount">Amount (TZS)</label>
              <input
                id="withdraw-amount"
                type="number"
                min="1"
                step="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="wallet-field">
              <label htmlFor="withdraw-phone">Phone (for Haraka Pay)</label>
              <input
                id="withdraw-phone"
                type="tel"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder="+255712345678"
              />
            </div>
            {withdrawError && (
              <p className="wallet-error" role="alert">{withdrawError}</p>
            )}
            <button type="submit" className="wallet-btn wallet-btn-primary" disabled={withdrawing}>
              {withdrawing ? 'Requesting…' : 'Request withdrawal'}
            </button>
          </form>
        </section>
      )}

      <div className="wallet-tabs">
        <button
          type="button"
          className={`wallet-tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={18} />
          Payment history
        </button>
        <button
          type="button"
          className={`wallet-tab ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <History size={18} />
          Withdrawals
        </button>
      </div>

      {activeTab === 'payments' && (
        <section className="wallet-section">
          <h2 className="wallet-section-title">Payment history</h2>
          {payments.length === 0 ? (
            <p className="wallet-empty">No payments yet.</p>
          ) : (
            <ul className="wallet-list">
              {payments.map((p) => (
                <li key={p.id ?? p.transactionId} className="wallet-list-item">
                  <span className="wallet-list-amount">{p.amount ?? 0} {p.type === 'COIN_PURCHASE' ? 'coins' : 'TZS'}</span>
                  <span className="wallet-list-type">{p.type ?? '—'}</span>
                  <span className="wallet-list-status">{p.status ?? '—'}</span>
                  <span className="wallet-list-date">{formatDate(p.paidAt ?? p.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'withdrawals' && (
        <section className="wallet-section">
          <h2 className="wallet-section-title">Withdrawal history</h2>
          {withdrawals.length === 0 ? (
            <p className="wallet-empty">No withdrawals yet.</p>
          ) : (
            <ul className="wallet-list">
              {withdrawals.map((w) => (
                <li key={w.id} className="wallet-list-item">
                  <span className="wallet-list-amount">{Number(w.amount ?? 0).toLocaleString()} TZS</span>
                  <span className="wallet-list-status">{w.status ?? 'PENDING'}</span>
                  <span className="wallet-list-date">{formatDate(w.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <style>{`
        .wallet-page { max-width: 640px; margin: 0 auto; padding: 24px; }
        .wallet-loading { padding: 48px; text-align: center; color: #65676b; }
        .wallet-header { margin-bottom: 24px; }
        .wallet-title { display: flex; align-items: center; gap: 10px; margin: 0 0 8px 0; font-size: 1.5rem; font-weight: 700; }
        .wallet-subtitle { margin: 0; font-size: 0.9375rem; color: #65676b; }
        .wallet-balances { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .wallet-balance-card { background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
        .wallet-balance-card .wallet-balance-label { font-size: 0.8125rem; color: #6b21a8; font-weight: 500; }
        .wallet-balance-card .wallet-balance-value { font-size: 1.5rem; font-weight: 700; color: #050505; }
        .wallet-balance-card .wallet-balance-hint { font-size: 0.75rem; color: #65676b; }
        .wallet-section { margin-bottom: 24px; }
        .wallet-section-title { margin: 0 0 12px 0; font-size: 1rem; font-weight: 600; }
        .wallet-withdraw-form { display: flex; flex-direction: column; gap: 12px; max-width: 320px; }
        .wallet-field label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 4px; }
        .wallet-field input { width: 100%; padding: 10px 12px; border: 1px solid #e4e6eb; border-radius: 8px; font-size: 0.9375rem; box-sizing: border-box; }
        .wallet-error { margin: 0; font-size: 0.875rem; color: #b91c1c; }
        .wallet-btn { padding: 10px 20px; font-size: 0.9375rem; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; }
        .wallet-btn-primary { background: #7c3aed; color: #fff; }
        .wallet-btn-primary:hover:not(:disabled) { background: #6d28d9; }
        .wallet-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .wallet-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .wallet-tab { display: flex; align-items: center; gap: 8px; padding: 10px 16px; font-size: 0.9375rem; font-weight: 500; background: #e4e6eb; border: none; border-radius: 8px; cursor: pointer; }
        .wallet-tab.active { background: #7c3aed; color: #fff; }
        .wallet-empty { margin: 0; padding: 24px; color: #65676b; font-size: 0.9375rem; }
        .wallet-list { list-style: none; margin: 0; padding: 0; }
        .wallet-list-item { display: grid; grid-template-columns: 1fr auto auto auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid #e4e6eb; font-size: 0.9375rem; }
        .wallet-list-amount { font-weight: 600; }
        .wallet-list-type, .wallet-list-status { color: #65676b; }
        .wallet-list-date { font-size: 0.8125rem; color: #65676b; }
      `}</style>
    </div>
  );
}
