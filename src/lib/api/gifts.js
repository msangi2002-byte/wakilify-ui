import { api } from './client';

function unwrap(res) {
  const data = res?.data;
  if (data?.data !== undefined) return data.data;
  return data;
}

/** GET /api/v1/gifts – available virtual gifts */
export async function getGifts() {
  const { data } = await api.get('/gifts');
  const out = unwrap({ data });
  return Array.isArray(out) ? out : [];
}

/** POST /api/v1/gifts/send – send gift (receiverId, giftId, quantity, message?, liveStreamId?) */
export async function sendGift({ receiverId, giftId, liveStreamId = null, quantity = 1, message = '' }) {
  const body = { receiverId, giftId, quantity };
  if (message) body.message = message;
  if (liveStreamId) body.liveStreamId = liveStreamId;
  await api.post('/gifts/send', body);
}

/** GET /api/v1/wallet – current user wallet (coins, etc.) */
export async function getWallet() {
  const { data } = await api.get('/wallet');
  return unwrap({ data }) ?? data;
}

/** GET /api/v1/coins/packages – coin packages for purchase */
export async function getCoinPackages() {
  const { data } = await api.get('/coins/packages');
  const out = unwrap({ data });
  return Array.isArray(out) ? out : [];
}

/** GET /api/v1/gifts/live/:liveStreamId – gifts sent during a live stream */
export async function getGiftsForLive(liveStreamId) {
  const { data } = await api.get(`/gifts/live/${liveStreamId}`);
  const out = unwrap({ data });
  return Array.isArray(out) ? out : [];
}

/** POST /api/v1/wallet/withdraw – request cash withdrawal (host); body: { amount, phone } */
export async function requestWithdraw({ amount, phone }) {
  const { data } = await api.post('/wallet/withdraw', { amount: Number(amount), phone: String(phone || '').trim() });
  return unwrap({ data }) ?? data;
}

/** GET /api/v1/wallet/withdrawals – my withdrawal history */
export async function getMyWithdrawals(params = {}) {
  const { data } = await api.get('/wallet/withdrawals', {
    params: { page: 0, size: 20, ...params },
  });
  return unwrap({ data }) ?? data;
}
