/**
 * Voice/Video call using SRS (WHIP/WHEP).
 * SRS uses HTTP API, NOT WebSocket. See: https://ossrs.net/lts/en-us/docs/v5/doc/webrtc
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import '@/styles/user-app.css';

const SRS_BASE = 'https://streaming.wakilfy.com';
const APP = 'live';

async function whipPublish(baseUrl, streamKey, sdpOffer) {
  const url = `${baseUrl}/rtc/v1/whip/?app=${APP}&stream=${encodeURIComponent(streamKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: sdpOffer,
  });
  if (!res.ok) throw new Error(`WHIP failed: ${res.status}`);
  return res.text();
}

async function whepPlay(baseUrl, streamKey, sdpOffer) {
  const url = `${baseUrl}/rtc/v1/whep/?app=${APP}&stream=${encodeURIComponent(streamKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: sdpOffer,
  });
  if (!res.ok) throw new Error(`WHEP failed: ${res.status}`);
  return res.text();
}

export default function Call() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room') || '';
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

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    publishPcRef.current?.close();
    playPcRef.current?.close();
    navigate('/app/messages');
  };

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
        const sdpAnswer = await whipPublish(SRS_BASE, myStream, sdpOffer);
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
        const playSdpAnswer = await whepPlay(SRS_BASE, peerStream, playPc.localDescription.sdp);
        if (cancelled) return;
        await playPc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: playSdpAnswer }));

        setStatus('connected');
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to connect to SRS');
          setStatus('error');
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
        <p className="call-error-hint">SRS uses WHIP/WHEP (HTTP). Check https://streaming.wakilfy.com</p>
        <button type="button" className="call-btn-end" onClick={endCall}>
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
              {status === 'playing' && 'Connecting to peer…'}
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
        <button type="button" className="call-btn-end" onClick={endCall} title="End call">
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
