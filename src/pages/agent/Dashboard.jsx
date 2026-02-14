import { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Banknote,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Inbox,
  Package,
  ShoppingCart,
  CheckCircle,
} from 'lucide-react';
import {
  getAgentDashboard,
  getAgentCommissions,
  getAgentWithdrawals,
  getAgentPackages,
  purchaseAgentPackage,
} from '@/lib/api/agent';
import { checkPaymentStatus } from '@/lib/api/payments';
import { getApiErrorMessage } from '@/lib/utils/apiError';
import '@/styles/agent.css';

function formatAmount(n) {
  if (n == null || n === undefined) return '0';
  const num = typeof n === 'number' ? n : parseFloat(n);
  if (Number.isNaN(num)) return '0';
  return new Intl.NumberFormat('en-TZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [commissions, setCommissions] = useState({ content: [] });
  const [withdrawals, setWithdrawals] = useState({ content: [] });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [packageError, setPackageError] = useState('');
  const [packageSuccess, setPackageSuccess] = useState('');
  const [purchasingId, setPurchasingId] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      getAgentDashboard(),
      getAgentCommissions({ page: 0, size: 10 }).then((r) => r || { content: [] }).catch(() => ({ content: [] })),
      getAgentWithdrawals({ page: 0, size: 10 }).then((r) => r || { content: [] }).catch(() => ({ content: [] })),
      getAgentPackages().then((r) => Array.isArray(r) ? r : []).catch(() => []),
    ])
      .then(([dash, comm, wdraw, pkgs]) => {
        if (cancelled) return;
        setDashboard(dash ?? null);
        setCommissions(Array.isArray(comm?.content) ? comm : { content: [] });
        setWithdrawals(Array.isArray(wdraw?.content) ? wdraw : { content: [] });
        setPackages(Array.isArray(pkgs) ? pkgs : []);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load dashboard'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const activityItems = useMemo(() => {
    const items = [];
    const commList = Array.isArray(commissions.content) ? commissions.content : [];
    const wdrawList = Array.isArray(withdrawals.content) ? withdrawals.content : [];
    commList.forEach((c) => {
      items.push({
        id: `comm-${c.id}`,
        type: 'commission',
        title: 'Commission recorded',
        description: c.description || `Commission: ${formatAmount(c.amount)}`,
        amount: c.amount,
        status: c.status,
        createdAt: c.createdAt,
        icon: 'commission',
        statusClass: (c.status || '').toUpperCase() === 'PAID' ? 'success' : 'pending',
      });
    });
    wdrawList.forEach((w) => {
      const status = (w.status || '').toUpperCase();
      items.push({
        id: `wdraw-${w.id}`,
        type: 'withdrawal',
        title: status === 'SUCCESS' || status === 'COMPLETED' ? 'Paid out (Success)' : status === 'PENDING' ? 'Withdrawal pending' : 'Withdrawal',
        description: `Withdrawal ${formatAmount(w.amount)}`,
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt,
        icon: status === 'SUCCESS' || status === 'COMPLETED' ? 'payout' : 'warning',
        statusClass: status === 'SUCCESS' || status === 'COMPLETED' ? 'success' : status === 'PENDING' ? 'warning' : 'pending',
      });
    });
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return items.slice(0, 15);
  }, [commissions.content, withdrawals.content]);

  if (loading && !dashboard) {
    return (
      <div className="agent-loading">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="agent-dashboard">
      <h1 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700 }}>
        Agent Overview
      </h1>
      {error && (
        <div className="agent-card" style={{ marginBottom: 20, borderColor: '#F09068' }}>
          <p style={{ color: '#F09068', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Overview stats */}
      <div className="agent-grid agent-grid-2" style={{ marginBottom: 24 }}>
        <div className="agent-card">
          <div className="agent-stat-value gold">
            {dashboard?.currentBalance != null ? `TZS ${formatAmount(dashboard.currentBalance)}` : '—'}
          </div>
          <div className="agent-stat-label">Current wallet balance</div>
        </div>
        <div className="agent-card">
          <div className="agent-stat-value gold">
            {dashboard?.totalEarnings != null ? `TZS ${formatAmount(dashboard.totalEarnings)}` : '—'}
          </div>
          <div className="agent-stat-label">Total commission earned</div>
        </div>
        <div className="agent-card">
          <div className="agent-stat-value">
            {dashboard?.totalBusinessesActivated ?? 0}
          </div>
          <div className="agent-stat-label">Active businesses</div>
        </div>
        <div className="agent-card">
          <div className="agent-stat-value warning">
            {dashboard?.pendingWithdrawals != null ? `TZS ${formatAmount(dashboard.pendingWithdrawals)}` : '—'}
          </div>
          <div className="agent-stat-label">Pending withdrawals</div>
        </div>
      </div>

      {/* Package Information */}
      {dashboard?.packageName && (
        <div className="agent-card" style={{ marginBottom: 24, background: 'rgba(124, 58, 237, 0.1)', borderColor: '#7c3aed' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 className="agent-card-title" style={{ marginBottom: '8px' }}>
                <Package size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Current Package: {dashboard.packageName}
              </h2>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div className="agent-stat-label">Business Limit</div>
                  <div className="agent-stat-value" style={{ fontSize: '1.25rem' }}>
                    {dashboard.packageMaxBusinesses || 0} businesses
                  </div>
                </div>
                <div>
                  <div className="agent-stat-label">Activated</div>
                  <div className="agent-stat-value" style={{ fontSize: '1.25rem' }}>
                    {dashboard.totalBusinessesActivated || 0} businesses
                  </div>
                </div>
                <div>
                  <div className="agent-stat-label">Remaining</div>
                  <div className="agent-stat-value" style={{ fontSize: '1.25rem', color: dashboard.packageRemainingBusinesses > 0 ? '#38B068' : '#F09068' }}>
                    {dashboard.packageRemainingBusinesses || 0} businesses
                  </div>
                </div>
              </div>
            </div>
            {dashboard.packageRemainingBusinesses === 0 && (
              <div style={{ padding: '12px 16px', background: 'rgba(240, 144, 104, 0.2)', borderRadius: '8px', border: '1px solid #F09068' }}>
                <p style={{ margin: 0, color: '#F09068', fontSize: '0.875rem', fontWeight: 600 }}>
                  <AlertTriangle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Package limit reached! Upgrade to activate more businesses.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Available Packages */}
      {packages.length > 0 && (
        <div className="agent-card" style={{ marginBottom: 24 }}>
          <h2 className="agent-card-title">
            <Package size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Available Packages
          </h2>
          <p className="agent-stat-label" style={{ marginBottom: '20px' }}>
            {dashboard?.packageName ? 'Upgrade your package to activate more businesses' : 'Purchase a package to start activating businesses'}
          </p>

          {packageError && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(240, 144, 104, 0.1)',
              border: '1px solid #F09068',
              borderRadius: '8px',
              color: '#F09068',
              marginBottom: '16px',
            }}>
              {packageError}
            </div>
          )}

          {packageSuccess && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(56, 176, 104, 0.1)',
              border: '1px solid #38B068',
              borderRadius: '8px',
              color: '#38B068',
              marginBottom: '16px',
            }}>
              {packageSuccess}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {packages.map((pkg) => {
              const isCurrentPackage = dashboard?.packageId === pkg.id;
              const isPurchasing = purchasingId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  style={{
                    padding: '20px',
                    background: isCurrentPackage ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: isCurrentPackage ? '2px solid #7c3aed' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    position: 'relative',
                  }}
                >
                  {pkg.isPopular && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '4px 8px',
                      background: '#7c3aed',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      Popular
                    </div>
                  )}
                  {isCurrentPackage && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: pkg.isPopular ? '60px' : '12px',
                      padding: '4px 8px',
                      background: '#38B068',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <CheckCircle size={12} />
                      Current
                    </div>
                  )}
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                    {pkg.name}
                  </h3>
                  {pkg.description && (
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {pkg.description}
                    </p>
                  )}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F0C674', marginBottom: '4px' }}>
                      TZS {formatAmount(pkg.price)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      Up to {pkg.numberOfBusinesses} businesses
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (isCurrentPackage) return;
                      setSelectedPackage(pkg);
                      setPaymentPhone('');
                      setOrderId(null);
                      setPackageError('');
                      setPackageSuccess('');
                    }}
                    disabled={isCurrentPackage || isPurchasing}
                    className={isCurrentPackage ? 'agent-btn-ghost' : 'agent-btn-primary'}
                    style={{ width: '100%' }}
                  >
                    {isCurrentPackage ? (
                      <>
                        <CheckCircle size={18} />
                        Current Package
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Purchase Package
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!dashboard?.packageName && packages.length === 0 && (
        <div className="agent-card" style={{ marginBottom: 24, background: 'rgba(240, 144, 104, 0.1)', borderColor: '#F09068' }}>
          <p style={{ margin: 0, color: '#F09068' }}>
            <AlertTriangle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            No package assigned. Please contact admin to assign a package.
          </p>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPackage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="agent-card" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => {
                setSelectedPackage(null);
                setPaymentPhone('');
                setOrderId(null);
                setPackageError('');
                setPackageSuccess('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '24px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <h2 className="agent-card-title" style={{ marginBottom: '8px' }}>
              Purchase Package: {selectedPackage.name}
            </h2>
            <p className="agent-stat-label" style={{ marginBottom: '24px' }}>
              Price: TZS {formatAmount(selectedPackage.price)}
            </p>

            {!orderId ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!paymentPhone.trim()) {
                  setPackageError('Payment phone number is required');
                  return;
                }
                setPurchasingId(selectedPackage.id);
                setPackageError('');
                setPackageSuccess('');
                try {
                  const result = await purchaseAgentPackage(selectedPackage.id, paymentPhone.trim());
                  setOrderId(result.orderId);
                  setPackageSuccess(result.message || 'USSD push imetumwa kwa simu yako. Fuata maelekezo kukamilisha malipo.');
                  // Start polling for payment status
                  const interval = setInterval(async () => {
                    try {
                      const status = await checkPaymentStatus(result.orderId);
                      if (status?.status === 'SUCCESS') {
                        clearInterval(interval);
                        setPackageSuccess('Payment completed! Package activated successfully.');
                        // Reload dashboard
                        const dash = await getAgentDashboard();
                        setDashboard(dash ?? null);
                        setTimeout(() => {
                          setSelectedPackage(null);
                          setPaymentPhone('');
                          setOrderId(null);
                          setPackageSuccess('');
                        }, 3000);
                      } else if (status?.status === 'FAILED' || status?.status === 'CANCELLED') {
                        clearInterval(interval);
                        setPackageError('Payment failed or was cancelled. Please try again.');
                        setOrderId(null);
                      }
                    } catch (err) {
                      // Continue polling on error
                    }
                  }, 3000);
                  // Stop polling after 5 minutes
                  setTimeout(() => clearInterval(interval), 300000);
                } catch (err) {
                  setPackageError(getApiErrorMessage(err, 'Failed to initiate payment'));
                } finally {
                  setPurchasingId(null);
                }
              }}>
                <div className="agent-form-field" style={{ marginBottom: '20px' }}>
                  <label className="agent-label" htmlFor="paymentPhone">Payment Phone Number *</label>
                  <input
                    id="paymentPhone"
                    type="tel"
                    className="agent-input"
                    placeholder="+255712345678"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    required
                  />
                  <span className="agent-stat-label" style={{ marginTop: '4px', display: 'block' }}>
                    USSD push will be sent to this number to complete payment
                  </span>
                </div>

                {packageError && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(240, 144, 104, 0.1)',
                    border: '1px solid #F09068',
                    borderRadius: '8px',
                    color: '#F09068',
                    marginBottom: '16px',
                  }}>
                    {packageError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="agent-btn-ghost"
                    onClick={() => {
                      setSelectedPackage(null);
                      setPaymentPhone('');
                      setPackageError('');
                      setPackageSuccess('');
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="agent-btn-primary"
                    disabled={purchasingId === selectedPackage.id}
                    style={{ flex: 1 }}
                  >
                    {purchasingId === selectedPackage.id ? (
                      <>
                        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        Initiating...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Pay TZS {formatAmount(selectedPackage.price)}
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{
                  padding: '16px',
                  background: 'rgba(56, 176, 104, 0.1)',
                  border: '1px solid #38B068',
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}>
                  <p style={{ margin: 0, color: '#38B068', fontWeight: 600 }}>
                    <CheckCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {packageSuccess}
                  </p>
                  <p style={{ margin: '8px 0 0 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                    Order ID: {orderId}
                  </p>
                </div>
                {checkingPayment && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                    <p>Checking payment status...</p>
                  </div>
                )}
                <button
                  className="agent-btn-primary"
                  onClick={() => {
                    setSelectedPackage(null);
                    setPaymentPhone('');
                    setOrderId(null);
                    setPackageError('');
                    setPackageSuccess('');
                  }}
                  style={{ width: '100%' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="agent-dashboard-two-col">
        {/* Recent activity */}
        <div className="agent-card">
          <h2 className="agent-card-title">Recent Activity</h2>
          {activityItems.length === 0 ? (
            <p className="agent-empty">No recent activity yet.</p>
          ) : (
            <ul className="agent-activity-list">
              {activityItems.map((item) => (
                <li key={item.id} className="agent-activity-item">
                  <div className={`agent-activity-icon ${item.icon}`}>
                    {item.type === 'commission' ? (
                      <Banknote size={18} />
                    ) : item.statusClass === 'success' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>
                  <div className="agent-activity-text">
                    {item.title}
                    {item.description && (
                      <div className="agent-activity-meta">
                        {item.description}
                        {item.amount != null && (
                          <span className="amount-gold" style={{ marginLeft: 8 }}>
                            TZS {formatAmount(item.amount)}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="agent-activity-meta">{formatDate(item.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Business management & quick actions */}
        <div className="agent-card">
          <h2 className="agent-card-title">Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/agent/requests" className="agent-btn-secondary">
              <Inbox size={20} />
              View business requests
            </Link>
            <Link to="/agent/activate" className="agent-btn-primary">
              <Building2 size={20} />
              Activate Business
            </Link>
            <Link to="/agent/commissions" className="agent-btn-ghost">
              <TrendingUp size={20} />
              View Commissions
            </Link>
            <Link to="/agent/withdrawals" className="agent-btn-ghost">
              <Wallet size={20} />
              Request Withdrawal
            </Link>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #6245A1' }}>
            <div className="agent-stat-value" style={{ fontSize: '1.25rem' }}>
              {dashboard?.totalBusinessesActivated ?? 0} businesses
            </div>
            <div className="agent-stat-label">Under your management</div>
          </div>
        </div>
      </div>
    </div>
  );
}
