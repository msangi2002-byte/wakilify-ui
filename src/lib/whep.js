/**
 * WHEP (WebRTC HTTP Egress Protocol) – play live stream from SRS with low latency.
 * POST SDP offer to https://streaming.wakilfy.com/rtc/v1/whep/?app=live&stream={streamKey}
 * Sub-second latency (vs HLS 10+ seconds).
 */

/**
 * Start playing live stream via WHEP (WebRTC). Video is attached to the given element when track arrives.
 * @param {string} streamKey - Stream key (same as used for WHIP/RTMP).
 * @param {string} rtcApiBaseUrl - e.g. https://streaming.wakilfy.com/rtc/v1
 * @param {HTMLVideoElement} videoElement - Video element to attach the stream to.
 * @returns {Promise<RTCPeerConnection>} - The peer connection (for cleanup: pc.close()).
 */
export async function startWhepPlay(streamKey, rtcApiBaseUrl, videoElement) {
  if (!streamKey || !rtcApiBaseUrl) throw new Error('Missing streamKey or rtcApiBaseUrl');
  if (!videoElement) throw new Error('Missing video element');

  const pc = new RTCPeerConnection({
    bundlePolicy: 'max-bundle',
  });

  // Recv-only transceivers (SRS requires BUNDLE and proper SDP)
  pc.addTransceiver('audio', { direction: 'recvonly' });
  pc.addTransceiver('video', { direction: 'recvonly' });

  pc.ontrack = (event) => {
    if (videoElement && event.streams && event.streams[0]) {
      videoElement.srcObject = event.streams[0];
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const base = rtcApiBaseUrl.replace(/\/$/, '');
  const whepUrl = `${base}/whep/?app=live&stream=${encodeURIComponent(streamKey)}`;

  const response = await fetch(whepUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: offer.sdp,
  });

  if (!response.ok) {
    pc.close();
    const text = await response.text();
    throw new Error(`WHEP failed: ${response.status} ${response.statusText}. ${text || ''}`);
  }

  const answerSdp = await response.text();
  await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));

  return pc;
}
