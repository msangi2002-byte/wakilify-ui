import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins } from 'lucide-react';
import { getGifts, getWallet, sendGift } from '@/lib/api/gifts';
import { getGiftEmoji, getGiftCardTheme } from './giftIcons';

export function GiftDrawer({ open, onClose, hostId, hostName, liveStreamId, onGiftSent }) {
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
  const coinPerGift = selected?.coinValue ?? 0;
  const maxAffordable = coinPerGift > 0 ? Math.max(1, Math.floor(balance / coinPerGift)) : 1;
  const quantityCapped = Math.min(quantity, maxAffordable);
  const cost = selected ? coinPerGift * quantityCapped : 0;
  const canSend = selected && quantityCapped >= 1 && cost <= balance && !sending;

  const handleSend = async () => {
    if (!canSend || !hostId || !selected) return;
    setSending(true);
    try {
      await sendGift({
        receiverId: hostId,
        giftId: selected.id,
        liveStreamId: liveStreamId || undefined,
        quantity: quantityCapped,
        message: message.trim() || undefined,
      });
      setWallet((w) => (w ? { ...w, coinBalance: (w.coinBalance ?? 0) - cost } : null));
      onGiftSent?.({ gift: selected, quantity: quantityCapped });
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
                <div className="grid grid-cols-4 gap-3" style={{ perspective: '800px' }}>
                  {gifts.map((g, i) => {
                    const emoji = g.iconUrl ? null : getGiftEmoji(g);
                    const theme = getGiftCardTheme(g.level);
                    const isSelected = selected?.id === g.id;
                    return (
                      <motion.button
                        key={g.id}
                        type="button"
                        onClick={() => setSelected(g)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`
                          gift-card-3d rounded-2xl p-2.5 border-2 transition-all duration-300
                          bg-gradient-to-br ${theme}
                          ${isSelected
                            ? 'gift-card-selected ring-2 ring-pink-400 ring-offset-2 ring-offset-[#1a1a1a] scale-[1.02] shadow-lg shadow-pink-500/25'
                            : 'hover:scale-[1.03] hover:shadow-xl hover:shadow-black/30 active:scale-[0.98]'
                          }
                        `}
                      >
                        <div className="gift-card-inner relative w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden">
                          {g.iconUrl ? (
                            <img src={g.iconUrl} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <span
                              className="gift-emoji text-3xl sm:text-4xl drop-shadow-lg filter select-none"
                              style={{
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4)) drop-shadow(0 0 12px rgba(255,255,255,0.15))',
                              }}
                            >
                              {emoji}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-white/90 mt-1 truncate leading-tight">{g.name}</p>
                        {g.level && (
                          <span className="text-[9px] text-white/60 uppercase tracking-wider font-semibold block truncate">
                            {g.level}
                          </span>
                        )}
                        <p className="text-[11px] text-amber-400 font-bold mt-0.5">{g.coinValue ?? 0} coins</p>
                      </motion.button>
                    );
                  })}
                </div>

                {selected && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <span
                        className="w-14 h-14 flex items-center justify-center text-4xl rounded-xl bg-gradient-to-br from-white/15 to-white/5 shrink-0"
                        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
                      >
                        {selected.iconUrl ? (
                          <img src={selected.iconUrl} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          getGiftEmoji(selected)
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{selected.name}</p>
                        <p className="text-amber-400 text-sm font-medium">{selected.coinValue ?? 0} coins each</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70">Quantity:</span>
                      <input
                        type="number"
                        min={1}
                        max={maxAffordable}
                        value={quantityCapped}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(maxAffordable, parseInt(e.target.value, 10) || 1)))}
                        className="w-20 rounded-lg bg-white/10 border border-white/20 px-2 py-1 text-white text-center"
                      />
                      <span className="text-xs text-white/50">max {maxAffordable} (by coins)</span>
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
      <style>{`
        .gift-card-3d {
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }
        .gift-card-3d:not(.gift-card-selected):hover {
          transform: perspective(800px) rotateX(-4deg) rotateY(2deg) scale(1.03);
        }
        .gift-card-3d:active {
          transform: perspective(800px) scale(0.98);
        }
        .gift-card-inner {
          min-height: 56px;
        }
      `}</style>
    </AnimatePresence>
  );
}
