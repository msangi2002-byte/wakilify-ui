/**
 * Gift name → emoji for consistent 3D-style icons across GiftDrawer and FloatingGift.
 */
export const GIFT_EMOJI = {
  'Rose': '🌹',
  'Finger Heart': '🫰',
  'Doughnut': '🍩',
  'Paper Crane': '🕊️',
  'Money Gun': '💸',
  'Galaxy': '🌌',
  'Whale Diving': '🐋',
  'Leon the Kitten': '🐱',
  'Lion': '🦁',
  'Wakilfy Universe': '✨',
};

/** Gradient/theme hints per level for 3D card styling */
export const GIFT_LEVEL_THEME = {
  Basic: 'from-rose-500/20 to-rose-600/10 border-rose-400/30',
  Low: 'from-pink-500/20 to-fuchsia-500/10 border-pink-400/30',
  Mid: 'from-violet-500/20 to-purple-500/10 border-violet-400/30',
  Popular: 'from-amber-500/20 to-orange-500/10 border-amber-400/40',
  High: 'from-cyan-500/20 to-blue-500/10 border-cyan-400/30',
  Premium: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/30',
  Ultra: 'from-yellow-500/25 to-amber-600/15 border-yellow-400/50',
  Elite: 'from-indigo-500/25 via-purple-500/20 to-pink-500/15 border-purple-400/50',
};

export function getGiftEmoji(gift) {
  if (!gift?.name) return '🎁';
  return GIFT_EMOJI[gift.name] ?? '🎁';
}

export function getGiftCardTheme(level) {
  if (!level) return 'from-white/10 to-white/5 border-white/20';
  return GIFT_LEVEL_THEME[level] ?? 'from-white/10 to-white/5 border-white/20';
}
