import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, RefreshCw, Video, X, History } from 'lucide-react';
import { LiveCard } from '@/components/live/LiveCard';
import { getActiveLives, startLive, getMyStreams } from '@/lib/api/live';

export default function Live() {
  const navigate = useNavigate();
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Go live modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // My streams panel
  const [myStreamsOpen, setMyStreamsOpen] = useState(false);
  const [myStreams, setMyStreams] = useState([]);
  const [myStreamsLoading, setMyStreamsLoading] = useState(false);

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

  const fetchMyStreams = async () => {
    setMyStreamsLoading(true);
    try {
      const res = await getMyStreams(0, 10);
      setMyStreams(res?.content ?? []);
    } catch {
      setMyStreams([]);
    } finally {
      setMyStreamsLoading(false);
    }
  };

  useEffect(() => {
    if (myStreamsOpen) fetchMyStreams();
  }, [myStreamsOpen]);

  const handleOpenModal = () => {
    setCreateError(null);
    setTitle('');
    setDescription('');
    setModalOpen(true);
  };

  const handleStartLive = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim() || 'My live';
    setCreating(true);
    setCreateError(null);
    try {
      const stream = await startLive({ title: trimmedTitle, description: description.trim() || '' });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      if (stream?.id) {
        fetchLives();
        navigate(`/app/live/${stream.id}`);
      }
    } catch (e) {
      setCreateError(e?.response?.data?.message || e?.message || 'Could not start live');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0f0f0f]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Live</h1>
              <p className="text-sm text-white/60">Watch streams live now</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMyStreamsOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
            >
              <History className="w-4 h-4" />
              My streams
            </button>
            <button
              type="button"
              onClick={fetchLives}
              disabled={loading}
              className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02]"
            >
              <Video className="w-5 h-5" />
              Go live
            </button>
          </div>
        </div>

        {/* My streams dropdown */}
        <AnimatePresence>
          {myStreamsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 overflow-hidden"
            >
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-white/60">Your recent streams</span>
                <button
                  type="button"
                  onClick={() => setMyStreamsOpen(false)}
                  className="text-white/50 hover:text-white text-sm"
                >
                  Close
                </button>
              </div>
              <div className="max-w-6xl mx-auto px-4 pb-4">
                {myStreamsLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-40 h-24 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : myStreams.length === 0 ? (
                  <p className="text-white/50 text-sm">You haven’t started any live yet.</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {myStreams.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setMyStreamsOpen(false);
                          navigate(`/app/live/${s.id}`);
                        }}
                        className="flex-shrink-0 w-40 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-2 text-left transition-colors"
                      >
                        <p className="text-white font-medium truncate text-sm">{s.title || 'Live'}</p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {s.status === 'LIVE' ? (
                            <span className="text-red-400">● Live</span>
                          ) : (
                            s.status === 'ENDED' ? 'Ended' : s.status
                          )}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <p className="text-white/50 text-sm max-w-xs mb-6">
              When someone starts a live stream, it will show up here. You can start yours now.
            </p>
            <button
              type="button"
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02]"
            >
              <Video className="w-5 h-5" />
              Start your first live
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {lives.map((live, i) => (
              <LiveCard key={live?.id ?? i} live={live} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* Go live modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => !creating && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Go live</h3>
                <button
                  type="button"
                  onClick={() => !creating && setModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleStartLive} className="space-y-4">
                <div>
                  <label htmlFor="live-title" className="block text-sm font-medium text-white/80 mb-1">
                    Title *
                  </label>
                  <input
                    id="live-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chat with viewers"
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label htmlFor="live-desc" className="block text-sm font-medium text-white/80 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="live-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this stream about?"
                    rows={2}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                </div>
                {createError && (
                  <p className="text-sm text-red-400">{createError}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => !creating && setModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Starting…' : 'Start live'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
