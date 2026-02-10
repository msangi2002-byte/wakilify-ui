import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, X, Loader2, XCircle } from 'lucide-react';
import { getJoinRequests, acceptJoinRequest, rejectJoinRequest } from '@/lib/api/live';

function Avatar({ requester, size = 40 }) {
  const src = requester?.profilePic;
  const name = requester?.name || 'Viewer';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center text-white font-semibold shrink-0 bg-gradient-to-br from-violet-500 to-pink-500"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : initial}
    </div>
  );
}

export function JoinRequestsPanel({ liveId, open, onClose, isHost, onAcceptReject }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    if (!open || !liveId || !isHost) return;
    setLoading(true);
    getJoinRequests(liveId, true)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [open, liveId, isHost]);

  const handleAccept = async (requestId) => {
    setActingId(requestId);
    try {
      await acceptJoinRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      onAcceptReject?.('accept', requestId);
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setActingId(requestId);
    try {
      await rejectJoinRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      onAcceptReject?.('reject', requestId);
    } finally {
      setActingId(null);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-1/2 -translate-y-1/2 w-72 max-h-[70vh] rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden flex flex-col z-20"
    >
      <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-pink-400" />
          <span className="font-semibold text-white">Join requests</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          aria-label="Close"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/60" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-6">No pending requests</p>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 mb-1"
            >
              <Avatar requester={req.requester} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{req.requester?.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAccept(req.id)}
                  disabled={actingId !== null}
                  className="p-2 rounded-full bg-green-500/30 text-green-400 hover:bg-green-500/50 disabled:opacity-50"
                  aria-label="Accept"
                >
                  {actingId === req.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(req.id)}
                  disabled={actingId !== null}
                  className="p-2 rounded-full bg-red-500/30 text-red-400 hover:bg-red-500/50 disabled:opacity-50"
                  aria-label="Reject"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
