import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Heart,
  Gift,
  UserPlus,
  Radio,
  Square,
  UserPlus as UserPlusIcon,
  Copy,
  Check,
  Video,
  Menu,
  MessageCircle,
  X,
  Share2
} from 'lucide-react';
import Hls from 'hls.js';
import {
  getLiveById,
  getLiveConfig,
  joinLive,
  leaveLive,
  likeLive,
  requestToJoinLive,
  endLive,
} from '@/lib/api/live';
import { startWhipPublish } from '@/lib/whip';
import { startWhepPlay } from '@/lib/whep';
import { useAuthStore } from '@/store/auth.store';
import { GiftDrawer } from '@/components/live/GiftDrawer';
import { JoinRequestsPanel } from '@/components/live/JoinRequestsPanel';
import { LiveChat } from '@/components/live/LiveChat';
import { FloatingHearts } from '@/components/live/FloatingHearts';

function Avatar({ user, size = 44 }) {
  const src = user?.profilePic;
  const name = user?.name || 'Host';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center text-white font-semibold shrink-0 ring-2 ring-white/90"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        fontSize: size * 0.4,
      }}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : initial}
    </div>
  );
}

const mockMessages = [
  { id: 1, user: { name: 'Juma', profilePic: null }, text: 'Habari, live imetulia sana! 🔥' },
  { id: 2, user: { name: 'Sarah', profilePic: null }, text: 'Can you show the red dress again?' },
  { id: 3, user: { name: 'Admin', isHost: true }, text: 'Karibuni wote! Feel free to ask questions.' },
];

export default function LiveViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const whepPcRef = useRef(null);
  const localPreviewRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const heartsRef = useRef(null);

  const [useWhep, setUseWhep] = useState(true);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [joinPanelOpen, setJoinPanelOpen] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [copied, setCopied] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [whipStarted, setWhipStarted] = useState(false);
  const [whipStarting, setWhipStarting] = useState(false);
  const [whipError, setWhipError] = useState(null);
  const { user } = useAuthStore();

  // Chat state
  const [messages, setMessages] = useState(mockMessages);
  const [showChat, setShowChat] = useState(true);

  const currentUserId = user?.id;
  const isHost = currentUserId && live?.host?.id === currentUserId;

  const streamKey = live?.rtmpUrl?.split('/').filter(Boolean).pop() || '';
  const rtmpServer = 'rtmp://streaming.wakilfy.com/live/';

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const stopWhipPublish = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  const handleStartWhip = async () => {
    if (!streamKey || whipStarting || whipStarted) return;
    setWhipStarting(true);
    setWhipError(null);
    try {
      const config = await getLiveConfig();
      const baseUrl = config?.rtcApiBaseUrl || 'https://streaming.wakilfy.com/rtc/v1';
      const ice = config?.iceServers || {};
      const { pc, stream } = await startWhipPublish(streamKey, baseUrl, ice);
      pcRef.current = pc;
      localStreamRef.current = stream;
      setWhipStarted(true);
      if (localPreviewRef.current) localPreviewRef.current.srcObject = stream;
      setTimeout(() => setRetryCount((c) => c + 1), 3000);
    } catch (e) {
      setWhipError(e?.message || 'Failed to start camera broadcast');
    } finally {
      setWhipStarting(false);
    }
  };

  useEffect(() => {
    return () => stopWhipPublish();
  }, []);

  useEffect(() => {
    if (whipStarted && localPreviewRef.current && localStreamRef.current) {
      localPreviewRef.current.srcObject = localStreamRef.current;
    }
  }, [whipStarted]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getLiveById(id)
      .then((data) => setLive(data))
      .catch((e) => {
        setError(e?.response?.data?.message || e?.message || 'Live not found');
        setLive(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Join as viewer on mount, leave on unmount
  useEffect(() => {
    if (!id || !live?.id || live?.status !== 'LIVE' || isHost) return;
    joinLive(id).catch(() => { });
    return () => {
      leaveLive(id).catch(() => { });
    };
  }, [id, live?.id, live?.status, isHost]);

  // Playback: WHEP (WebRTC) first for low latency, fallback to HLS
  useEffect(() => {
    setVideoLoadError(false);
    const video = videoRef.current;
    const streamUrl = live?.streamUrl;
    const key = streamKey;
    if (!video || !live) return;

    let hls = null;

    const cleanup = () => {
      if (whepPcRef.current) {
        whepPcRef.current.close();
        whepPcRef.current = null;
      }
      if (video.srcObject) {
        video.srcObject = null;
      }
      if (hls) {
        hls.off(Hls.Events.ERROR);
        hls.destroy();
        hlsRef.current = null;
      } else if (video.src) {
        video.src = '';
      }
    };

    const startHls = () => {
      if (!streamUrl || !streamUrl.includes('.m3u8')) return;
      const onError = () => setVideoLoadError(true);
      if (Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setVideoLoadError(true);
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.addEventListener('error', onError);
        video.src = streamUrl;
      }
    };

    (async () => {
      if (useWhep && key) {
        try {
          const config = await getLiveConfig();
          const baseUrl = config?.rtcApiBaseUrl || 'https://streaming.wakilfy.com/rtc/v1';
          const pc = await startWhepPlay(key, baseUrl, video);
          whepPcRef.current = pc;
          return;
        } catch (e) {
          console.warn('WHEP failed, falling back to HLS:', e);
          setUseWhep(false);
        }
      }
      startHls();
    })();

    return () => cleanup();
  }, [live?.id, streamKey, live?.streamUrl, retryCount, useWhep]);

  const handleLike = () => {
    // Trigger local animation
    if (heartsRef.current) {
      heartsRef.current.trigger();
    }

    if (!id || liked) return;
    likeLive(id)
      .then(() => {
        setLiked(true);
        setLive((prev) => (prev ? { ...prev, likesCount: (prev.likesCount ?? 0) + 1 } : null));
      })
      .catch(() => { });
  };

  const handleSendMessage = (text) => {
    // Mock send message - in real app, emit socket event
    const newMsg = {
      id: Date.now(),
      user: { name: user?.name || 'You', profilePic: user?.profilePic },
      text
    };
    setMessages(prev => [...prev, newMsg]);

    // Simulate generic response after 2s occasionally
    if (Math.random() > 0.7) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          user: { name: 'Viewer ' + Math.floor(Math.random() * 100) },
          text: 'Wow amazing! 😍'
        }]);
        if (heartsRef.current) heartsRef.current.trigger();
      }, 2000);
    }
  };

  const handleRequestToJoin = () => {
    if (!id || joinRequestSent) return;
    requestToJoinLive(id)
      .then(() => setJoinRequestSent(true))
      .catch(() => { });
  };

  const handleEndLive = () => {
    if (!id || !isHost) return;
    stopWhipPublish();
    endLive(id)
      .then(() => navigate('/app/live'))
      .catch(() => { });
  };

  if (loading && !live) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center z-[1000]">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !live) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center text-white p-4 z-[1000]">
        <p className="text-red-400 mb-4">{error || 'Live not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/app/live')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
        >
          Back to Live
        </button>
      </div>
    );
  }

  const host = live?.host ?? {};
  const viewerCount = live?.viewerCount ?? 0;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0f0f0f] flex flex-col md:flex-row overflow-hidden overscroll-none touch-none">

      {/* LEFT: Video Area (Full on mobile, 70%-80% on Desktop) */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center group h-full">

        {/* Helper for Aspect Ratio on Desktop */}
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-contain md:max-w-full md:max-h-full bg-black"
            autoPlay
            muted={false}
            playsInline
            controls={false}
          />
        </div>

        {/* --- DESKTOP HEADER (Hidden on Mobile) --- */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none hidden md:flex">
          <div className="pointer-events-auto flex items-center gap-2">
            <button onClick={() => navigate('/app/live')} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors">
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>

        {/* --- MOBILE TOP OVERLAY --- */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-4 px-4 pb-12 bg-gradient-to-b from-black/60 via-black/20 to-transparent flex justify-between items-center pointer-events-none md:hidden">
          {/* Host Info Pill */}
          <div className="pointer-events-auto flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10">
            <Avatar user={host} size={32} />
            <div className="flex flex-col px-1">
              <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{host?.name?.slice(0, 10)}</span>
              <span className="text-[10px] text-white/90">{viewerCount} viewers</span>
            </div>
            {!isHost && (
              <button className="bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                +
              </button>
            )}
          </div>

          {/* Right Top Controls */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center justify-center min-w-[50px] bg-black/30 backdrop-blur-md rounded-full px-2 py-1 border border-white/10">
              <Eye size={12} className="text-white mr-1" />
              <span className="text-[10px] text-white font-bold">{viewerCount}</span>
            </div>
            <button
              onClick={() => navigate('/app/live')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* --- HOST SETUP OVERLAY (If needed) --- */}
        {(!live?.streamUrl || videoLoadError || (isHost && !whipStarted)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 backdrop-blur-sm">
            <div className="text-center max-w-lg px-6">
              {isHost ? (
                !whipStarted && (
                  <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/20">
                      <Video size={32} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Start Broadcasting</h3>
                    <p className="text-white/60 text-sm mb-6">Choose how you want to go live.</p>

                    <button
                      onClick={handleStartWhip}
                      disabled={whipStarting}
                      className="w-full py-4 bg-white text-black hover:bg-gray-100 rounded-xl font-bold mb-3 flex items-center justify-center gap-3 transition-colors"
                    >
                      {whipStarting ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Video size={20} />
                      )}
                      {whipStarting ? 'Initializing...' : 'Use Browser Camera'}
                    </button>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center"><span className="bg-[#1a1a1a] px-2 text-xs text-white/40 uppercase font-medium">Or using OBS</span></div>
                    </div>

                    <div className="bg-black/40 rounded-xl p-3 text-left">
                      <p className="text-white/40 text-xs mb-1 uppercase font-bold tracking-wider">Stream Key</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 font-mono text-pink-400 text-sm break-all">{streamKey}</code>
                        <button onClick={() => copyToClipboard(streamKey, 'key')} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                          {copied === 'key' ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-white/60 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10 animate-pulse">
                    <Radio size={40} className="text-white/20" />
                  </div>
                  <p className="text-lg font-medium text-white mb-2">Connecting to live stream...</p>
                  <p className="text-sm">Waiting for signal from host.</p>
                  <button onClick={() => navigate('/app/live')} className="mt-8 px-6 py-2 bg-white/10 rounded-full text-white text-sm font-medium">Cancel</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MOBILE ONLY OVERLAYS (Bottom) --- */}
        {/* On mobile, chat sits on top of video at bottom left */}
        <div className="absolute bottom-0 left-0 right-0 z-20 md:hidden flex flex-col justify-end pointer-events-none">
          {/* Dark Gradient for readability */}
          <div className="w-full h-80 bg-gradient-to-t from-black via-black/50 to-transparent absolute bottom-0 -z-10" />

          {/* Messages Area (Mobile) */}
          <div className="relative pointer-events-auto px-4 pb-2 w-[85%] flex flex-col justify-end">
            <LiveChat messages={messages} isTransparent={true} showInput={false} className="h-56 max-h-56 mask-image-linear-to-t" />
          </div>

          {/* Controls Bar (Mobile) */}
          <div className="relative p-3 pb-4 flex items-center gap-2 pointer-events-auto">
            <form
              className="flex-1 bg-black/40 backdrop-blur-md rounded-full flex items-center border border-white/10 px-1"
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.input.value;
                if (val) handleSendMessage(val);
                e.target.input.value = '';
              }}
            >
              <input
                name="input"
                placeholder="Add a comment..."
                className="flex-1 bg-transparent border-none text-white placeholder-white/60 text-sm px-3 py-2.5 focus:outline-none"
                autoComplete="off"
              />
              <button type="button" className="p-2 text-white/70">
                <span className="text-lg">@</span>
              </button>
              <button type="button" className="p-2 text-white/70">
                <span className="text-lg">☺</span>
              </button>
            </form>

            <div className="flex gap-2 shrink-0 items-center">
              <button onClick={() => setGiftOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-lg active:scale-95 transition-transform">
                <Gift size={18} />
              </button>
              <button onClick={() => { }} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all backdrop-blur-md border border-white/5">
                <Share2 size={18} />
              </button>
              <button
                onClick={handleLike}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all backdrop-blur-md border border-white/5 relative overflow-visible"
              >
                <Heart size={18} className={liked ? "fill-pink-500 text-pink-500" : ""} />
                <FloatingHearts ref={heartsRef} className="-top-32 -right-4 w-20 h-56" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Chat & Interaction Sidebar (DESKTOP ONLY) */}
      {/* Replaces the mobile overlays on desktop */}
      <AnimatePresence initial={false}>
        {showChat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col bg-[#121212] border-l border-white/10 shrink-0 relative z-20 h-full shadow-2xl"
          >
            <div className="p-4 h-16 border-b border-white/5 flex items-center justify-between bg-[#1a1a1a]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle size={18} className="text-pink-500" />
                Live Chat
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Online</span>
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
            </div>

            {/* Desktop Chat */}
            <div className="flex-1 overflow-hidden relative bg-[#121212]">
              <LiveChat messages={messages} onSendMessage={handleSendMessage} isTransparent={false} className="h-full" />
            </div>

            {/* Desktop Actions */}
            <div className="p-4 border-t border-white/5 bg-[#1a1a1a] space-y-3">
              {isHost ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleEndLive} className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20">
                    End Live
                  </button>
                  <button onClick={() => setJoinPanelOpen(true)} className="py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/20">
                    View Requests
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => setGiftOpen(true)} className="flex-[2] py-3 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 rounded-xl text-white font-bold text-sm shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                    <Gift size={18} /> Send Gift
                  </button>
                  <button
                    onClick={handleLike}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm transition-all relative active:scale-95 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Heart size={18} className={liked ? "fill-pink-500 text-pink-500" : "group-hover:text-pink-400"} />
                      Like
                    </span>
                    <FloatingHearts ref={heartsRef} className="bottom-full left-1/2 -translate-x-1/2 mb-2 w-16 h-48" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GiftDrawer
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        hostId={host?.id}
        hostName={host?.name}
        liveStreamId={live?.id}
      />

      {isHost && (
        <JoinRequestsPanel
          liveId={id}
          open={joinPanelOpen}
          onClose={() => setJoinPanelOpen(false)}
          isHost={true}
        />
      )}
    </div>
  );
}
