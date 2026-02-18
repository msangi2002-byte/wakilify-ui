import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
  getMyPostsForBoost,
  calculateAdPrice,
  boostPost,
  checkPaymentStatus,
  getBoostAnalytics,
} from '@/lib/api/ads';
import { getApiErrorMessage } from '@/lib/utils/apiError';

const SWAHILI_ERRORS = {
  'phone number': 'Namba ya simu si sahihi',
  'phone': 'Namba ya simu',
  'invalid': 'Thamani si sahihi',
  'required': 'Inahitajika',
  'not found': 'Hakutumiki',
  'unauthorized': 'Ingia ndani kwanza',
  'forbidden': 'Huna ruhusa',
  'network': 'Check mtandao wako',
  'timeout': 'Muda umekwisha. Jaribu tena.',
};
function toSwahiliError(msg) {
  if (!msg || typeof msg !== 'string') return msg;
  const lower = msg.toLowerCase();
  for (const [en, sw] of Object.entries(SWAHILI_ERRORS)) {
    if (lower.includes(en)) return sw;
  }
  return msg;
}
import { TrendingUp, ThumbsUp, MessageCircle, MousePointerClick, Users, MapPin, Zap } from 'lucide-react';

const OBJECTIVES = [
  { id: 'ENGAGEMENT', label: 'Engagement', desc: 'Likes, comments, shares', icon: ThumbsUp },
  { id: 'MESSAGES', label: 'Messages', desc: 'Drive DM conversations', icon: MessageCircle },
  { id: 'TRAFFIC', label: 'Website visits', desc: 'Link clicks, app opens', icon: MousePointerClick },
];

const AUDIENCE_TYPES = [
  { id: 'AUTOMATIC', label: 'Automatic', desc: 'Followers + similar profiles (recommended)', icon: Zap },
  { id: 'LOCAL', label: 'Local', desc: 'Location + age + interest targeting', icon: MapPin },
];

const REGIONS = ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Moshi', 'Other'];

export default function Boost() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [objective, setObjective] = useState('ENGAGEMENT');
  const [audienceType, setAudienceType] = useState('AUTOMATIC');
  const [targetRegions, setTargetRegions] = useState([]);
  const [targetAgeMin, setTargetAgeMin] = useState(18);
  const [targetAgeMax, setTargetAgeMax] = useState(65);
  const [targetGender, setTargetGender] = useState('ALL');
  const [targetReach, setTargetReach] = useState(1000);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || '');
  const [boosting, setBoosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      getMyPostsForBoost()
        .then((data) => {
          const list = data?.content ?? data ?? [];
          setPosts(list);
          if (list.length > 0 && !selectedPostId) setSelectedPostId(list[0].id);
        })
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  useEffect(() => {
    if (targetReach > 0) {
      setPriceLoading(true);
      calculateAdPrice(targetReach)
        .then(setCalculatedPrice)
        .catch(() => setCalculatedPrice(null))
        .finally(() => setPriceLoading(false));
    } else {
      setCalculatedPrice(null);
    }
  }, [targetReach]);

  useEffect(() => {
    if (user?.id) {
      setAnalyticsLoading(true);
      getBoostAnalytics()
        .then(setAnalytics)
        .catch(() => setAnalytics(null))
        .finally(() => setAnalyticsLoading(false));
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.phone) setPaymentPhone(user.phone);
  }, [user?.phone]);

  const handleRegionToggle = (r) => {
    setTargetRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleBoost = async () => {
    if (!selectedPostId) {
      setError('Chagua post');
      return;
    }
    if (!paymentPhone?.trim()) {
      setError('Namba ya simu ya malipo inahitajika');
      return;
    }
    if (targetReach < 100) {
      setError('Target reach lazima angalau 100');
      return;
    }
    setBoosting(true);
    setError('');
    setSuccess('');
    try {
      const options = {
        objective,
        audienceType,
        ...(audienceType === 'LOCAL' && {
          targetRegions: targetRegions.length ? targetRegions : null,
          targetAgeMin,
          targetAgeMax,
          targetGender: targetGender !== 'ALL' ? targetGender : null,
        }),
      };
      const result = await boostPost(selectedPostId, targetReach, paymentPhone.trim(), options);
      setSuccess(result?.message || 'USSD push imetumwa. Fuata maelekezo kukamilisha malipo.');

      const interval = setInterval(async () => {
        try {
          const status = await checkPaymentStatus(result.orderId);
          if (status?.status === 'SUCCESS') {
            clearInterval(interval);
            setSuccess('Malipo yametumwa! Tangazo lako linaanza kuonyeshwa.');
            setSelectedPostId(posts[0]?.id || '');
            setTargetReach(1000);
            getBoostAnalytics().then(setAnalytics).catch(() => {});
          } else if (status?.status === 'FAILED' || status?.status === 'CANCELLED') {
            clearInterval(interval);
            setError('Malipo yameshindwa au yameghairiwa.');
          }
        } catch (_) {}
      }, 3000);
      setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
    } catch (err) {
      const raw = getApiErrorMessage(err, 'Shida wakati wa kutangaza');
      setError(toSwahiliError(raw) || raw);
    } finally {
      setBoosting(false);
    }
  };

  return (
    <div className="user-app">
      <div className="user-app-body" style={{ gridTemplateColumns: '1fr minmax(0, 720px) 1fr' }}>
        <div className="user-app-sidebar" aria-hidden="true" />
        <main className="user-app-main boost-page">
          <div className="user-app-card boost-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="boost-icon-wrap">
                <TrendingUp size={32} />
              </div>
              <div>
                <h1 className="boost-title">Boost Post</h1>
                <p className="boost-subtitle">
                  Tangaza post yako kwa watu zaidi. Chagua objective, audience, na budget. System inaoptimize delivery kwa engagement bora.
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Select Post */}
          <section className="user-app-card boost-section">
            <h2 className="boost-section-title">1. Chagua Post</h2>
            {loading ? (
              <p className="boost-muted">Inapakia posts...</p>
            ) : posts.length === 0 ? (
              <p className="boost-muted">Huna posts bado. Tengeneza post kwanza.</p>
            ) : (
              <select
                className="boost-select"
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                aria-label="Chagua post"
              >
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.caption ? (p.caption.length > 60 ? p.caption.substring(0, 60) + '...' : p.caption) : 'Post ' + p.id?.slice(0, 8)}
                  </option>
                ))}
              </select>
            )}
          </section>

          {/* Step 2: Objective */}
          <section className="user-app-card boost-section">
            <h2 className="boost-section-title">2. Objective (System inaoptimize kwa hii)</h2>
            <div className="boost-options">
              {OBJECTIVES.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`boost-option ${objective === o.id ? 'active' : ''}`}
                  onClick={() => setObjective(o.id)}
                >
                  <o.icon size={20} />
                  <div className="boost-option-text">
                    <span className="boost-option-label">{o.label}</span>
                    <span className="boost-option-desc">{o.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Step 3: Audience */}
          <section className="user-app-card boost-section">
            <h2 className="boost-section-title">3. Audience</h2>
            <div className="boost-options">
              {AUDIENCE_TYPES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`boost-option boost-option-wide ${audienceType === a.id ? 'active' : ''}`}
                  onClick={() => setAudienceType(a.id)}
                >
                  <a.icon size={20} />
                  <div className="boost-option-text">
                    <span className="boost-option-label">{a.label}</span>
                    <span className="boost-option-desc">{a.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {audienceType === 'LOCAL' && (
              <div className="boost-local-extra">
                <p className="boost-muted" style={{ marginBottom: 12 }}>Mikoa (chagua moja au zaidi)</p>
                <div className="boost-regions">
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`boost-region-btn ${targetRegions.includes(r) ? 'active' : ''}`}
                      onClick={() => handleRegionToggle(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="boost-row" style={{ marginTop: 16, gap: 24 }}>
                  <div>
                    <label className="boost-label">Umri kutoka</label>
                    <input
                      type="number"
                      min={13}
                      max={100}
                      value={targetAgeMin}
                      onChange={(e) => setTargetAgeMin(Number(e.target.value))}
                      className="boost-input"
                    />
                  </div>
                  <div>
                    <label className="boost-label">Umri hadi</label>
                    <input
                      type="number"
                      min={13}
                      max={100}
                      value={targetAgeMax}
                      onChange={(e) => setTargetAgeMax(Number(e.target.value))}
                      className="boost-input"
                    />
                  </div>
                  <div>
                    <label className="boost-label">Jinsia</label>
                    <select
                      className="boost-select"
                      value={targetGender}
                      onChange={(e) => setTargetGender(e.target.value)}
                      style={{ minWidth: 120 }}
                    >
                      <option value="ALL">Zote</option>
                      <option value="MALE">Wanaume</option>
                      <option value="FEMALE">Wanawake</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Step 4: Budget */}
          <section className="user-app-card boost-section">
            <h2 className="boost-section-title">4. Budget – Watu wangapi uwatimize?</h2>
            <div style={{ marginBottom: 12 }}>
              <input
                type="range"
                min={100}
                max={100000}
                step={100}
                value={targetReach}
                onChange={(e) => setTargetReach(Number(e.target.value))}
                className="boost-slider"
                aria-label="Target reach"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span>100</span>
                <span style={{ fontWeight: 600 }}>{targetReach.toLocaleString()} watu</span>
                <span>100,000</span>
              </div>
            </div>
            {priceLoading ? (
              <p className="boost-muted">Inahesabu bei...</p>
            ) : calculatedPrice && (
              <div className="boost-price">
                <span className="boost-price-value">TZS {calculatedPrice.totalPrice?.toLocaleString() || '0'}</span>
                <span className="boost-price-per">TZS {calculatedPrice.pricePerPerson || '2'} per person</span>
              </div>
            )}
          </section>

          {/* Step 5: Payment */}
          <section className="user-app-card boost-section">
            <h2 className="boost-section-title">5. Malipo (USSD)</h2>
            <input
              type="tel"
              className="boost-input"
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              placeholder="+255712345678"
              aria-label="Namba ya simu"
              style={{ maxWidth: 280 }}
            />
            {error && <p className="boost-error" role="alert">{error}</p>}
            {success && <p className="boost-success" role="status">{success}</p>}
            <button
              type="button"
              className="boost-submit"
              onClick={handleBoost}
              disabled={boosting || !selectedPostId || !paymentPhone?.trim() || !calculatedPrice}
            >
              {boosting ? 'Inaendesha...' : 'Boost Post'}
            </button>
          </section>

          {/* Analytics */}
          {analytics && (
            <section className="user-app-card boost-section">
              <h2 className="boost-section-title">
                <Users size={20} /> Tangazo Analytics
              </h2>
              {analyticsLoading ? (
                <p className="boost-muted">Inapakia...</p>
              ) : (
                <>
                  <div className="boost-analytics">
                    <div className="boost-stat">
                      <span className="boost-stat-value">{analytics.totalImpressions?.toLocaleString() ?? 0}</span>
                      <span className="boost-stat-label">Impressions</span>
                    </div>
                    <div className="boost-stat">
                      <span className="boost-stat-value">{analytics.totalClicks?.toLocaleString() ?? 0}</span>
                      <span className="boost-stat-label">Clicks</span>
                    </div>
                    <div className="boost-stat">
                      <span className="boost-stat-value">{analytics.overallCtr?.toFixed(2) ?? 0}%</span>
                      <span className="boost-stat-label">CTR</span>
                    </div>
                    <div className="boost-stat">
                      <span className="boost-stat-value">TZS {analytics.totalSpent?.toLocaleString() ?? 0}</span>
                      <span className="boost-stat-label">Spent</span>
                    </div>
                  </div>
                  {analytics.promotions?.length > 0 && (
                    <div className="boost-learning-section">
                      <h4 className="boost-section-subtitle">Kampeni zako</h4>
                      {analytics.promotions.map((promo) => (
                        <div key={promo.id} className="boost-promo-card">
                          <div className="boost-promo-title">{promo.title || 'Boost'}</div>
                          <div className="boost-promo-meta">
                            <span className={`boost-status-${promo.status?.toLowerCase()}`}>{promo.status}</span>
                            {promo.isInLearningPhase && (
                              <span className="boost-learning-badge">
                                <Zap size={14} /> Learning: {promo.learningPhaseConversions ?? 0}/50
                              </span>
                            )}
                          </div>
                          <p className="boost-learning-desc">
                            {promo.isInLearningPhase
                              ? 'System inajifunza watu bora wa kuonyeshea. Baada ya conversions 50, optimization itaboreshwa.'
                              : 'Optimization iko juu.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </main>
        <div className="user-app-sidebar" aria-hidden="true" />
      </div>
    </div>
  );
}
