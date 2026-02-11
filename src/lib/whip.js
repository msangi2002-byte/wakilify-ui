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

/** User-friendly message for getUserMedia errors (e.g. Starting videoinput failed, NotAllowedError). */
function getCameraErrorMessage(err) {
  const name = err?.name || '';
  const msg = (err?.message || '').toLowerCase();
  if (name === 'NotAllowedError' || msg.includes('permission') || msg.includes('denied')) {
    return 'Kamera imekataliwa. Ruhusu kipengele cha kamera kwenye kivinjari (icon ya kamera kwenye address bar).';
  }
  if (name === 'NotFoundError' || msg.includes('no camera') || msg.includes('not found')) {
    return 'Kamera haijapatikana. Unganisha kamera na ujaribu tena.';
  }
  if (name === 'NotReadableError' || msg.includes('videoinput') || msg.includes('starting videoinput failed') || msg.includes('in use')) {
    return 'Kamera inatumika na programu nyingine au imeshindwa kuanza. Funga Zoom, Meet, Skype au apps nyingine zinazotumia kamera, kisha jaribu tena.';
  }
  if (name === 'OverconstrainedError') {
    return 'Kamera haikubali mipangilio inayotakiwa. Jaribu kivinjari kingine au kamera nyingine.';
  }
  return err?.message || 'Imeshindwa kufungua kamera. Ruhusu kamera kwenye kivinjari na ujaribu tena.';
}

/**
 * Get user media (camera + mic) with fallback constraints to reduce "Starting videoinput failed" on some devices.
 * @returns {Promise<MediaStream>}
 */
async function getLocalMediaStream() {
  const constraintsList = [
    { video: true, audio: true },
    { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true },
    { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: true },
    { video: { facingMode: 'user' }, audio: true },
    { video: true, audio: false },
  ];
  let lastErr;
  for (const constraints of constraintsList) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(getCameraErrorMessage(lastErr));
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

  const stream = await getLocalMediaStream();
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
