import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Heart,
  Gift,
  UserPlus,
  Radio,
  Square,
  UserPlus as UserPlusIcon,
} from 'lucide-react';
import Hls from 'hls.js';
import {
  getLiveById,
  joinLive,
  leaveLive,
  likeLive,
  requestToJoinLive,
  endLive,
} from '@/lib/api/live';
import { useAuthStore } from '@/store/auth.store';
import { GiftDrawer } from '@/components/live/GiftDrawer';
import { JoinRequestsPanel } from '@/components/live/JoinRequestsPanel';

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

export default function LiveViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [joinPanelOpen, setJoinPanelOpen] = useState(false);
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const isHost = currentUserId && live?.host?.id === currentUserId;

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
    joinLive(id).catch(() => {});
    return () => {
      leaveLive(id).catch(() => {});
    };
  }, [id, live?.id, live?.status, isHost]);

  // HLS playback
  useEffect(() => {
    const video = videoRef.current;
    const streamUrl = live?.streamUrl;
    if (!video || !streamUrl) return;

    const isM3u8 = streamUrl.includes('.m3u8');
    if (!isM3u8) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      return () => {
        video.src = '';
      };
    }
  }, [live?.streamUrl]);

  const handleLike = () => {
    if (!id || liked) return;
    likeLive(id)
      .then(() => {
        setLiked(true);
        setLive((prev) => (prev ? { ...prev, likesCount: (prev.likesCount ?? 0) + 1 } : null));
      })
      .catch(() => {});
  };

  const handleRequestToJoin = () => {
    if (!id || joinRequestSent) return;
    requestToJoinLive(id)
      .then(() => setJoinRequestSent(true))
      .catch(() => {});
  };

  const handleEndLive = () => {
    if (!id || !isHost) return;
    endLive(id)
      .then(() => navigate('/app/live'))
      .catch(() => {});
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
      {/* Video */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="w-full h-full object-contain bg-black"
          autoPlay
          muted={false}
          playsInline
          controls={false}
        />
        {/* Fallback when no stream yet */}
        {!live?.streamUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50">
            <div className="text-center">
              <Radio className="w-16 h-16 text-white/50 mx-auto mb-3 animate-pulse" />
              <p className="text-white/70">Waiting for stream…</p>
            </div>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-6 pb-20 bg-gradient-to-b from-black/80 to-transparent">
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

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-8 bg-gradient-to-t from-black/85 to-transparent">
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar user={host} size={48} />
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">{host?.name || 'Host'}</p>
              <p className="text-white/80 text-sm truncate">{live?.title || 'Live'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
              <Eye className="w-4 h-4" />
              <span>{viewerCount >= 1000 ? `${(viewerCount / 1000).toFixed(1)}K` : viewerCount}</span>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={`p-2.5 rounded-full transition-colors ${
                liked ? 'bg-pink-500/80 text-white' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
              aria-label="Like"
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </motion.button>
            {!isHost && (
              <>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGiftOpen(true)}
                  className="p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label="Gift"
                >
                  <Gift className="w-5 h-5" />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRequestToJoin}
                  disabled={joinRequestSent}
                  className={`p-2.5 rounded-full transition-colors ${
                    joinRequestSent
                      ? 'bg-green-500/50 text-white cursor-default'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                  aria-label="Request to join"
                  title={joinRequestSent ? 'Request sent' : 'Request to join'}
                >
                  <UserPlusIcon className="w-5 h-5" />
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Host: End live + Join requests */}
        {isHost && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setJoinPanelOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Join requests
            </button>
            <button
              type="button"
              onClick={handleEndLive}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-semibold"
            >
              <Square className="w-4 h-4" />
              End live
            </button>
          </div>
        )}
      </div>

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
