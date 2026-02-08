import { useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

// Mock data – replace with API later
const ONLINE_USERS = [
  { id: '1', name: 'Sarah M.' },
  { id: '2', name: 'Juma K.' },
  { id: '3', name: 'Amina H.' },
  { id: '4', name: 'Peter O.' },
  { id: '5', name: 'Grace K.' },
];

const MOCK_CONVERSATIONS = [
  { id: '1', user: { id: '1', name: 'Sarah M.' }, lastMessage: 'Thanks for the link!', time: '2m', unread: 1 },
  { id: '2', user: { id: '2', name: 'Juma K.' }, lastMessage: 'See you tomorrow', time: '1h', unread: 0 },
  { id: '3', user: { id: '3', name: 'Amina H.' }, lastMessage: 'Is this still available?', time: '3h', unread: 0 },
  { id: '4', user: { id: '4', name: 'Peter O.' }, lastMessage: 'Sure, we can meet at 5pm', time: 'Yesterday', unread: 0 },
  { id: '5', user: { id: '5', name: 'Grace K.' }, lastMessage: 'You sent a photo', time: 'Mon', unread: 0 },
];

const MOCK_MESSAGES = {
  '1': [
    { id: 'm1', fromMe: false, text: 'Hi! Is the item still available?', time: '10:30' },
    { id: 'm2', fromMe: true, text: 'Yes it is. You can pick it up today.', time: '10:32' },
    { id: 'm3', fromMe: false, text: 'Thanks for the link!', time: '10:35' },
  ],
  '2': [
    { id: 'm4', fromMe: true, text: 'Hey, are we still on for tomorrow?', time: '09:00' },
    { id: 'm5', fromMe: false, text: 'See you tomorrow', time: '09:05' },
  ],
};

function Avatar({ user, size = 40, className = '', showOnline }) {
  const name = user?.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #7c3aed, #d946ef)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.4,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {user?.profilePic ? <img src={user.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
      {showOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#31a24c',
            border: '2px solid #fff',
          }}
        />
      )}
    </div>
  );
}

export default function Messages() {
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [messagesByConv, setMessagesByConv] = useState(MOCK_MESSAGES);

  const selected = selectedId ? MOCK_CONVERSATIONS.find((c) => c.id === selectedId) : null;
  const messages = selectedId ? (messagesByConv[selectedId] || []) : [];

  const sendMessage = () => {
    if (!selectedId || !draft.trim()) return;
    const newMsg = {
      id: `new-${Date.now()}`,
      fromMe: true,
      text: draft.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    setMessagesByConv((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg],
    }));
    setDraft('');
  };

  return (
    <div className={`messages-page ${selected ? 'messages-mobile-chat-open' : ''}`}>
      <div className="messages-sidebar">
        <div className="messages-online-row">
          <span className="messages-online-label">Online</span>
          <div className="messages-online-avatars">
            {ONLINE_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                className="messages-online-avatar-wrap"
                onClick={() => setSelectedId(u.id)}
                title={u.name}
              >
                <Avatar user={u} size={48} showOnline />
                <span className="messages-online-name">{u.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="messages-conversations-header">Conversations</div>
        <ul className="messages-conversation-list">
          {MOCK_CONVERSATIONS.map((conv) => (
            <li key={conv.id}>
              <button
                type="button"
                className={`messages-conversation-item ${selectedId === conv.id ? 'active' : ''}`}
                onClick={() => setSelectedId(conv.id)}
              >
                <Avatar user={conv.user} size={44} showOnline={ONLINE_USERS.some((o) => o.id === conv.user.id)} />
                <div className="messages-conv-meta">
                  <span className="messages-conv-name">{conv.user.name}</span>
                  <span className="messages-conv-preview">{conv.lastMessage}</span>
                </div>
                <div className="messages-conv-right">
                  <span className="messages-conv-time">{conv.time}</span>
                  {conv.unread > 0 && <span className="messages-conv-unread">{conv.unread}</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="messages-chat-panel">
        {selected ? (
          <>
            <div className="messages-chat-header">
              <button
                type="button"
                className="messages-chat-back"
                onClick={() => setSelectedId(null)}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={24} />
              </button>
              <Avatar user={selected.user} size={40} className="messages-chat-header-avatar" />
              <span className="messages-chat-header-name">{selected.user.name}</span>
            </div>
            <div className="messages-chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`messages-bubble ${msg.fromMe ? 'from-me' : ''}`}>
                  <span className="messages-bubble-text">{msg.text}</span>
                  <span className="messages-bubble-time">{msg.time}</span>
                </div>
              ))}
            </div>
            <div className="messages-chat-input-wrap">
              <input
                type="text"
                className="messages-chat-input"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button type="button" className="messages-chat-send" onClick={sendMessage} aria-label="Send">
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="messages-chat-empty">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
