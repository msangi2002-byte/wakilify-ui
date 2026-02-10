import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, RefreshCw } from 'lucide-react';
import { LiveCard } from '@/components/live/LiveCard';
import { getActiveLives } from '@/lib/api/live';

export default function Live() {
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLives = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getActiveLives(24);
      setLives(list);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Could not load lives');
      setLives([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLives();
    const t = setInterval(fetchLives, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0f0f0f]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Live</h1>
              <p className="text-sm text-white/60">Watch streams live now</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchLives}
            disabled={loading}
            className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm"
          >
            {error}
          </motion.div>
        )}

        {loading && lives.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl aspect-[4/5] bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : lives.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Radio className="w-12 h-12 text-white/40" />
            </div>
            <h2 className="text-lg font-semibold text-white/90 mb-1">No one is live</h2>
            <p className="text-white/50 text-sm max-w-xs">
              When someone starts a live stream, it will show up here.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {lives.map((live, i) => (
              <LiveCard key={live?.id ?? i} live={live} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
