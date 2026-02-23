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
  MessageCircle,
  MoreVertical,
  Flag,
  Coins,
  Clock,
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
  getLiveComments,
  addLiveComment,
  getMyJoinRequest,
  subscribeLiveComments,
} from '@/lib/api/live';
import { startWhipPublish } from '@/lib/whip';
import { startWhepPlay } from '@/lib/whep';
import { useAuthStore } from '@/store/auth.store';
import { GiftDrawer } from '@/components/live/GiftDrawer';
import { FloatingGift } from '@/components/live/FloatingGift';
import { JoinRequestsPanel } from '@/components/live/JoinRequestsPanel';
import { LiveChat } from '@/components/live/LiveChat';
import { ReportModal } from '@/components/live/ReportModal';

function mapCommentToMessage(c) {
  const author = c.author ?? c.user ?? {};
  return {
    id: c.id,
    user: {
      id: c.authorId ?? author.id,
      name: c.authorName ?? author.name ?? 'User',
      profilePic: c.authorProfilePic ?? author.profilePic,
      isHost: c.isHost ?? author.isHost,
    },
    text: c.content ?? c.text ?? '',
  };
}

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

/** Small tile that plays one guest HLS stream – "yupo live" for viewers */
function GuestStreamTile({ streamUrl, requesterName }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl || !streamUrl.includes('.m3u8')) return;
    let hls = null;
    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 10 });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    }
    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      if (video.src) video.src = '';
    };
  }, [streamUrl]);

  return (
    <div className="shrink-0 w-24 h-32 rounded-xl overflow-hidden bg-black/60 border border-white/20 flex flex-col">
      <video
        ref={videoRef}
        className="w-full h-full object-cover flex-1"
        autoPlay
        muted
        playsInline
      />
      <p className="text-white text-[10px] font-medium truncate px-1 py-0.5 bg-black/50 text-center">
        {requesterName || 'Guest'}
      </p>
    </div>
  );
}

export default function LiveViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const whepPcRef = useRef(null);
  const localPreviewRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
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
  const [messages, setMessages] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [myJoinRequest, setMyJoinRequest] = useState(null);
  const [guestWhipStarted, setGuestWhipStarted] = useState(false);
  const [guestWhipStarting, setGuestWhipStarting] = useState(false);
  const [guestWhipError, setGuestWhipError] = useState(null);
  const [floatingLikes, setFloatingLikes] = useState([]);
  const [floatingGifts, setFloatingGifts] = useState([]);
  const [heartBurst, setHeartBurst] = useState(null); // { key } – TikTok-style center heart on double-tap
  const FLOATING_LIKES_MAX = 8;
  const FLOATING_GIFTS_MAX = 5;
  const [obsDrawerOpen, setObsDrawerOpen] = useState(false);
  const [hostMenuOpen, setHostMenuOpen] = useState(false);
  const [reportStreamOpen, setReportStreamOpen] = useState(false);
  const [reportCommentTarget, setReportCommentTarget] = useState(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [endStreamSummary, setEndStreamSummary] = useState(null);
  const [sseActive, setSseActive] = useState(false);
  const sseUnsubscribeRef = useRef(null);
  const guestPcRef = useRef(null);
  const guestStreamRef = useRef(null);
  const guestPreviewRef = useRef(null);
  const { user } = useAuthStore();
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
      setWhipError(e?.message || 'Imeshindwa kuanza kamera. Jaribu tena au tumia OBS hapa chini.');
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

  // Refresh live details (e.g. guestStreams when host accepts someone) so viewers see "wapo live"
  useEffect(() => {
    if (!id || !live?.id || live?.status !== 'LIVE') return;
    const interval = setInterval(() => {
      getLiveById(id)
        .then((data) => setLive(data))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [id, live?.id, live?.status]);

  // Load comments once
  useEffect(() => {
    if (!id || !live?.id) return;
    let cancelled = false;
    setCommentsLoading(true);
    getLiveComments(id)
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setMessages(list.map(mapCommentToMessage));
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, live?.id]);

  // SSE for real-time comments when live; fallback to polling when SSE not connected
  useEffect(() => {
    if (!id || !live?.id || live?.status !== 'LIVE') return;
    const unsub = subscribeLiveComments(
      id,
      (comment) => setMessages((prev) => [...prev, mapCommentToMessage(comment)]),
      () => setSseActive(true),
      (count) => setLive((prev) => (prev ? { ...prev, viewerCount: count } : null))
    );
    sseUnsubscribeRef.current = unsub;
    return () => {
      if (sseUnsubscribeRef.current) sseUnsubscribeRef.current();
      sseUnsubscribeRef.current = null;
      setSseActive(false);
    };
  }, [id, live?.id, live?.status]);

  // Polling fallback when SSE is not active (e.g. connection failed or not yet connected)
  useEffect(() => {
    if (!id || !live?.id || live?.status !== 'LIVE' || sseActive) return;
    const poll = () => {
      getLiveComments(id)
        .then((list) => {
          if (Array.isArray(list)) setMessages(list.map(mapCommentToMessage));
        })
        .catch(() => {});
    };
    const interval = setInterval(poll, 5500);
    return () => clearInterval(interval);
  }, [id, live?.id, live?.status, sseActive]);

  // Poll my join request when viewer has sent a request (so we know when host accepted)
  useEffect(() => {
    if (!id || isHost || !currentUserId) return;
    const poll = () => {
      getMyJoinRequest(id)
        .then((res) => {
          if (res && res.status) setMyJoinRequest(res);
          if (res && res.status === 'PENDING') setJoinRequestSent(true);
        })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [id, isHost, currentUserId]);

  // Join as viewer on mount, leave on unmount
  useEffect(() => {
    if (!id || !live?.id || live?.status !== 'LIVE' || isHost) return;
    joinLive(id).catch(() => {});
    return () => {
      leaveLive(id).catch(() => {});
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
        hls = new Hls({ maxBufferLength: 12, maxMaxBufferLength: 15 });
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
    if (!id || liked) return;
    const burstKey = Date.now();
    setHeartBurst({ key: burstKey });
    setTimeout(() => setHeartBurst((b) => (b?.key === burstKey ? null : b)), 900);
    likeLive(id)
      .then(() => {
        setLiked(true);
        setLive((prev) => (prev ? { ...prev, likesCount: (prev.likesCount ?? 0) + 1 } : null));
        const item = { key: Date.now(), userId: user?.id, userName: user?.name, userProfilePic: user?.profilePic };
        setFloatingLikes((prev) => {
          const next = [...prev, item].slice(-FLOATING_LIKES_MAX);
          return next;
        });
        setTimeout(() => setFloatingLikes((p) => p.filter((x) => x.key !== item.key)), 4000);
      })
      .catch(() => {});
  };

  const handleVideoDoubleTap = () => {
    handleLike();
  };

  const handleRequestToJoin = () => {
    if (!id || joinRequestSent) return;
    requestToJoinLive(id)
      .then(() => {
        setJoinRequestSent(true);
        setMyJoinRequest((prev) => ({ ...prev, status: 'PENDING' }));
      })
      .catch(() => {});
  };

  const stopGuestWhip = () => {
    if (guestStreamRef.current) {
      guestStreamRef.current.getTracks().forEach((t) => t.stop());
      guestStreamRef.current = null;
    }
    if (guestPcRef.current) {
      guestPcRef.current.close();
      guestPcRef.current = null;
    }
  };

  const handleStartGuestWhip = async () => {
    const key = myJoinRequest?.guestStreamKey;
    if (!id || !key || guestWhipStarting || guestWhipStarted) return;
    setGuestWhipStarting(true);
    setGuestWhipError(null);
    try {
      const config = await getLiveConfig();
      const baseUrl = config?.rtcApiBaseUrl || 'https://streaming.wakilfy.com/rtc/v1';
      const ice = config?.iceServers || {};
      const { pc, stream } = await startWhipPublish(key, baseUrl, ice);
      guestPcRef.current = pc;
      guestStreamRef.current = stream;
      setGuestWhipStarted(true);
      if (guestPreviewRef.current) guestPreviewRef.current.srcObject = stream;
    } catch (e) {
      setGuestWhipError(e?.message || 'Failed to start camera');
    } finally {
      setGuestWhipStarting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (!isHost) stopGuestWhip();
    };
  }, [isHost]);

  useEffect(() => {
    if (guestWhipStarted && guestStreamRef.current && guestPreviewRef.current) {
      guestPreviewRef.current.srcObject = guestStreamRef.current;
    }
  }, [guestWhipStarted]);

  const handleEndLive = () => {
    if (!id || !isHost) return;
    stopWhipPublish();
    endLive(id)
      .then((stream) => {
        setEndStreamSummary(stream);
        setSummaryModalOpen(true);
      })
      .catch(() => {});
  };

  const handleSendMessage = async (text) => {
    if (!id || !text?.trim()) return;
    try {
      const created = await addLiveComment(id, text.trim());
      const newMsg = mapCommentToMessage(created ?? { id: Date.now(), author: user, content: text });
      setMessages((prev) => [...prev, newMsg]);
    } catch (_) {}
  };

  const handleGiftSent = ({ gift, quantity }) => {
    const key = Date.now();
    setFloatingGifts((prev) => [...prev.slice(-(FLOATING_GIFTS_MAX - 1)), { key, gift, quantity, senderName: user?.name }]);
    // onComplete from FloatingGift removes; fallback cleanup after duration
    setTimeout(() => setFloatingGifts((p) => p.filter((x) => x.key !== key)), 2800);
  };

  if (loading && !live) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !live) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
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
    <div className="fixed inset-0 z-40 bg-black">
      {/* Video – double-tap to like (TikTok-style) */}
      <div
        className="absolute inset-0"
        onDoubleClick={!isHost ? handleVideoDoubleTap : undefined}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          autoPlay
          muted={false}
          playsInline
          controls={false}
        />
        {/* Overlay: no stream URL, load error, or host hasn't started camera yet */}
        {(!live?.streamUrl || videoLoadError || (isHost && !whipStarted)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50">
            <div className="text-center max-w-lg px-4">
              <Radio className="w-16 h-16 text-white/50 mx-auto mb-3 animate-pulse" />
              {isHost ? (
                <>
                  <p className="text-white font-semibold mb-1">Video haijaonekana bado</p>
                  <p className="text-white/70 text-sm mb-3">
                    Chagua njia moja: <strong>kamera ya browser</strong> (WebRTC) au <strong>OBS</strong> (RTMP).
                  </p>
                  {!whipStarted ? (
                    <button
                      type="button"
                      onClick={handleStartWhip}
                      disabled={whipStarting || !streamKey}
                      className="flex items-center gap-2 mx-auto px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold mb-4"
                    >
                      <Video className="w-5 h-5" />
                      {whipStarting ? 'Inaanza…' : 'Start camera (broadcast from browser)'}
                    </button>
                  ) : (
                    <p className="text-green-400 text-sm font-medium mb-3">Broadcasting via WebRTC – video inafika server.</p>
                  )}
                  {whipError && <p className="text-red-400 text-sm mb-3">{whipError}</p>}
                  {whipStarted && localStreamRef.current && (
                    <video
                      ref={localPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-48 h-36 object-cover rounded-xl border-2 border-white/30 mx-auto mb-4"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setObsDrawerOpen(true)}
                    className="mx-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" />
                    Stream setup (OBS)
                  </button>
                  {videoLoadError && (
                    <button
                      type="button"
                      onClick={() => setRetryCount((c) => c + 1)}
                      className="mt-4 ml-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium"
                    >
                      Jaribu tena (baada ya kuanza OBS)
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-white/80 mb-1">Stream haijaanza bado</p>
                  <p className="text-white/50 text-sm">Host anapaswa kuanza ku-stream kwa OBS; video itaonekana hivi karibuni.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Viewer: Host accepted – join as guest (more than one on live) */}
      {!isHost && String(myJoinRequest?.status).toUpperCase() === 'ACCEPTED' && myJoinRequest?.guestStreamKey && (
        <div className="absolute left-4 right-4 top-24 z-20 rounded-2xl bg-green-500/20 backdrop-blur-md border border-green-400/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/50 flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">Host amekukubali!</p>
              <p className="text-white/80 text-sm">Washa kamera ili kuonekana live pamoja na host.</p>
            </div>
          </div>
          {!guestWhipStarted ? (
            <button
              type="button"
              onClick={handleStartGuestWhip}
              disabled={guestWhipStarting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold shrink-0"
            >
              <Video className="w-5 h-5" />
              {guestWhipStarting ? 'Inaanza…' : 'Washa kamera & jiunge'}
            </button>
          ) : (
            <p className="text-green-300 text-sm font-medium shrink-0">Unaonekana live sasa.</p>
          )}
          {guestWhipError && <p className="text-red-300 text-sm w-full sm:w-auto">{guestWhipError}</p>}
        </div>
      )}

      {/* Guest self-view when joined – left of right strip */}
      {!isHost && guestWhipStarted && guestStreamRef.current && (
        <div className="absolute right-14 bottom-20 z-20 w-24 h-32 md:w-28 md:h-36 rounded-xl overflow-hidden border-2 border-white/30 bg-black shadow-lg">
          <video
            ref={guestPreviewRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Heart burst – TikTok-style: double-tap shows big heart in center (wote wanaona effect) */}
      <AnimatePresence>
        {heartBurst && (
          <motion.div
            key={heartBurst.key}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 1.4, 1.2], opacity: [1, 0.95, 0.7] }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-28 h-28 md:w-36 md:h-36 text-pink-400 fill-pink-400 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 0 20px rgba(236,72,153,0.6))' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift animation: pop center then float (mtu anaeona gift aliyetumwa) */}
      {floatingGifts.map((item, i) => (
        <FloatingGift
          key={item.key}
          gift={item.gift}
          quantity={item.quantity}
          senderName={item.senderName}
          onComplete={() => setFloatingGifts((p) => p.filter((x) => x.key !== item.key))}
          index={i}
        />
      ))}

      {/* Like pills – float up left side (user who liked inaonekana) */}
      {floatingLikes.length > 0 && (
        <div className="absolute left-3 bottom-24 md:bottom-28 z-25 flex flex-col gap-2 pointer-events-none overflow-visible">
          {floatingLikes.map((item) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 1, y: 0, scale: 0.9 }}
              animate={{ opacity: 0, y: -100, scale: 1 }}
              transition={{ duration: 3.2, ease: 'easeOut' }}
              className="pointer-events-auto shrink-0"
            >
              <button
                type="button"
                onClick={() => item.userId && navigate(`/app/profile/${item.userId}`)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-pink-500/95 hover:bg-pink-500 text-white shadow-lg border border-white/20 transition-colors"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 shrink-0">
                  {item.userProfilePic ? (
                    <img src={item.userProfilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                      {item.userName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold truncate max-w-[90px]">{item.userName || 'Someone'}</span>
                <Heart className="w-3.5 h-3.5 fill-current shrink-0" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Guests on live – above bottom bar so no overlap */}
      {Array.isArray(live?.guestStreams) && live.guestStreams.length > 0 && (
        <div className="absolute left-3 right-14 bottom-16 md:bottom-20 z-20 flex flex-col gap-1 max-w-[calc(100vw-5rem)]">
          <p className="text-white/90 text-xs font-semibold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-green-400 shrink-0" />
            Wapo live
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {live.guestStreams.map((g) => (
              <GuestStreamTile
                key={g.streamKey || g.requesterId}
                streamUrl={g.streamUrl}
                requesterName={g.requesterName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 pt-5 pb-16 md:p-4 md:pt-6 md:pb-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/app/live')}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-sm font-bold">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        </div>
      </div>

      {/* Right strip – Like, Gift, Chat, Join, Report (zisiingiliane, mobile + web) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 md:right-3">
        <button type="button" onClick={() => setShowChat((c) => !c)} className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors shadow-lg shrink-0" aria-label={showChat ? 'Hide chat' : 'Show chat'} title="Chat">
          <MessageCircle className="w-5 h-5" />
        </button>
        <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={handleLike} className={`p-2.5 rounded-full transition-colors shrink-0 ${liked ? 'bg-pink-500/90 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`} aria-label="Like" title="Like">
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
        </motion.button>
        {!isHost && (
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => setGiftOpen(true)} className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors shrink-0" aria-label="Gift" title="Gift">
            <Gift className="w-5 h-5" />
          </motion.button>
        )}
        {!isHost && (
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={handleRequestToJoin} disabled={joinRequestSent} className={`p-2.5 rounded-full transition-colors shrink-0 ${joinRequestSent ? 'bg-green-500/60 text-white cursor-default' : 'bg-black/50 text-white hover:bg-black/70'}`} aria-label="Join" title={joinRequestSent ? 'Request sent' : 'Request to join'}>
            <UserPlusIcon className="w-5 h-5" />
          </motion.button>
        )}
        {!isHost && (
          <button type="button" onClick={() => setReportStreamOpen(true)} className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors shrink-0" aria-label="Report" title="Report">
            <Flag className="w-5 h-5" />
          </button>
        )}
        {isHost && (
          <div className="relative shrink-0">
            <button type="button" onClick={() => setHostMenuOpen((o) => !o)} className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Menu">
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {hostMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setHostMenuOpen(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-full mt-1 z-20 py-1 min-w-[180px] rounded-xl bg-black/90 border border-white/10 shadow-xl">
                    <button type="button" onClick={() => { setJoinPanelOpen(true); setHostMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-white hover:bg-white/10 text-sm">
                      <UserPlus className="w-4 h-4" /> Join requests
                    </button>
                    <button type="button" onClick={() => { handleEndLive(); setHostMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-400 hover:bg-red-500/20 text-sm font-medium">
                      <Square className="w-4 h-4" /> End live
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Chat panel – opens to the left of right strip (mobile + web, haifichi video) */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute right-14 md:right-16 top-[50%] -translate-y-1/2 z-20 overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-xl flex flex-col w-[240px] sm:w-[260px] md:w-72 max-w-[calc(100vw-5rem)] h-[200px] sm:h-[220px] md:h-[280px]"
          >
            <LiveChat messages={messages} onSendMessage={handleSendMessage} onAuthorClick={(u) => u?.id && navigate(`/app/profile/${u.id}`)} onReportComment={(msg) => setReportCommentTarget(msg)} solidBackground={true} showInput={true} className="h-full min-h-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar – slim: host + viewer count only (vitone si chini, ziko right strip) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-3 py-2 pb-4 md:px-4 md:py-3 md:pb-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar user={host} size={40} />
            <div className="min-w-0">
              <p className="text-white font-semibold truncate text-sm">{host?.name || 'Host'}</p>
              <p className="text-white/70 text-xs truncate">{live?.title || 'Live'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isHost && live?.totalGiftsValue != null && Number(live.totalGiftsValue) > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                <Coins className="w-3.5 h-3.5" />
                <span>{Number(live.totalGiftsValue)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
              <Eye className="w-3.5 h-3.5" />
              <span>{viewerCount >= 1000 ? `${(viewerCount / 1000).toFixed(1)}K` : viewerCount}</span>
            </div>
          </div>
        </div>
      </div>

      <GiftDrawer
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        hostId={host?.id}
        hostName={host?.name}
        liveStreamId={live?.id}
        onGiftSent={handleGiftSent}
      />

      <ReportModal open={reportStreamOpen} onClose={() => setReportStreamOpen(false)} type="LIVE_STREAM" targetId={id} title="Report live stream" />
      <ReportModal open={!!reportCommentTarget} onClose={() => setReportCommentTarget(null)} type="LIVE_COMMENT" targetId={reportCommentTarget?.id} title="Report comment" />

      {/* Stream summary modal after host ends live */}
      <AnimatePresence>
        {summaryModalOpen && endStreamSummary && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => { setSummaryModalOpen(false); setEndStreamSummary(null); navigate('/app/live'); }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Stream summary</h3>
              <div className="space-y-3 text-white/90">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-pink-400" />
                  <span>Duration: <strong>{endStreamSummary.durationSeconds != null ? `${Math.floor(endStreamSummary.durationSeconds / 60)}m ${endStreamSummary.durationSeconds % 60}s` : '—'}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-pink-400" />
                  <span>Peak viewers: <strong>{endStreamSummary.peakViewers ?? 0}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <span>Likes: <strong>{endStreamSummary.likesCount ?? 0}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>Earnings: <strong className="text-amber-400">{Number(endStreamSummary.totalGiftsValue ?? 0)} coins</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-pink-400" />
                  <span>Comments: <strong>{endStreamSummary.commentsCount ?? 0}</strong></span>
                </div>
              </div>
              <button type="button" onClick={() => { setSummaryModalOpen(false); setEndStreamSummary(null); navigate('/app/live'); }} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold">
                Back to Live
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isHost && (
        <JoinRequestsPanel
          liveId={id}
          open={joinPanelOpen}
          onClose={() => setJoinPanelOpen(false)}
          isHost={true}
        />
      )}

      {/* Host: OBS / Stream setup drawer – keeps video area clean */}
      <AnimatePresence>
        {isHost && obsDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setObsDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#1a1a1a] border-l border-white/10 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Stream setup (OBS)</h3>
                <button type="button" onClick={() => setObsDrawerOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <p className="text-white/70 text-sm">OBS → Settings → Stream → Service: Custom</p>
                <div>
                  <p className="text-white/70 text-xs mb-1">Server URL</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-mono flex-1 break-all">{rtmpServer}</p>
                    <button type="button" onClick={() => copyToClipboard(rtmpServer, 'server')} className="shrink-0 p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white" title="Copy">
                      {copied === 'server' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-white/70 text-xs mb-1">Stream key</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-mono flex-1 break-all">{streamKey}</p>
                    <button type="button" onClick={() => copyToClipboard(streamKey, 'key')} className="shrink-0 p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white" title="Copy">
                      {copied === 'key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-white/50 text-xs">OBS: Start Streaming. Baada ya sekunde chache video itaonekana kwa viewers.</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
