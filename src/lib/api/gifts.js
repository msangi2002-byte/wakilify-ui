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
