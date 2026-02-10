/**
 * Voice/Video call using SRS (WHIP/WHEP).
 * Connects directly to SRS (streaming.wakilfy.com) to avoid proxy 502. Base URL from GET /api/v1/live/config → rtcApiBaseUrl.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PhoneOff, Video, VideoOff, Mic, MicOff, User, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api/client';
import { endCall } from '@/lib/api/calls';
import { getUser, getMe } from '@/lib/api/users';
import '@/styles/user-app.css';

/** Profile avatar for call (when video is off) – WhatsApp style */
function CallProfileAvatar({ user, size = 120, className = '' }) {
  const src = user?.profilePic ?? user?.avatar;
  const name = user?.name ?? user?.username ?? '';
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div
      className={`call-profile-avatar ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #374151, #1f2937)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.4,
      }}
    >
      {src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initial || <User size={size * 0.5} strokeWidth={1.5} />
      )}
    </div>
  );
}

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
  const peerUserId = searchParams.get('peerUserId') || '';

  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(isVideo);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [peerUser, setPeerUser] = useState(null);
  const [meUser, setMeUser] = useState(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [hasLocalVideoTrack, setHasLocalVideoTrack] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = back
  const [switchingCamera, setSwitchingCamera] = useState(false);

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
          video: isVideo ? { facingMode: 'user' } : false,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setHasLocalVideoTrack(stream.getVideoTracks().length > 0);

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
            const stream = e.streams[0];
            remoteVideoRef.current.srcObject = stream;
            setStatus('connected');
            const videoTracks = stream.getVideoTracks();
            const hasVideo = videoTracks.some((t) => t.enabled);
            setHasRemoteVideo(hasVideo);
            videoTracks.forEach((t) => {
              t.addEventListener('unmute', () => setHasRemoteVideo(true));
              t.addEventListener('mute', () => setHasRemoteVideo(false));
            });
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

  const switchCamera = useCallback(async () => {
    if (!isVideo || !localStreamRef.current || !publishPcRef.current || switchingCamera) return;
    const pc = publishPcRef.current;
    const senders = pc.getSenders();
    const videoSender = senders.find((s) => s.track?.kind === 'video');
    if (!videoSender) return;
    setSwitchingCamera(true);
    try {
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });
      const newVideoTrack = stream.getVideoTracks()[0];
      if (!newVideoTrack) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      localStreamRef.current.addTrack(newVideoTrack);
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      await videoSender.replaceTrack(newVideoTrack);
      setFacingMode(nextFacing);
      setHasLocalVideoTrack(true);
      stream.getTracks().filter((t) => t !== newVideoTrack).forEach((t) => t.stop());
    } catch (_) {}
    finally {
      setSwitchingCamera(false);
    }
  }, [isVideo, facingMode, switchingCamera]);

  // Fetch peer and me for profile avatars (WhatsApp-style when video off)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [peer, me] = await Promise.all([
          peerUserId ? getUser(peerUserId) : Promise.resolve(null),
          getMe(),
        ]);
        if (!cancelled) {
          if (peer) setPeerUser(peer);
          if (me) setMeUser(me);
        }
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [peerUserId]);

  const showLocalVideo = videoEnabled && hasLocalVideoTrack;
  const showRemoteVideo = hasRemoteVideo;

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
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="call-video call-remote"
            style={{ visibility: showRemoteVideo ? 'visible' : 'hidden' }}
          />
          {!showRemoteVideo && (
            <div className="call-remote-profile">
              <CallProfileAvatar user={peerUser} size={160} />
              {peerUser?.name && <span className="call-remote-name">{peerUser.name}</span>}
            </div>
          )}
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
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="call-video call-local"
            style={{ visibility: showLocalVideo ? 'visible' : 'hidden' }}
          />
          {!showLocalVideo && (
            <div className="call-local-profile">
              <CallProfileAvatar user={meUser} size={80} />
            </div>
          )}
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
        {isVideo && videoEnabled && (
          <button
            type="button"
            className="call-control-btn"
            onClick={switchCamera}
            disabled={switchingCamera}
            title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
          >
            <RefreshCw size={24} className={switchingCamera ? 'call-switch-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}
