import { useState, useRef, useEffect } from 'react';
import { Send, Smile, User } from 'lucide-react';

export function LiveChat({
    messages = [],
    onSendMessage,
    onAuthorClick,
    isTransparent = false,
    solidBackground = true,
    showInput = true,
    className = ''
}) {
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSendMessage?.(text);
        setText('');
    };

    const isDark = solidBackground || isTransparent;
    const msgAreaClass = `flex-1 overflow-y-auto px-3 py-2 space-y-2.5 scrollbar-thin ${solidBackground ? 'bg-black/95 text-white' : ''} ${isTransparent ? 'text-shadow-sm text-white' : 'text-gray-900'}`;

    return (
        <div className={`flex flex-col h-full ${className}`}>
            <div className={`${msgAreaClass} rounded-t-xl`}>
                {messages.length === 0 && (
                    <div className={`h-full flex flex-col items-center justify-center text-sm ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                        <p>Karibu kwenye chat!</p>
                        <p className="text-xs">Andika ujumbe 👋</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <button
                        key={msg.id}
                        type="button"
                        onClick={() => msg.user?.id && onAuthorClick?.(msg.user)}
                        className={`w-full flex items-start gap-2 text-left rounded-lg p-2 -mx-1 hover:bg-white/10 transition-colors ${!msg.user?.id ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 ${isDark ? 'border-white/30' : 'border-gray-200'} bg-gray-800 flex-shrink-0`}>
                            {msg.user?.profilePic ? (
                                <img src={msg.user.profilePic} alt={msg.user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-violet-500 font-bold text-xs text-white">
                                    {msg.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{msg.user?.name}</span>
                                {msg.user?.isHost && (
                                    <span className="text-[10px] bg-pink-500 px-1.5 py-0.5 rounded text-white font-bold shrink-0">HOST</span>
                                )}
                            </div>
                            <p className={`text-sm leading-tight break-words ${isDark ? 'text-white/95' : 'text-gray-700'}`}>
                                {msg.text}
                            </p>
                        </div>
                        {msg.user?.id && onAuthorClick && (
                            <User className="w-4 h-4 shrink-0 text-white/40 mt-1.5" aria-hidden />
                        )}
                    </button>
                ))}
                <div ref={bottomRef} />
            </div>

            {showInput && (
                <form onSubmit={handleSubmit} className={`p-2.5 ${solidBackground ? 'bg-black/90 border-t border-white/10 rounded-b-xl' : 'border-t border-gray-200 bg-white'}`}>
                    <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${solidBackground ? 'bg-white/10 border border-white/20 focus-within:border-pink-400/50' : 'bg-gray-100 focus-within:bg-white focus-within:border-pink-500/50'} border border-transparent transition-all`}>
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Andika ujumbe..."
                            className={`flex-1 bg-transparent border-none outline-none text-sm ${solidBackground ? 'text-white placeholder-white/50' : 'text-gray-900 placeholder-gray-500'}`}
                        />
                        <button type="button" className={`${solidBackground ? 'text-white/70 hover:text-pink-400' : 'text-gray-400 hover:text-pink-600'} transition-colors`}>
                            <Smile size={20} />
                        </button>
                        <button
                            type="submit"
                            disabled={!text.trim()}
                            className={`${solidBackground ? 'text-white hover:text-pink-400' : 'text-pink-600'} disabled:opacity-50 transition-colors`}
                        >
                            <Send size={18} className={text.trim() ? 'translate-x-0.5' : ''} />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
