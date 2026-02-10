import { api } from './client';

/**
 * Initiate voice or video call
 * POST /api/v1/calls/initiate
 * Body: { receiverId, type: "VOICE" | "VIDEO" }
 */
export async function initiateCall(receiverId, type = 'VIDEO') {
  const { data } = await api.post('/calls/initiate', { receiverId, type });
  return data?.data ?? data;
}

/**
 * Answer a call
 * POST /api/v1/calls/:callId/answer
 */
export async function answerCall(callId) {
  const { data } = await api.post(`/calls/${callId}/answer`);
  return data?.data ?? data;
}

/**
 * Reject a call
 * POST /api/v1/calls/:callId/reject
 */
export async function rejectCall(callId) {
  const { data } = await api.post(`/calls/${callId}/reject`);
  return data?.data ?? data;
}

/**
 * End a call
 * POST /api/v1/calls/:callId/end
 */
export async function endCall(callId) {
  const { data } = await api.post(`/calls/${callId}/end`);
  return data?.data ?? data;
}

/**
 * Get call history
 * GET /api/v1/calls/history?page=0&size=20
 */
export async function getCallHistory(params = {}) {
  const { data } = await api.get('/calls/history', {
    params: { page: 0, size: 20, ...params },
  });
  return data?.data ?? data;
}
