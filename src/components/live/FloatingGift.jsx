import { motion } from 'framer-motion';
import { getGiftEmoji } from './giftIcons';

/**
 * Gift animation: POP in center (mtu anaona gift imetumwa), then float up and fade.
 */
export function FloatingGift({ gift, quantity, senderName, onComplete, index = 0 }) {
  const emoji = getGiftEmoji(gift);
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 1, 0.85, 0],
          scale: [0, 1.3, 1.1, 1, 1],
          y: [0, 0, -40, -140, -220],
          x: index * 16,
        }}
        transition={{
          duration: 2.6,
          times: [0, 0.12, 0.2, 0.6, 1],
          ease: 'easeOut',
        }}
        onAnimationComplete={onComplete}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500/95 via-violet-500/95 to-fuchsia-500/95 text-white shadow-2xl border border-white/30 backdrop-blur-sm"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(236,72,153,0.35)' }}
      >
        {gift?.iconUrl ? (
          <img src={gift.iconUrl} alt="" className="w-12 h-12 object-contain rounded-xl shrink-0" />
        ) : (
          <span
            className="w-12 h-12 flex items-center justify-center text-3xl rounded-xl bg-white/25 shrink-0"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' }}
          >
            {emoji}
          </span>
        )}
        <div className="text-left min-w-0">
          <p className="text-sm font-bold truncate drop-shadow-sm">{senderName || 'Someone'}</p>
          <p className="text-xs text-white/95">
            sent {gift?.name || 'Gift'} {quantity > 1 ? `× ${quantity}` : ''}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
