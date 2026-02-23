import { motion } from 'framer-motion';
import { getGiftEmoji } from './giftIcons';

/**
 * Single gift animation: floats from center-bottom toward target (host avatar area), then fades out.
 * Uses gift emoji (🌹🫰🍩 etc.) for 3D-style consistency with GiftDrawer.
 */
export function FloatingGift({ gift, quantity, senderName, onComplete }) {
  const emoji = getGiftEmoji(gift);
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 0.7, rotate: -5 }}
      animate={{
        opacity: [1, 1, 0.9, 0],
        y: [-60, -140, -200, -240],
        x: [-40, -90, -120, -140],
        scale: [0.7, 1.1, 1.05, 1],
        rotate: [-5, 2, 0, 0],
      }}
      transition={{ duration: 2.4, ease: 'easeOut' }}
      onAnimationComplete={onComplete}
      className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-pink-500/95 via-violet-500/95 to-fuchsia-500/95 text-white shadow-2xl border border-white/30 backdrop-blur-sm"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)' }}
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
  );
}
