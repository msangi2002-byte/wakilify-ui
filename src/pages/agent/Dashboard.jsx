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
  getAgentMe,
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
  const [agentProfile, setAgentProfile] = useState(null);
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
      getAgentMe().catch(() => null),
      getAgentCommissions({ page: 0, size: 10 }).then((r) => r || { content: [] }).catch(() => ({ content: [] })),
      getAgentWithdrawals({ page: 0, size: 10 }).then((r) => r || { content: [] }).catch(() => ({ content: [] })),
      getAgentPackages().then((r) => Array.isArray(r) ? r : []).catch(() => []),
    ])
      .then(([dash, profile, comm, wdraw, pkgs]) => {
        if (cancelled) return;
        setDashboard(dash ?? null);
        setAgentProfile(profile ?? null);
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
    <div className="agent-dashboard agent-dashboard-cards">
      <h1 className="agent-dashboard-title">Agent Overview</h1>
      {error && (
        <div className="agent-dashboard-card agent-dashboard-card-error">
          <p className="agent-dashboard-card-error-text">{error}</p>
        </div>
      )}

      {/* Stat cards row */}
      <div className="agent-dashboard-cards-row agent-dashboard-stats">
        <div className="agent-dashboard-card agent-dashboard-stat-card">
          <div className="agent-dashboard-stat-icon agent-dashboard-stat-icon-wallet">
            <Wallet size={24} />
          </div>
          <div className="agent-dashboard-stat-content">
            <div className="agent-stat-value gold">
              {dashboard?.currentBalance != null ? `TZS ${formatAmount(dashboard.currentBalance)}` : '—'}
            </div>
            <div className="agent-stat-label">Current wallet balance</div>
          </div>
        </div>
        <div className="agent-dashboard-card agent-dashboard-stat-card">
          <div className="agent-dashboard-stat-icon agent-dashboard-stat-icon-gold">
            <Banknote size={24} />
          </div>
          <div className="agent-dashboard-stat-content">
            <div className="agent-stat-value gold">
              {dashboard?.totalEarnings != null ? `TZS ${formatAmount(dashboard.totalEarnings)}` : '—'}
            </div>
            <div className="agent-stat-label">Total commission earned</div>
          </div>
        </div>
        <div className="agent-dashboard-card agent-dashboard-stat-card">
          <div className="agent-dashboard-stat-icon agent-dashboard-stat-icon-business">
            <Building2 size={24} />
          </div>
          <div className="agent-dashboard-stat-content">
            <div className="agent-stat-value">
              {dashboard?.totalBusinessesActivated ?? 0}
            </div>
            <div className="agent-stat-label">Active businesses</div>
          </div>
        </div>
        <div className="agent-dashboard-card agent-dashboard-stat-card">
          <div className="agent-dashboard-stat-icon agent-dashboard-stat-icon-warning">
            <AlertTriangle size={24} />
          </div>
          <div className="agent-dashboard-stat-content">
            <div className="agent-stat-value warning">
              {dashboard?.pendingWithdrawals != null ? `TZS ${formatAmount(dashboard.pendingWithdrawals)}` : '—'}
            </div>
            <div className="agent-stat-label">Pending withdrawals</div>
          </div>
        </div>
      </div>

      {/* Content cards row: Package + Quick actions + Recent activity */}
      <div className="agent-dashboard-cards-row agent-dashboard-content-cards">
        {/* Current Package card */}
        {dashboard?.packageName && (
          <div className="agent-dashboard-card agent-dashboard-card-package">
            <h2 className="agent-dashboard-card-heading">
              <Package size={20} />
              Current Package
            </h2>
            <p className="agent-dashboard-card-package-name">{dashboard.packageName}</p>
            <div className="agent-dashboard-card-package-stats">
              <div className="agent-dashboard-card-package-stat">
                <span className="agent-stat-label">Limit</span>
                <span className="agent-stat-value">{dashboard.packageMaxBusinesses || 0}</span>
              </div>
              <div className="agent-dashboard-card-package-stat">
                <span className="agent-stat-label">Activated</span>
                <span className="agent-stat-value">{dashboard.totalBusinessesActivated || 0}</span>
              </div>
              <div className="agent-dashboard-card-package-stat">
                <span className="agent-stat-label">Remaining</span>
                <span className={`agent-stat-value ${dashboard.packageRemainingBusinesses > 0 ? 'success' : 'warning'}`}>
                  {dashboard.packageRemainingBusinesses || 0}
                </span>
              </div>
            </div>
            {dashboard.packageRemainingBusinesses === 0 && (
              <div className="agent-dashboard-card-alert">
                <AlertTriangle size={16} />
                Package limit reached! Upgrade to activate more businesses.
              </div>
            )}
          </div>
        )}

        {/* Quick Actions card */}
        <div className="agent-dashboard-card agent-dashboard-card-actions">
          <h2 className="agent-dashboard-card-heading">Quick Actions</h2>
          <div className="agent-dashboard-card-actions-list">
            <Link to="/agent/requests" className="agent-dashboard-action-link agent-dashboard-action-secondary">
              <Inbox size={20} />
              View business requests
            </Link>
            <Link to="/agent/activate" className="agent-dashboard-action-link agent-dashboard-action-primary">
              <Building2 size={20} />
              Activate Business
            </Link>
            <Link to="/agent/commissions" className="agent-dashboard-action-link agent-dashboard-action-ghost">
              <TrendingUp size={20} />
              View Commissions
            </Link>
            <Link to="/agent/withdrawals" className="agent-dashboard-action-link agent-dashboard-action-ghost">
              <Wallet size={20} />
              Request Withdrawal
            </Link>
          </div>
          <div className="agent-dashboard-card-footer">
            <div className="agent-stat-value">{dashboard?.totalBusinessesActivated ?? 0} businesses</div>
            <div className="agent-stat-label">Under your management</div>
            {agentProfile?.agentCode && (
              <div className="agent-dashboard-agent-code" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="agent-stat-label">Your agent code (share with users)</div>
                <div className="agent-stat-value" style={{ fontSize: '1.125rem', letterSpacing: '0.05em' }}>{agentProfile.agentCode}</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity card */}
        <div className="agent-dashboard-card agent-dashboard-card-activity">
          <h2 className="agent-dashboard-card-heading">Recent Activity</h2>
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
      </div>

      {/* Available Packages – full-width card with inner package cards */}
      {packages.length > 0 && (
        <div className="agent-dashboard-card agent-dashboard-card-packages">
          <h2 className="agent-dashboard-card-heading">
            <Package size={20} />
            Available Packages
          </h2>
          <p className="agent-dashboard-card-desc">
            {dashboard?.packageName ? 'Upgrade your package to activate more businesses' : 'Purchase a package to start activating businesses'}
          </p>

          {packageError && (
            <div className="agent-dashboard-card-alert agent-dashboard-card-alert-error">
              {packageError}
            </div>
          )}

          {packageSuccess && (
            <div className="agent-dashboard-card-alert agent-dashboard-card-alert-success">
              {packageSuccess}
            </div>
          )}

          <div className="agent-dashboard-package-cards">
            {packages.map((pkg) => {
              const isCurrentPackage = dashboard?.packageId === pkg.id;
              const isPurchasing = purchasingId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={`agent-dashboard-package-card ${isCurrentPackage ? 'agent-dashboard-package-card-current' : ''}`}
                >
                  {pkg.isPopular && <span className="agent-dashboard-package-badge agent-dashboard-package-badge-popular">Popular</span>}
                  {isCurrentPackage && (
                    <span className="agent-dashboard-package-badge agent-dashboard-package-badge-current">
                      <CheckCircle size={12} />
                      Current
                    </span>
                  )}
                  <h3 className="agent-dashboard-package-card-title">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="agent-dashboard-package-card-desc">{pkg.description}</p>
                  )}
                  <div className="agent-dashboard-package-card-price">
                    <span className="agent-dashboard-package-card-amount">TZS {formatAmount(pkg.price)}</span>
                    <span className="agent-stat-label">Up to {pkg.numberOfBusinesses} businesses</span>
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
        <div className="agent-dashboard-card agent-dashboard-card-error">
          <p className="agent-dashboard-card-error-text">
            <AlertTriangle size={18} />
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

    </div>
  );
}
