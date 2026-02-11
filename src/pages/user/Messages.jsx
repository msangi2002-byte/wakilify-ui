import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, ArrowLeft, Phone, Video, Mic, Square, Reply, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getConversations, getConversation, sendMessage, markConversationRead, uploadMessageMedia } from '@/lib/api/messages';
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
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [replyTo, setReplyTo] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pendingVoiceActionRef = useRef('send');

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

  // Auto-refresh conversations list in background (real-time feel)
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const currentUserId = currentUser?.id;

  const loadMessages = useCallback(async (otherUserId, isBackgroundRefresh = false) => {
    if (!otherUserId) return;
    if (!isBackgroundRefresh) setMessagesLoading(true);
    try {
      if (!isBackgroundRefresh) await markConversationRead(otherUserId);
      const list = await getConversation(otherUserId);
      const arr = Array.isArray(list) ? list : [];
      const withIsMe = arr.map((m) => ({
        ...m,
        isMe: String(m.senderId || m.sender?.id || '') === String(currentUserId || '') || m.isMe,
      }));
      const oldestFirst = [...withIsMe].reverse();
      setMessages(oldestFirst);
      if (!isBackgroundRefresh) loadConversations();
    } catch {
      if (!isBackgroundRefresh) setMessages([]);
    } finally {
      if (!isBackgroundRefresh) setMessagesLoading(false);
    }
  }, [loadConversations, currentUserId]);

  useEffect(() => {
    if (selectedUser) loadMessages(selectedUser.id);
  }, [selectedUser?.id, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time chat: poll messages for open conversation so new messages appear automatically
  useEffect(() => {
    if (!selectedUser?.id || !currentUserId) return;
    const interval = setInterval(() => {
      loadMessages(selectedUser.id, true);
      loadConversations();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedUser?.id, currentUserId, loadMessages, loadConversations]);

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
    const replyToId = replyTo?.id;
    setReplyTo(null);
    try {
      const msg = await sendMessage(selectedUser.id, text, replyToId ? { replyToId } : {});
      setMessages((prev) => [...prev, { ...msg, isMe: true }]);
      loadConversations();
    } catch {
      setDraft(text);
      if (replyToId) setReplyTo({ id: replyToId, content: text, senderName: currentUser?.name });
    } finally {
      setSending(false);
    }
  };

  const startRecording = useCallback(async () => {
    if (!selectedUser?.id || recording || sending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (pendingVoiceActionRef.current === 'cancel') return;
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: mimeType });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        const replyToId = replyTo?.id;
        setReplyTo(null);
        setSending(true);
        try {
          const url = await uploadMessageMedia(file);
          const msg = await sendMessage(selectedUser.id, '', { type: 'VOICE', mediaUrl: url, ...(replyToId && { replyToId }) });
          setMessages((prev) => [...prev, { ...msg, isMe: true }]);
          loadConversations();
        } catch {
          // ignore
        } finally {
          setSending(false);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = { recorder, stream };
      setRecording(true);
      setRecordingSeconds(0);
      recordingIntervalRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch (err) {
      console.error('Microphone access failed:', err);
      alert('Cannot access microphone. Allow microphone permission for voice notes.');
    }
  }, [selectedUser?.id, recording, sending, replyTo?.id]);

  const stopRecording = useCallback(() => {
    if (!recording || !mediaRecorderRef.current?.recorder) return;
    pendingVoiceActionRef.current = 'send';
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    mediaRecorderRef.current.recorder.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
    setRecordingSeconds(0);
  }, [recording]);

  const cancelRecording = useCallback(() => {
    if (!recording || !mediaRecorderRef.current?.recorder) return;
    pendingVoiceActionRef.current = 'cancel';
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    mediaRecorderRef.current.recorder.stop();
    mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    setRecording(false);
    setRecordingSeconds(0);
  }, [recording]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current?.recorder?.state === 'recording') {
        mediaRecorderRef.current.recorder.stop();
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
                    {msg.replyTo && (
                      <div className="messages-reply-preview">
                        <span className="messages-reply-name">{msg.replyTo.senderName}</span>
                        <span className="messages-reply-text">{msg.replyTo.content || '📎 Media'}</span>
                      </div>
                    )}
                    {(msg.type === 'VOICE' && msg.mediaUrl) ? (
                      <div className="messages-voice-wrap">
                        <audio controls src={msg.mediaUrl} className="messages-voice-player" />
                        <span className="messages-bubble-time messages-voice-time">
                          {msg.createdAt ? formatPostTime(msg.createdAt) : ''}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="messages-bubble-text">{msg.content}</span>
                        <span className="messages-bubble-time">
                          {msg.createdAt ? formatPostTime(msg.createdAt) : ''}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      className="messages-bubble-reply-btn"
                      onClick={() => setReplyTo({ id: msg.id, content: msg.content || (msg.type === 'VOICE' ? 'Voice note' : 'Media'), senderName: msg.senderName })}
                      aria-label="Reply"
                      title="Reply"
                    >
                      <Reply size={14} />
                    </button>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            {replyTo && (
              <div className="messages-reply-bar">
                <div className="messages-reply-bar-content">
                  <Reply size={16} className="messages-reply-bar-icon" />
                  <div>
                    <span className="messages-reply-bar-name">{replyTo.senderName}</span>
                    <span className="messages-reply-bar-text">{replyTo.content}</span>
                  </div>
                </div>
                <button type="button" className="messages-reply-bar-cancel" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="messages-chat-input-wrap">
              {recording ? (
                <div className="messages-voice-recording-bar">
                  <div className="messages-voice-waveform">
                    {[...Array(24)].map((_, i) => (
                      <span key={i} className="messages-voice-bar" style={{ animationDelay: `${i * 0.04}s` }} />
                    ))}
                  </div>
                  <span className="messages-voice-timer">
                    {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="messages-voice-hint">Tap to send</span>
                  <button
                    type="button"
                    className="messages-voice-send-btn"
                    onClick={stopRecording}
                    aria-label="Send voice note"
                  >
                    <Send size={22} />
                  </button>
                  <button
                    type="button"
                    className="messages-voice-cancel-btn"
                    onClick={cancelRecording}
                    aria-label="Cancel"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="messages-chat-voice-btn"
                    onClick={startRecording}
                    disabled={sending}
                    title="Voice note"
                    aria-label="Record voice note"
                  >
                    <Mic size={22} />
                  </button>
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
                </>
              )}
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
