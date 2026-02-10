/**
 * Incoming call modal – ring, caller info, Accept/Decline
 */
import { useEffect, useRef } from 'react';
import { Phone, PhoneOff } from 'lucide-react';

function Avatar({ caller, size = 72 }) {
  const src = caller?.profilePic;
  const name = caller?.name || 'Caller';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="incoming-call-avatar"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
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
        initial
      )}
    </div>
  );
}

function useRingTone(playing) {
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!playing) return;

    const playBeep = () => {
      try {
        const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch (_) {}
    };

    playBeep();
    intervalRef.current = setInterval(playBeep, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);
}

export default function IncomingCallModal({ call, onAccept, onDecline, disabled }) {
  const isVideo = call?.type === 'VIDEO';
  useRingTone(!!call);

  if (!call) return null;

  const caller = call.caller || {};

  return (
    <div className="incoming-call-overlay" role="dialog" aria-modal="true" aria-label="Incoming call">
      <div className="incoming-call-modal">
        <div className="incoming-call-ring" aria-hidden="true" />
        <Avatar caller={caller} size={96} />
        <p className="incoming-call-name">{caller.name || 'Unknown'}</p>
        <p className="incoming-call-type">
          {isVideo ? 'Video call' : 'Voice call'}
        </p>
        <div className="incoming-call-actions">
          <button
            type="button"
            className="incoming-call-btn incoming-call-btn-decline"
            onClick={onDecline}
            disabled={disabled}
            aria-label="Decline call"
          >
            <PhoneOff size={28} />
            <span>Decline</span>
          </button>
          <button
            type="button"
            className="incoming-call-btn incoming-call-btn-accept"
            onClick={onAccept}
            disabled={disabled}
            aria-label="Accept call"
          >
            <Phone size={28} />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
