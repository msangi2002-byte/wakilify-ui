import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, Phone, Video, Mic, Reply, X, Paperclip, Image as ImageIcon, FileText, MapPin, Sticker } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getConversations, getConversation, sendMessage, markConversationRead, uploadMessageMedia } from '@/lib/api/messages';
import { initiateCall } from '@/lib/api/calls';
import { UserProfileMenu } from '@/components/ui/UserProfileMenu';
import { formatPostTime } from '@/lib/utils/dateUtils';
import { MessagesListSkeleton } from '@/components/ui/MessagesListSkeleton';
import { MessagesChatSkeleton } from '@/components/ui/MessagesChatSkeleton';
import '@/styles/user-app.css';

export default function Messages() {
  const STICKERS = ['😀', '😂', '😍', '🔥', '👍', '🎉', '❤️', '🙏', '😎', '🥳', '🤝', '💯'];
  const { user: currentUser } = useAuthStore();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [replyTo, setReplyTo] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const pendingVoiceActionRef = useRef('send');
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [sendingAttachment, setSendingAttachment] = useState(false);

  const currentUserId = currentUser?.id;

  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: () => getConversations(),
    select: (list) => Array.isArray(list) ? list : [],
    refetchInterval: 4000,
  });

  const { data: messages = [], isPending: messagesLoading } = useQuery({
    queryKey: ['messages', 'conversation', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return [];
      await markConversationRead(selectedUser.id);
      const list = await getConversation(selectedUser.id);
      const arr = Array.isArray(list) ? list : [];
      const withIsMe = arr.map((m) => ({
        ...m,
        isMe: String(m.senderId || m.sender?.id || '') === String(currentUserId || '') || m.isMe,
      }));
      return [...withIsMe].reverse();
    },
    enabled: !!selectedUser?.id,
    refetchInterval: 3000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open chat with user when navigating from profile or story quick reply
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
      const newMsg = { ...msg, isMe: true };
      queryClient.setQueryData(['messages', 'conversation', selectedUser.id], (prev = []) => [...prev, newMsg]);
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    } catch {
      setDraft(text);
      if (replyToId) setReplyTo({ id: replyToId, content: text, senderName: currentUser?.name });
    } finally {
      setSending(false);
    }
  };

  const appendMessageToConversation = useCallback((userId, msg) => {
    const newMsg = { ...msg, isMe: true };
    queryClient.setQueryData(['messages', 'conversation', userId], (prev = []) => [...prev, newMsg]);
    queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
  }, [queryClient]);

  const sendMediaAttachment = useCallback(async (file, type, fallbackText = '') => {
    if (!selectedUser?.id || !file || sending || sendingAttachment) return;
    const replyToId = replyTo?.id;
    setReplyTo(null);
    setSendingAttachment(true);
    setShowAttachMenu(false);
    setShowStickerPicker(false);
    try {
      const url = await uploadMessageMedia(file);
      const msg = await sendMessage(selectedUser.id, fallbackText, { type, mediaUrl: url, ...(replyToId && { replyToId }) });
      appendMessageToConversation(selectedUser.id, msg);
    } catch (err) {
      console.error(`Failed to send ${type} attachment`, err);
      alert(`Failed to send ${type.toLowerCase()} attachment.`);
    } finally {
      setSendingAttachment(false);
    }
  }, [selectedUser?.id, sending, sendingAttachment, replyTo?.id, appendMessageToConversation]);

  const handleAttachmentSelected = useCallback((type) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const fallbackText = type === 'DOCUMENT' ? file.name : '';
    await sendMediaAttachment(file, type, fallbackText);
  }, [sendMediaAttachment]);

  const handleSendLocation = useCallback(() => {
    if (!selectedUser?.id || sending || sendingAttachment) return;
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    setShowAttachMenu(false);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        try {
          const msg = await sendMessage(selectedUser.id, `📍 My location: ${mapsUrl}`);
          appendMessageToConversation(selectedUser.id, msg);
        } catch (err) {
          console.error('Failed to send location', err);
          alert('Failed to send location.');
        }
      },
      () => alert('Unable to get your location. Please allow location permission and try again.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [selectedUser?.id, sending, sendingAttachment, appendMessageToConversation]);

  const handleSendSticker = useCallback(async (sticker) => {
    if (!selectedUser?.id || !sticker || sending || sendingAttachment) return;
    setShowStickerPicker(false);
    setShowAttachMenu(false);
    const replyToId = replyTo?.id;
    setReplyTo(null);
    try {
      const msg = await sendMessage(selectedUser.id, sticker, replyToId ? { replyToId } : {});
      appendMessageToConversation(selectedUser.id, msg);
    } catch (err) {
      console.error('Failed to send sticker', err);
      alert('Failed to send sticker.');
    }
  }, [selectedUser?.id, sending, sendingAttachment, replyTo?.id, appendMessageToConversation]);

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
          const newMsg = { ...msg, isMe: true };
          queryClient.setQueryData(['messages', 'conversation', selectedUser.id], (prev = []) => [...prev, newMsg]);
          queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
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
          <MessagesListSkeleton rows={6} />
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
                <MessagesChatSkeleton />
              ) : messages.length === 0 ? (
                <p className="messages-empty-inline">No messages yet. Say hi!</p>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    id={`message-${msg.id}`}
                    ref={(el) => {
                      if (el) messageRefs.current[msg.id] = el;
                    }}
                    className={`messages-bubble ${msg.isMe ? 'from-me' : ''}`}
                  >
                    {msg.replyTo && (
                      <div 
                        className="messages-reply-preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (msg.replyTo?.id) {
                            const targetId = msg.replyTo.id;
                            const targetMessage = messageRefs.current[targetId] || document.getElementById(`message-${targetId}`);
                            if (targetMessage) {
                              targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              // Highlight the target message briefly
                              const originalBg = targetMessage.style.backgroundColor;
                              targetMessage.style.transition = 'background-color 0.3s';
                              targetMessage.style.backgroundColor = targetMessage.classList.contains('from-me') 
                                ? 'rgba(255, 255, 255, 0.2)' 
                                : 'rgba(124, 58, 237, 0.15)';
                              setTimeout(() => {
                                targetMessage.style.backgroundColor = originalBg;
                                setTimeout(() => {
                                  targetMessage.style.transition = '';
                                }, 300);
                              }, 1500);
                            }
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Click to jump to original message"
                      >
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
                    ) : (msg.type === 'IMAGE' && msg.mediaUrl) ? (
                      <div className="messages-media-wrap">
                        <img src={msg.mediaUrl} alt="Shared" className="messages-media-image" loading="lazy" />
                        <span className="messages-bubble-time">{msg.createdAt ? formatPostTime(msg.createdAt) : ''}</span>
                      </div>
                    ) : (msg.type === 'VIDEO' && msg.mediaUrl) ? (
                      <div className="messages-media-wrap">
                        <video controls className="messages-media-video" src={msg.mediaUrl} />
                        <span className="messages-bubble-time">{msg.createdAt ? formatPostTime(msg.createdAt) : ''}</span>
                      </div>
                    ) : (msg.type === 'DOCUMENT' && msg.mediaUrl) ? (
                      <div className="messages-media-wrap">
                        <a className="messages-document-link" href={msg.mediaUrl} target="_blank" rel="noreferrer">
                          <FileText size={16} />
                          <span>{msg.content || 'Open document'}</span>
                        </a>
                        <span className="messages-bubble-time">{msg.createdAt ? formatPostTime(msg.createdAt) : ''}</span>
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
                  <div className="messages-chat-attach-wrap">
                    <button
                      type="button"
                      className="messages-chat-attach-btn"
                      onClick={() => {
                        setShowAttachMenu((v) => !v);
                        setShowStickerPicker(false);
                      }}
                      disabled={sending || sendingAttachment}
                      title="Attach"
                      aria-label="Attach"
                    >
                      <Paperclip size={20} />
                    </button>
                    {showAttachMenu && (
                      <div className="messages-attach-menu">
                        <button type="button" className="messages-attach-item" onClick={() => imageInputRef.current?.click()}>
                          <ImageIcon size={16} />
                          <span>Image</span>
                        </button>
                        <button type="button" className="messages-attach-item" onClick={() => videoInputRef.current?.click()}>
                          <Video size={16} />
                          <span>Video</span>
                        </button>
                        <button type="button" className="messages-attach-item" onClick={() => documentInputRef.current?.click()}>
                          <FileText size={16} />
                          <span>Document</span>
                        </button>
                        <button type="button" className="messages-attach-item" onClick={handleSendLocation}>
                          <MapPin size={16} />
                          <span>Location</span>
                        </button>
                        <button
                          type="button"
                          className="messages-attach-item"
                          onClick={() => {
                            setShowStickerPicker((v) => !v);
                          }}
                        >
                          <Sticker size={16} />
                          <span>Sticker</span>
                        </button>
                      </div>
                    )}
                    {showStickerPicker && (
                      <div className="messages-sticker-picker">
                        {STICKERS.map((sticker) => (
                          <button
                            key={sticker}
                            type="button"
                            className="messages-sticker-btn"
                            onClick={() => handleSendSticker(sticker)}
                            aria-label={`Send sticker ${sticker}`}
                          >
                            {sticker}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="messages-hidden-input"
                      onChange={handleAttachmentSelected('IMAGE')}
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="messages-hidden-input"
                      onChange={handleAttachmentSelected('VIDEO')}
                    />
                    <input
                      ref={documentInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv"
                      className="messages-hidden-input"
                      onChange={handleAttachmentSelected('DOCUMENT')}
                    />
                  </div>
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
