/**
 * WHIP (WebRTC HTTP Ingestion Protocol) – publish camera/mic to SRS.
 * POST SDP offer to https://streaming.wakilfy.com/rtc/v1/whip/?app=live&stream={streamKey}
 */

/**
 * Build ICE servers array for RTCPeerConnection from API config.
 * @param {Object} ice - { stunUrl, turnUrl, turnUsername, turnPassword }
 * @returns {Array<RTCIceServer>}
 */
export function buildIceServers(ice) {
  const servers = [];
  if (ice?.stunUrl) servers.push({ urls: ice.stunUrl });
  if (ice?.turnUrl && ice?.turnUsername && ice?.turnPassword) {
    servers.push({
      urls: ice.turnUrl,
      username: ice.turnUsername,
      credential: ice.turnPassword,
    });
  }
  if (servers.length === 0) servers.push({ urls: 'stun:stun.l.google.com:19302' });
  return servers;
}

/**
 * Start publishing local media to SRS via WHIP.
 * @param {string} streamKey - Stream key (from live.rtmpUrl or backend).
 * @param {string} rtcApiBaseUrl - e.g. https://streaming.wakilfy.com/rtc/v1
 * @param {Object} iceServersConfig - { stunUrl, turnUrl, turnUsername, turnPassword }
 * @returns {Promise<{ pc: RTCPeerConnection, stream: MediaStream }>}
 */
export async function startWhipPublish(streamKey, rtcApiBaseUrl, iceServersConfig) {
  if (!streamKey || !rtcApiBaseUrl) throw new Error('Missing streamKey or rtcApiBaseUrl');

  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const iceServers = buildIceServers(iceServersConfig || {});

  const pc = new RTCPeerConnection({
    iceServers,
    bundlePolicy: 'max-bundle',
  });

  stream.getTracks().forEach((track) => pc.addTrack(track, stream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const base = rtcApiBaseUrl.replace(/\/$/, '');
  const whipUrl = `${base}/whip/?app=live&stream=${encodeURIComponent(streamKey)}`;

  const response = await fetch(whipUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: offer.sdp,
  });

  if (!response.ok) {
    pc.close();
    stream.getTracks().forEach((t) => t.stop());
    const text = await response.text();
    throw new Error(`WHIP failed: ${response.status} ${response.statusText}. ${text || ''}`);
  }

  const answerSdp = await response.text();
  await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));

  return { pc, stream };
}
