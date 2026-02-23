import { api } from './client';
import { getToken } from '@/store/auth.store';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

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

/** GET /api/v1/live/active?limit=20&category=gaming – list of active live streams (category: all, just_chatting, gaming, music, irl) */
export async function getActiveLives(limit = 20, category = null) {
  const params = { limit };
  if (category && category !== 'all') params.category = category;
  const { data } = await api.get('/live/active', { params });
  const out = unwrap({ data });
  return Array.isArray(out) ? out : [];
}

/** GET /api/v1/live/:id – single live stream details */
export async function getLiveById(liveId) {
  const { data } = await api.get(`/live/${liveId}`);
  return unwrap({ data }) ?? data;
}

/** POST /api/v1/live/start – start live (auth). category: all, just_chatting, gaming, music, irl */
export async function startLive({ title, description, category } = {}) {
  const body = { title: title ?? 'Live', description: description ?? '' };
  if (category) body.category = category;
  const { data } = await api.post('/live/start', body);
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

/** GET /api/v1/live/:liveId/comments – list comments for a live stream */
export async function getLiveComments(liveId, params = {}) {
  const { data } = await api.get(`/live/${liveId}/comments`, {
    params: { page: 0, size: 50, ...params },
  });
  const out = unwrap({ data });
  return Array.isArray(out?.content) ? out.content : (Array.isArray(out) ? out : []);
}

/** POST /api/v1/live/:liveId/comments – add comment (body: { content }) */
export async function addLiveComment(liveId, content) {
  const { data } = await api.post(`/live/${liveId}/comments`, { content: (content || '').trim() });
  return unwrap({ data }) ?? data;
}

/**
 * Get my join request for this live (viewer). When accepted, includes guestStreamKey
 * so the guest can publish and appear on the same live.
 * GET /api/v1/live/:liveId/my-join-request
 */
export async function getMyJoinRequest(liveId) {
  const { data } = await api.get(`/live/${liveId}/my-join-request`);
  const out = unwrap({ data });
  return out ?? null;
}

/**
 * Subscribe to live comments via SSE (real-time). Uses fetch + auth header.
 * Returns an unsubscribe function.
 * onComment(commentResponse) for each "comment" event.
 * onConnected() when SSE connection is established (so caller can disable polling).
 * onViewerCount(count) for each "viewer_count" event (real-time viewer count).
 * onLike({ userId, userName, userProfilePic }) when someone likes – so all see like on screen.
 * onGiftSent({ senderName, gift: { id, name, iconUrl, coinValue }, quantity }) when someone sends gift.
 */
export function subscribeLiveComments(liveId, onComment, onConnected, onViewerCount, onLike, onGiftSent) {
  const token = getToken();
  if (!token || !liveId) return () => {};

  const url = `${baseURL.replace(/\/$/, '')}/live/${liveId}/comments/stream`;
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = null;
      let connectedCalled = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (currentEvent === 'connected') {
              if (!connectedCalled && onConnected) {
                connectedCalled = true;
                onConnected();
              }
            } else if (currentEvent === 'comment' && data) {
              try {
                const comment = JSON.parse(data);
                onComment(comment);
              } catch (_) {}
            } else if (currentEvent === 'viewer_count' && data) {
              const count = parseInt(data, 10);
              if (!Number.isNaN(count) && onViewerCount) onViewerCount(count);
            } else if (currentEvent === 'like' && data && onLike) {
              try {
                const payload = JSON.parse(data);
                onLike(payload);
              } catch (_) {}
            } else if (currentEvent === 'gift_sent' && data && onGiftSent) {
              try {
                const payload = JSON.parse(data);
                onGiftSent(payload);
              } catch (_) {}
            }
            currentEvent = null;
          }
          // Don't clear currentEvent on blank line – next line may be data for this event
        }
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.warn('Live comments SSE failed, use polling:', e?.message);
      }
    }
  })();

  return () => controller.abort();
}
