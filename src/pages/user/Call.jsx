/**
 * Voice/Video call using SRS (WHIP/WHEP).
 * Connects directly to SRS (streaming.wakilfy.com) to avoid proxy 502. Base URL from GET /api/v1/live/config → rtcApiBaseUrl.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api/client';
import { endCall } from '@/lib/api/calls';
import '@/styles/user-app.css';

const APP = 'live';
const DEFAULT_RTC_BASE = 'https://streaming.wakilfy.com/rtc/v1';

/** Get SRS base URL for WHIP/WHEP (direct, no proxy). */
async function getRtcBaseUrl() {
  try {
    const { data } = await api.get('/live/config');
    const base = data?.data?.rtcApiBaseUrl ?? data?.rtcApiBaseUrl;
    if (base && typeof base === 'string') return base.replace(/\/$/, '');
  } catch (_) {}
  return DEFAULT_RTC_BASE;
}

async function whipPublish(rtcBaseUrl, streamKey, sdpOffer) {
  const url = `${rtcBaseUrl}/whip/?app=${APP}&stream=${encodeURIComponent(streamKey)}`;
  const { data } = await axios.post(url, sdpOffer, {
    headers: { 'Content-Type': 'application/sdp' },
    responseType: 'text',
  });
  return data;
}

const WHEP_RETRIES = 25;
const WHEP_RETRY_DELAY_MS = 2000;
const WHEP_DELAY_AFTER_WHIP_MS = 2000; // SRS: don't WHEP until publisher has 201
const CALLEE_START_DELAY_MS = 2500; // Callee: wait before starting so Caller's WHIP (201) is ready

async function whepPlay(rtcBaseUrl, streamKey, sdpOffer, onRetry) {
  await new Promise((r) => setTimeout(r, WHEP_DELAY_AFTER_WHIP_MS));
  let lastErr;
  for (let i = 0; i < WHEP_RETRIES; i++) {
    try {
      const url = `${rtcBaseUrl}/whep/?app=${APP}&stream=${encodeURIComponent(streamKey)}`;
      const { data } = await axios.post(url, sdpOffer, {
        headers: { 'Content-Type': 'application/sdp' },
        responseType: 'text',
      });
      return data;
    } catch (e) {
      lastErr = e;
      const status = e.response?.status;
      const isRetryable = status === 502 || status === 404 || status === 503;
      if (!isRetryable || i === WHEP_RETRIES - 1) {
        if (isRetryable && i > 0) {
          throw new Error('Other person did not join in time. Share the call link and ask them to open it.');
        }
        throw e;
      }
      onRetry?.(i + 1, WHEP_RETRIES);
      await new Promise((r) => setTimeout(r, WHEP_RETRY_DELAY_MS));
    }
  }
  throw lastErr;
}

export default function Call() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room') || '';
  const callId = searchParams.get('callId') || '';
  const callType = (searchParams.get('type') || 'VIDEO').toUpperCase();
  const role = searchParams.get('role') || 'caller';
  const isVideo = callType === 'VIDEO';

  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(isVideo);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const publishPcRef = useRef(null);
  const playPcRef = useRef(null);
  const localStreamRef = useRef(null);
  const endedRef = useRef(false);

  const handleEndCall = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    publishPcRef.current?.close();
    playPcRef.current?.close();
    if (callId && role === 'caller') {
      endCall(callId).catch(() => {});
    }
    navigate('/app/messages');
  }, [callId, role, navigate]);

  useEffect(() => {
    if (!roomId) {
      setError('No room ID');
      setStatus('error');
      return;
    }

    const myStream = `${roomId}_${role}`;
    const peerStream = `${roomId}_${role === 'caller' ? 'callee' : 'caller'}`;

    let cancelled = false;

    const run = async () => {
      try {
        const rtcBaseUrl = await getRtcBaseUrl();
        if (cancelled) return;

        if (role === 'callee') {
          await new Promise((r) => setTimeout(r, CALLEE_START_DELAY_MS));
          if (cancelled) return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideo,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        setStatus('publishing');

        const publishPc = new RTCPeerConnection({});
        publishPcRef.current = publishPc;
        stream.getTracks().forEach((t) => publishPc.addTrack(t, stream));

        const offer = await publishPc.createOffer();
        await publishPc.setLocalDescription(offer);
        const sdpOffer = publishPc.localDescription.sdp;
        const sdpAnswer = await whipPublish(rtcBaseUrl, myStream, sdpOffer);
        if (cancelled) return;
        await publishPc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sdpAnswer }));

        setStatus(role === 'caller' ? 'ringing' : 'playing');

        const playPc = new RTCPeerConnection({});
        playPcRef.current = playPc;
        playPc.ontrack = (e) => {
          if (!cancelled && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
            setStatus('connected');
          }
        };

        // SRS requires full SDP with BUNDLE and media. Without recvonly transceivers we get tiny SDP and "now only support BUNDLE".
        // Voice call: only audio (1 m-line). Video call: audio + video (2 m-lines). Offer/answer m-line count must match.
        playPc.addTransceiver('audio', { direction: 'recvonly' });
        if (isVideo) playPc.addTransceiver('video', { direction: 'recvonly' });

        const playOffer = await playPc.createOffer();
        await playPc.setLocalDescription(playOffer);
        const playSdpAnswer = await whepPlay(
          rtcBaseUrl,
          peerStream,
          playPc.localDescription.sdp,
          () => {
            if (!cancelled) setStatus('waiting');
          }
        );
        if (cancelled) return;
        await playPc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: playSdpAnswer }));

        setStatus('connected');
      } catch (e) {
        if (!cancelled) {
          const msg = typeof e.response?.data === 'string'
            ? e.response.data
            : (e.response?.data?.message || e.message || 'Failed to connect');
          setError(msg);
          setStatus('error');
          if (callId && role === 'caller') {
            endCall(callId).catch(() => {});
          }
        }
      }
    };

    run();
    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      publishPcRef.current?.close();
      playPcRef.current?.close();
    };
  }, [roomId, role, isVideo]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = videoEnabled; });
  }, [videoEnabled]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = audioEnabled; });
  }, [audioEnabled]);

  if (error) {
    return (
      <div className="call-page call-page-error">
        <p>{error}</p>
        <p className="call-error-hint">Check your connection and try again. If it keeps failing, share the call link with the other person.</p>
        <button type="button" className="call-btn-end" onClick={handleEndCall}>
          <PhoneOff size={24} />
          End
        </button>
      </div>
    );
  }

  return (
    <div className="call-page">
      <div className="call-videos">
        <div className="call-remote-wrap">
          <video ref={remoteVideoRef} autoPlay playsInline className="call-video call-remote" />
          {status !== 'connected' && (
            <div className="call-status-overlay">
              {(status === 'connecting' || status === 'publishing' || status === 'playing') && 'Connecting…'}
              {status === 'ringing' && 'Ringing…'}
              {status === 'waiting' && (role === 'caller' ? 'Ringing…' : 'Connecting…')}
              {status === 'disconnected' && 'Call ended'}
            </div>
          )}
        </div>
        <div className="call-local-wrap">
          <video ref={localVideoRef} autoPlay playsInline muted className="call-video call-local" />
        </div>
      </div>
      <div className="call-controls">
        <button
          type="button"
          className={`call-control-btn ${!audioEnabled ? 'off' : ''}`}
          onClick={() => setAudioEnabled((v) => !v)}
          title={audioEnabled ? 'Mute' : 'Unmute'}
        >
          {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        <button type="button" className="call-btn-end" onClick={handleEndCall} title="End call">
          <PhoneOff size={24} />
        </button>
        <button
          type="button"
          className={`call-control-btn ${!videoEnabled ? 'off' : ''}`}
          onClick={() => setVideoEnabled((v) => !v)}
          title={videoEnabled ? 'Turn off video' : 'Turn on video'}
        >
          {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
      </div>
    </div>
  );
}
