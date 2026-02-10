import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, ArrowLeft, Phone, Video } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getConversations, getConversation, sendMessage, markConversationRead } from '@/lib/api/messages';
import { initiateCall } from '@/lib/api/calls';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { formatPostTime } from '@/lib/utils/dateUtils';
import '@/styles/user-app.css';

export default function Messages() {
  const { user: currentUser } = useAuthStore();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await getConversations();
      setConversations(Array.isArray(list) ? list : []);
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadConversations().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadConversations]);

  const loadMessages = useCallback(async (otherUserId) => {
    if (!otherUserId) return;
    setMessagesLoading(true);
    try {
      await markConversationRead(otherUserId);
      const list = await getConversation(otherUserId);
      const arr = Array.isArray(list) ? list : [];
      setMessages(arr.reverse());
      loadConversations();
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [loadConversations]);

  useEffect(() => {
    if (selectedUser) loadMessages(selectedUser.id);
  }, [selectedUser?.id, loadMessages]);

  // Open chat with user when navigating from profile (Message button)
  useEffect(() => {
    const openUser = location.state?.openUser;
    if (openUser?.id) setSelectedUser(openUser);
  }, [location.state?.openUser?.id]);

  const handleSend = async () => {
    if (!selectedUser?.id || !draft.trim() || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft('');
    try {
      const msg = await sendMessage(selectedUser.id, text);
      setMessages((prev) => [...prev, { ...msg, isMe: true }]);
      loadConversations();
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const handleCall = async (type) => {
    if (!selectedUser?.id || calling) return;
    const receiverId = String(selectedUser.id);
    if (!receiverId || receiverId === 'undefined') return;
    setCalling(type);
    try {
      const call = await initiateCall(receiverId, type);
      if (call?.roomId) {
        const params = new URLSearchParams({
          room: call.roomId,
          type,
          role: 'caller',
          ...(call.id && { callId: call.id }),
          ...(receiverId && { peerUserId: receiverId }),
        });
        const url = `${window.location.origin}/app/call?${params}`;
        window.open(url, '_blank', 'width=600,height=500');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Call failed';
      console.error('Call failed:', msg, err);
      alert(msg);
    } finally {
      setCalling(null);
    }
  };

  const openUser = location.state?.openUser;
  const listFromConversations = conversations.map((c) => ({
    user: {
      id: c.otherUserId,
      name: c.otherUserName ?? 'Unknown',
      profilePic: c.otherUserProfilePic,
    },
    lastMessage: c.lastMessageContent,
    lastMessageAt: c.lastMessageAt,
    unread: c.unreadCount ?? 0,
  }));
  const list =
    openUser?.id && !listFromConversations.some((item) => String(item.user.id) === String(openUser.id))
      ? [{ user: openUser, lastMessage: null, lastMessageAt: null, unread: 0 }, ...listFromConversations]
      : listFromConversations;

  return (
    <div className={`messages-page ${selectedUser ? 'messages-mobile-chat-open' : ''}`}>
      <div className="messages-sidebar">
        <div className="messages-conversations-header">Conversations</div>
        {loading ? (
          <p className="messages-loading">Loading…</p>
        ) : list.length === 0 ? (
          <p className="messages-empty">No conversations yet. Start a chat from someone's profile.</p>
        ) : (
          <ul className="messages-conversation-list">
            {list.map(({ user, lastMessage, lastMessageAt, unread }) => (
              <li key={user.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`messages-conversation-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => setSelectedUser(user)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedUser(user)}
                >
                  <div className="messages-conv-avatar-wrap" onClick={(e) => e.stopPropagation()}>
                    <UserProfileMenu user={user} avatarSize={44} showName={false} />
                  </div>
                  <div className="messages-conv-meta">
                    <span className="messages-conv-name">{user.name}</span>
                    <span className="messages-conv-preview">{lastMessage || 'Start chat'}</span>
                  </div>
                  <div className="messages-conv-right">
                    {lastMessageAt && <span className="messages-conv-time">{formatPostTime(lastMessageAt)}</span>}
                    {unread > 0 && <span className="messages-conv-unread">{unread}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="messages-chat-panel">
        {selectedUser ? (
          <>
            <div className="messages-chat-header">
              <button
                type="button"
                className="messages-chat-back"
                onClick={() => setSelectedUser(null)}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={24} />
              </button>
              <UserProfileMenu user={selectedUser} avatarSize={40} showName={false} className="messages-chat-header-avatar-wrap" />
              <span className="messages-chat-header-name">{selectedUser.name}</span>
              <div className="messages-chat-header-actions">
                <button
                  type="button"
                  className="messages-chat-call-btn"
                  onClick={() => handleCall('VOICE')}
                  disabled={!!calling}
                  title="Voice call"
                  aria-label="Voice call"
                >
                  <Phone size={20} />
                </button>
                <button
                  type="button"
                  className="messages-chat-call-btn"
                  onClick={() => handleCall('VIDEO')}
                  disabled={!!calling}
                  title="Video call"
                  aria-label="Video call"
                >
                  <Video size={20} />
                </button>
              </div>
            </div>
            <div className="messages-chat-messages">
              {messagesLoading ? (
                <p className="messages-loading">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="messages-empty-inline">No messages yet. Say hi!</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`messages-bubble ${msg.isMe ? 'from-me' : ''}`}>
                    <span className="messages-bubble-text">{msg.content}</span>
                    <span className="messages-bubble-time">
                      {msg.createdAt ? formatPostTime(msg.createdAt) : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="messages-chat-input-wrap">
              <input
                type="text"
                className="messages-chat-input"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <button type="button" className="messages-chat-send" onClick={handleSend} disabled={!draft.trim() || sending} aria-label="Send">
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
