import { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

export function LiveChat({
    messages = [],
    onSendMessage,
    isTransparent = true, // Transparent on mobile/overlay, solid on desktop sidebar
    showInput = true,
    className = ''
}) {
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSendMessage?.(text);
        setText('');
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto px-4 py-2 space-y-3 scrollbar-hide mask-image-linear-to-t ${isTransparent ? 'text-shadow-sm' : ''}`}>
                {messages.length === 0 && (
                    <div className={`h-full flex flex-col items-center justify-center text-sm ${isTransparent ? 'text-white/50' : 'text-gray-400'}`}>
                        <p>Welcome to the chat!</p>
                        <p className="text-xs">Say hi to everyone 👋</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-2 ${isTransparent ? 'text-white' : 'text-gray-900'}`}>
                        <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border ${isTransparent ? 'border-white/20' : 'border-gray-200'} bg-gray-100`}>
                            {msg.user?.profilePic ? (
                                <img src={msg.user.profilePic} alt={msg.user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-violet-500 font-bold text-xs text-white">
                                    {msg.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                                <span className={`font-semibold text-sm truncate ${isTransparent ? 'opacity-90' : 'text-gray-900'}`}>{msg.user?.name}</span>
                                {msg.user?.isHost && (
                                    <span className="text-[10px] bg-pink-500 px-1.5 py-0.5 rounded text-white font-bold">HOST</span>
                                )}
                            </div>
                            <p className={`text-sm leading-tight break-words font-medium ${isTransparent ? 'opacity-95 text-shadow-sm' : 'text-gray-700'}`}>
                                {msg.text}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            {showInput && (
                <form onSubmit={handleSubmit} className={`p-3 ${isTransparent ? '' : 'border-t border-gray-200 bg-white'}`}>
                    <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${isTransparent ? 'bg-black/40 backdrop-blur-md border border-white/10' : 'bg-gray-100 border border-transparent focus-within:bg-white focus-within:border-pink-500/50 focus-within:ring-2 focus-within:ring-pink-500/20 transition-all'}`}>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Say something..."
                            className={`flex-1 bg-transparent border-none outline-none text-sm ${isTransparent ? 'text-white placeholder-white/50' : 'text-gray-900 placeholder-gray-500'}`}
                        />
                        <button
                            type="button"
                            className={`${isTransparent ? 'text-white/70 hover:text-pink-400' : 'text-gray-400 hover:text-pink-600'} transition-colors`}
                        >
                            <Smile size={20} />
                        </button>
                        <button
                            type="submit"
                            disabled={!text.trim()}
                            className={`${isTransparent ? 'text-white/90 hover:text-pink-500' : 'text-pink-600 hover:text-pink-700'} disabled:opacity-50 transition-colors`}
                        >
                            <Send size={18} className={text.trim() ? "translate-x-0.5" : ""} />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
