import { api } from './client';

function unwrap(res) {
  const data = res?.data;
  if (data?.data !== undefined) return data.data;
  return data;
}

/** GET /api/v1/live/config – STUN/TURN, RTC base URL */
export async function getLiveConfig() {
  const { data } = await api.get('/live/config');
  return unwrap({ data }) ?? data;
}

/** GET /api/v1/live/active?limit=20 – list of active live streams */
export async function getActiveLives(limit = 20) {
  const { data } = await api.get('/live/active', { params: { limit } });
  const out = unwrap({ data });
  return Array.isArray(out) ? out : [];
}

/** GET /api/v1/live/:id – single live stream details */
export async function getLiveById(liveId) {
  const { data } = await api.get(`/live/${liveId}`);
  return unwrap({ data }) ?? data;
}

/** POST /api/v1/live/start – start live (auth) */
export async function startLive({ title, description } = {}) {
  const { data } = await api.post('/live/start', { title: title ?? 'Live', description: description ?? '' });
  return unwrap({ data }) ?? data;
}

/** POST /api/v1/live/:id/end – end live (host) */
export async function endLive(liveId) {
  const { data } = await api.post(`/live/${liveId}/end`);
  return unwrap({ data }) ?? data;
}

/** POST /api/v1/live/:id/join – join as viewer (increment viewer count) */
export async function joinLive(liveId) {
  const { data } = await api.post(`/live/${liveId}/join`);
  return unwrap({ data }) ?? data;
}

/** POST /api/v1/live/:id/leave – leave stream */
export async function leaveLive(liveId) {
  await api.post(`/live/${liveId}/leave`);
}

/** POST /api/v1/live/:id/like – like stream */
export async function likeLive(liveId) {
  await api.post(`/live/${liveId}/like`);
}

/** POST /api/v1/live/:id/join-request – request to join as guest */
export async function requestToJoinLive(liveId) {
  const { data } = await api.post(`/live/${liveId}/join-request`);
  return unwrap({ data }) ?? data;
}

/** GET /api/v1/live/:id/join-requests?pendingOnly=true – list join requests (host) */
export async function getJoinRequests(liveId, pendingOnly = true) {
  const { data } = await api.get(`/live/${liveId}/join-requests`, {
    params: { pendingOnly },
  });
  const out = unwrap({ data });
  return Array.isArray(out) ? out : [];
}

/** POST /api/v1/live/join-requests/:requestId/accept – accept join request (host) */
export async function acceptJoinRequest(requestId) {
  const { data } = await api.post(`/live/join-requests/${requestId}/accept`);
  return unwrap({ data }) ?? data;
}

/** POST /api/v1/live/join-requests/:requestId/reject – reject join request (host) */
export async function rejectJoinRequest(requestId) {
  const { data } = await api.post(`/live/join-requests/${requestId}/reject`);
  return unwrap({ data }) ?? data;
}

/** GET /api/v1/live/my-streams – current user's live stream history (auth) */
export async function getMyStreams(page = 0, size = 20) {
  const { data } = await api.get('/live/my-streams', { params: { page, size } });
  const out = unwrap({ data });
  return {
    content: Array.isArray(out?.content) ? out.content : [],
    totalElements: out?.totalElements ?? 0,
    totalPages: out?.totalPages ?? 1,
  };
}
