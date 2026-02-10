import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins } from 'lucide-react';
import { getGifts, getWallet, sendGift } from '@/lib/api/gifts';

export function GiftDrawer({ open, onClose, hostId, hostName, liveStreamId }) {
  const [gifts, setGifts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setQuantity(1);
    setMessage('');
    setLoading(true);
    Promise.all([getGifts(), getWallet()])
      .then(([gList, w]) => {
        setGifts(Array.isArray(gList) ? gList : []);
        setWallet(w ?? null);
      })
      .catch(() => {
        setGifts([]);
        setWallet(null);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const balance = wallet?.coinBalance ?? 0;
  const cost = selected ? (selected.coinValue ?? 0) * quantity : 0;
  const canSend = selected && quantity >= 1 && cost <= balance && !sending;

  const handleSend = async () => {
    if (!canSend || !hostId || !selected) return;
    setSending(true);
    try {
      await sendGift({
        receiverId: hostId,
        giftId: selected.id,
        liveStreamId: liveStreamId || undefined,
        quantity,
        message: message.trim() || undefined,
      });
      setWallet((w) => (w ? { ...w, coinBalance: (w.coinBalance ?? 0) - cost } : null));
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-t-3xl bg-[#1a1a1a] border border-white/10 shadow-2xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Send gift to {hostName || 'host'}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wallet balance */}
          <div className="px-4 py-2 flex items-center gap-2 text-sm text-white/70">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Balance: <strong className="text-white">{balance}</strong> coins</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-4 gap-3">
                  {gifts.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelected(g)}
                      className={`rounded-xl p-3 border-2 transition-all ${
                        selected?.id === g.id
                          ? 'border-pink-500 bg-pink-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      {g.iconUrl ? (
                        <img src={g.iconUrl} alt="" className="w-12 h-12 mx-auto object-contain rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 mx-auto rounded-lg bg-white/10 flex items-center justify-center text-2xl">
                          🎁
                        </div>
                      )}
                      <p className="text-xs text-white/80 mt-1 truncate">{g.name}</p>
                      <p className="text-xs text-amber-400">{g.coinValue ?? 0} coins</p>
                    </button>
                  ))}
                </div>

                {selected && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70">Quantity:</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-20 rounded-lg bg-white/10 border border-white/20 px-2 py-1 text-white text-center"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Message (optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white placeholder-white/40 text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending…' : `Send ${cost} coins`}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
