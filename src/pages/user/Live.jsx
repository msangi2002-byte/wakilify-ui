import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, RefreshCw, Video, X, History, Flame, Music, Gamepad2, Mic, Users, Play } from 'lucide-react';
import { LiveCard } from '@/components/live/LiveCard';
import { getActiveLives, startLive, getMyStreams } from '@/lib/api/live';
import { useAuthStore } from '@/store/auth.store';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Flame },
  { id: 'just_chatting', label: 'Chatting', icon: Mic },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'irl', label: 'IRL', icon: Users },
];

export default function Live() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lives, setLives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Go live modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Camera Preview
  const previewVideoRef = useRef(null);
  const streamRef = useRef(null);

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

  // Featured Stream Logic (pick the one with most viewers)
  const featuredStream = lives.length > 0 ? [...lives].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0))[0] : null;
  const otherStreams = featuredStream ? lives.filter(l => l.id !== featuredStream.id) : [];

  const handleOpenModal = async () => {
    setCreateError(null);
    setTitle('');
    setDescription('');
    setModalOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      // We don't error out the modal, just no preview
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Also cleanup on unmount if modal was open
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // When modal becomes true, we might need a small delay or effect to attach ref if it wasn't rendered yet
  useEffect(() => {
    if (modalOpen && streamRef.current && previewVideoRef.current) {
      previewVideoRef.current.srcObject = streamRef.current;
    }
  }, [modalOpen]);


  const handleStartLive = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim() || 'My live';
    setCreating(true);
    setCreateError(null);
    try {
      const stream = await startLive({ title: trimmedTitle, description: description.trim() || '' });
      handleCloseModal(); // Clean up stream before navigating
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
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505] pb-24 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-600 shadow-lg shadow-pink-500/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Live</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMyStreamsOpen(!myStreamsOpen)}
              className="p-2.5 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all active:scale-95"
              title="History"
            >
              <History size={20} />
            </button>
            <button
              onClick={fetchLives}
              disabled={loading}
              className={`p-2.5 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all active:scale-95 ${loading ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white font-bold text-sm hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Go Live</span>
            </button>
          </div>
        </div>

        {/* Categories Scroll */}
        <div className="border-t border-gray-100 py-3 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 flex gap-3 min-w-max">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                            flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border
                            ${activeCategory === cat.id
                    ? 'bg-black text-white border-black shadow-lg shadow-black/10'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900'}
                        `}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* My Streams Panel */}
        <AnimatePresence>
          {myStreamsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 bg-white overflow-hidden"
            >
              <div className="max-w-7xl mx-auto p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Your Recent Streams</h3>
                  <button onClick={() => setMyStreamsOpen(false)}><X size={16} className="text-gray-400 hover:text-gray-900" /></button>
                </div>
                {myStreamsLoading ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-48 h-28 rounded-xl bg-gray-100 animate-pulse shrink-0" />)}
                  </div>
                ) : myStreams.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No stream history found.</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {myStreams.map(s => (
                      <div key={s.id} onClick={() => navigate(`/app/live/${s.id}`)} className="cursor-pointer shrink-0 w-56 group">
                        <div className="aspect-video rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative mb-2 group-hover:border-gray-300 transition-colors">
                          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'LIVE' ? 'bg-red-500 text-white' : 'bg-black/50 text-white/70'}`}>
                            {s.status}
                          </div>
                        </div>
                        <p className="text-sm font-bold truncate text-gray-900 group-hover:text-pink-600 transition-colors">{s.title || 'Untitled Stream'}</p>
                        <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && lives.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center mb-6 ring-1 ring-gray-200 shadow-xl">
              <Radio size={40} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No active streams</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Be the first to start a live stream and build your audience!</p>
            <button
              onClick={handleOpenModal}
              className="px-8 py-4 rounded-full bg-black text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Start Broadcast
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && lives.length > 0 && (
          <div className="animate-fade-in space-y-8">
            {/* Hero / Featured */}
            {featuredStream && (
              <section className="relative rounded-3xl overflow-hidden aspect-video md:aspect-[21/9] group cursor-pointer border border-gray-200 hover:border-gray-300 transition-all shadow-2xl" onClick={() => navigate(`/app/live/${featuredStream.id}`)}>
                <div className="absolute inset-0 bg-gray-900">
                  {featuredStream.thumbnailUrl ? (
                    <img src={featuredStream.thumbnailUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black" />
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />

                <div className="absolute top-4 left-4 z-20">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 animate-pulse shadow-lg shadow-red-600/20">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    LIVE NOW
                  </span>
                </div>

                <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <Users size={14} className="text-pink-500" />
                  <span className="text-xs font-bold text-white">{featuredStream.viewerCount || 0} watching</span>
                </div>

                <div className="absolute bottom-0 left-0 p-6 md:p-10 z-20 w-full md:w-2/3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 to-violet-500">
                      <img src={featuredStream.host?.profilePic} className="w-full h-full rounded-full object-cover border-2 border-black" />
                    </div>
                    <div>
                      <span className="font-bold text-white block text-lg leading-none mb-1">{featuredStream.host?.name}</span>
                      <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Host</span>
                    </div>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 drop-shadow-xl">{featuredStream.title || 'Untitled Stream'}</h3>
                  <p className="text-white/70 line-clamp-2 mb-6 max-w-xl text-lg hidden md:block">{featuredStream.description || 'Join the conversation!'}</p>

                  <button className="px-8 py-3.5 bg-white text-black rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-lg shadow-white/10">
                    <Play size={20} fill="currentColor" /> Watch Stream
                  </button>
                </div>
              </section>
            )}

            {/* Grid */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Flame className="text-orange-500" size={24} />
                  Recommended Channels
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {(lives.length > 0 ? (otherStreams.length > 0 ? otherStreams : lives) : []).map((live, i) => (
                  <LiveCard key={live.id} live={live} index={i} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* NEW IMPROVED GO LIVE MODAL (LIGHT THEME) */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => !creating && handleCloseModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-4xl rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh] md:h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Side: Camera Preview (Keep Dark) */}
              <div className="md:w-1/2 bg-black relative flex items-center justify-center overflow-hidden h-1/2 md:h-auto border-b md:border-b-0 md:border-r border-gray-100">
                {/* Real Camera Preview */}
                <video
                  ref={previewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                />

                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Camera Active
                  </div>
                </div>

                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 pointer-events-auto">
                  <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors" title="Mute Mic">
                    <Mic size={20} />
                  </button>
                  <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors" title="Turn off Camera">
                    <Video size={20} />
                  </button>
                </div>
              </div>

              {/* Right Side: Details Form (Light Theme) */}
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col h-1/2 md:h-[600px] overflow-y-auto custom-scrollbar bg-white text-gray-900">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Go Live</h2>
                  <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleStartLive} className="space-y-6 flex-1 flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stream Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give your stream a catchy title..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-semibold"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell viewers what you're doing..."
                        rows={4}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.slice(1).map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 transition-all"
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {createError && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                      {createError}
                    </div>
                  )}

                  <div className="pt-4 mt-auto">
                    <button
                      type="submit"
                      disabled={creating}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-pink-500/20 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creating ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" /> Starting...
                        </>
                      ) : (
                        <>
                          <Video size={20} /> Start Live Stream
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">
                      By going live, you agree to our <a href="#" className="underline hover:text-gray-600">Community Guidelines</a>.
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
