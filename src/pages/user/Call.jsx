import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import '@/styles/user-app.css';

const SIGNAL_URL = 'wss://streaming.wakilfy.com/rtc/v1/sig';
const ICE_SERVERS = [
  { urls: 'stun:streaming.wakilfy.com:3478' },
  {
    urls: 'turn:streaming.wakilfy.com:3478',
    username: 'wakilfy',
    credential: 'Wakilfy@2026',
  },
];

export default function Call() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get('room') || '';
  const callType = (searchParams.get('type') || 'VIDEO').toUpperCase();
  const isVideo = callType === 'VIDEO';

  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(isVideo);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) pcRef.current.close();
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    navigate('/app/messages');
  };

  useEffect(() => {
    if (!roomId) {
      setError('No room ID');
      setStatus('error');
      return;
    }

    let pc = null;
    let ws = null;

    const setupLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideo ? true : false,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (e) {
        setError('Could not access camera/microphone: ' + (e.message || 'Unknown'));
        setStatus('error');
      }
    };

    const connect = async () => {
      await setupLocalStream();
      if (status === 'error') return;

      try {
        ws = new WebSocket(SIGNAL_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('waiting');
          ws.send(JSON.stringify({ action: 'join', room: roomId }));
        };

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data);
            const createPC = () => {
              if (pc) return pc;
              pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
              pcRef.current = pc;
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
              }
              pc.ontrack = (e) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
                setStatus('connected');
              };
              pc.onicecandidate = (e) => {
                if (e.candidate) ws.send(JSON.stringify({ type: 'ice', room: roomId, candidate: e.candidate }));
              };
              return pc;
            };

            if (msg.type === 'offer') {
              pc = createPC();
              await pc.setRemoteDescription(new RTCSessionDescription(msg));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: 'answer', room: roomId, sdp: answer }));
            } else if (msg.type === 'answer') {
              pc = pc || createPC();
              await pc.setRemoteDescription(new RTCSessionDescription(msg));
              setStatus('connected');
            } else if (msg.type === 'ice' && msg.candidate) {
              pc = pc || createPC();
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } else if (msg.type === 'peer_joined' || msg.peer_joined) {
              pc = createPC();
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: 'offer', room: roomId, sdp: offer }));
            }
          } catch (e) {
            console.warn('Signaling message error:', e);
          }
        };

        ws.onerror = () => setError('Connection error');
        ws.onclose = () => {
          if (status !== 'ended') setStatus('disconnected');
        };
      } catch (e) {
        setError(e.message || 'Failed to connect');
        setStatus('error');
      }
    };

    connect();
    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    };
  }, [roomId]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = videoEnabled;
    });
  }, [videoEnabled]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = audioEnabled;
    });
  }, [audioEnabled]);

  if (error) {
    return (
      <div className="call-page call-page-error">
        <p>{error}</p>
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
              {status === 'waiting' && 'Waiting for peer…'}
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
