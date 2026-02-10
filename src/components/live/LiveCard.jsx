import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Eye } from 'lucide-react';

function Avatar({ host, size = 56 }) {
  const src = host?.profilePic;
  const name = host?.name || 'Host';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center text-white font-semibold shrink-0 ring-2 ring-white/80 ring-offset-2 ring-offset-[#0f0f0f]"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        fontSize: size * 0.4,
      }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

export function LiveCard({ live, index = 0 }) {
  const host = live?.host ?? {};
  const viewerCount = live?.viewerCount ?? 0;
  const title = live?.title || 'Live now';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={`/app/live/${live?.id}`}
        className="block rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 hover:border-pink-500/50 transition-all duration-300 group"
      >
        {/* Thumbnail area – gradient or thumbnail */}
        <div className="relative aspect-[4/5] min-h-[200px] bg-gradient-to-br from-violet-900/40 via-[#1a1a1a] to-fuchsia-900/30 overflow-hidden">
          {live?.thumbnailUrl ? (
            <img
              src={live.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <Radio className="w-10 h-10 text-pink-400" />
              </div>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {/* LIVE badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Live
          </div>
          {/* Viewer count */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white text-sm">
            <Eye className="w-4 h-4" />
            <span>{viewerCount >= 1000 ? `${(viewerCount / 1000).toFixed(1)}K` : viewerCount}</span>
          </div>
          {/* Host at bottom */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
            <Avatar host={host} size={44} />
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold truncate">{host?.name || 'Host'}</p>
              <p className="text-white/80 text-sm truncate">{title}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
