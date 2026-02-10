/**
 * Voice/Video call using SRS (WHIP/WHEP).
 * Uses API proxy to avoid CORS (browser cannot fetch streaming.wakilfy.com directly).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { api } from '@/lib/api/client';
import { endCall } from '@/lib/api/calls';
import '@/styles/user-app.css';

const APP = 'live';

async function whipPublish(streamKey, sdpOffer) {
  const { data } = await api.post(
    `/streaming/whip?app=${APP}&stream=${encodeURIComponent(streamKey)}`,
    sdpOffer,
    { headers: { 'Content-Type': 'application/sdp' }, responseType: 'text' }
  );
  return data;
}

const WHEP_RETRIES = 15;
const WHEP_RETRY_DELAY_MS = 2000;

async function whepPlay(streamKey, sdpOffer, onRetry) {
  let lastErr;
  for (let i = 0; i < WHEP_RETRIES; i++) {
    try {
      const { data } = await api.post(
        `/streaming/whep?app=${APP}&stream=${encodeURIComponent(streamKey)}`,
        sdpOffer,
        { headers: { 'Content-Type': 'application/sdp' }, responseType: 'text' }
      );
      return data;
    } catch (e) {
      lastErr = e;
      const is502 = e.response?.status === 502;
      if (!is502 || i === WHEP_RETRIES - 1) {
        if (is502 && i > 0) {
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
  const [waitingAttempt, setWaitingAttempt] = useState(0);
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
        const sdpAnswer = await whipPublish(myStream, sdpOffer);
        if (cancelled) return;
        await publishPc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: sdpAnswer }));

        setStatus('playing');

        const playPc = new RTCPeerConnection({});
        playPcRef.current = playPc;
        playPc.ontrack = (e) => {
          if (!cancelled && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
            setStatus('connected');
          }
        };

        const playOffer = await playPc.createOffer();
        await playPc.setLocalDescription(playOffer);
        const playSdpAnswer = await whepPlay(
          peerStream,
          playPc.localDescription.sdp,
          (attempt, total) => {
            if (!cancelled) {
              setWaitingAttempt(attempt);
              setStatus('waiting');
            }
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
        <p className="call-error-hint">Proxy via API. Ensure you are logged in and backend can reach SRS.</p>
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
              {status === 'connecting' && 'Connecting…'}
              {status === 'publishing' && 'Publishing…'}
              {status === 'playing' && 'Connecting…'}
              {status === 'waiting' && `Waiting for other person… (${waitingAttempt}/${WHEP_RETRIES})`}
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
