import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function timeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ChatPage() {
    const { user, isAdmin } = useAuth();
    const { socket, isConnected, onlineUsers } = useSocket();

    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const [companyInterns, setCompanyInterns] = useState([]);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    // ── Fetch conversations ─────────────────────────────────────────
    const fetchConversations = useCallback(async () => {
        try {
            const res = await API.get('/chat/conversations');
            setConversations(res.data);
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch interns (admin only, for starting new DMs) ────────────
    const fetchInterns = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const res = await API.get('/tasks/interns');
            setCompanyInterns(res.data || []);
        } catch {
            // fallback
            try {
                const res = await API.get('/tasks/admin/intern-progress');
                setCompanyInterns((res.data || []).map((ip) => ({
                    _id: ip.internId,
                    name: ip.internName,
                    email: ip.internEmail || '',
                })));
            } catch { /* ignore */ }
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchConversations();
        fetchInterns();
    }, [fetchConversations, fetchInterns]);

    // ── Fetch messages for active conversation ──────────────────────
    const fetchMessages = useCallback(async (convoId) => {
        setLoadingMsgs(true);
        try {
            const res = await API.get(`/chat/conversations/${convoId}/messages`);
            setMessages(res.data.messages || []);
        } catch {
            setMessages([]);
        } finally {
            setLoadingMsgs(false);
        }
    }, []);

    // ── Open a conversation ─────────────────────────────────────────
    const openConversation = useCallback((convo) => {
        setActiveConvo(convo);
        fetchMessages(convo._id);
        // Join socket room
        if (socket) {
            socket.emit('join-conversations', [convo._id]);
        }
    }, [fetchMessages, socket]);

    // ── Start direct chat (admin) ───────────────────────────────────
    const startDirectChat = useCallback(async (internId) => {
        try {
            const res = await API.post(`/chat/conversations/direct/${internId}`);
            const convo = res.data;
            // Add to list if not already there
            setConversations((prev) => {
                if (prev.find((c) => c._id === convo._id)) return prev;
                return [...prev, convo];
            });
            openConversation(convo);
        } catch { /* ignore */ }
    }, [openConversation]);

    // ── Socket listeners ────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            if (activeConvo && msg.conversationId === activeConvo._id) {
                setMessages((prev) => {
                    if (prev.find((m) => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
            }
            // Update lastMessage in conversation list
            setConversations((prev) =>
                prev.map((c) =>
                    c._id === msg.conversationId
                        ? {
                            ...c,
                            lastMessage: {
                                content: msg.content,
                                sender: msg.sender._id,
                                timestamp: msg.createdAt,
                            },
                        }
                        : c
                )
            );
        };

        const handleTyping = ({ conversationId, userId, name }) => {
            if (userId === user?.id) return;
            setTypingUsers((prev) => ({ ...prev, [conversationId]: name }));
        };

        const handleStopTyping = ({ conversationId }) => {
            setTypingUsers((prev) => {
                const next = { ...prev };
                delete next[conversationId];
                return next;
            });
        };

        socket.on('new-message', handleNewMessage);
        socket.on('new-announcement', handleNewMessage);
        socket.on('user-typing', handleTyping);
        socket.on('user-stop-typing', handleStopTyping);

        // Join all conversation rooms
        if (conversations.length > 0) {
            socket.emit('join-conversations', conversations.map((c) => c._id));
        }

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('new-announcement', handleNewMessage);
            socket.off('user-typing', handleTyping);
            socket.off('user-stop-typing', handleStopTyping);
        };
    }, [socket, activeConvo, conversations, user]);

    // ── Auto-scroll ─────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Send message ────────────────────────────────────────────────
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMsg.trim() || !activeConvo || sending) return;

        const content = newMsg.trim();
        setNewMsg('');
        setSending(true);

        try {
            if (socket && isConnected) {
                socket.emit('send-message', {
                    conversationId: activeConvo._id,
                    content,
                });
                socket.emit('stop-typing', activeConvo._id);
            } else {
                await API.post('/chat/messages', {
                    conversationId: activeConvo._id,
                    content,
                });
                fetchMessages(activeConvo._id);
            }
        } catch { /* ignore */ }
        finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // ── Typing indicator ────────────────────────────────────────────
    const handleTypingInput = (e) => {
        setNewMsg(e.target.value);
        if (socket && activeConvo) {
            socket.emit('typing', activeConvo._id);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop-typing', activeConvo._id);
            }, 2000);
        }
    };

    // ── Helpers ─────────────────────────────────────────────────────
    const getConvoName = (convo) => {
        if (convo.type === 'announcement') return 'Announcements';
        const other = convo.participants?.find((p) => p._id !== user?.id);
        return other?.name || 'Chat';
    };

    const getConvoInitial = (convo) => {
        if (convo.type === 'announcement') return 'A';
        const other = convo.participants?.find((p) => p._id !== user?.id);
        return (other?.name || 'C')[0].toUpperCase();
    };

    const isReadOnly = !isAdmin && activeConvo?.type === 'announcement';

    // Interns not yet in a direct conversation
    const internsWithoutDM = companyInterns.filter((intern) =>
        !conversations.some(
            (c) =>
                c.type === 'direct' &&
                c.participants?.some((p) => p._id === intern._id)
        )
    );

    return (
        <div className="flex h-screen overflow-hidden bg-surface-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar title="Messages" />
                <div className="flex-1 flex overflow-hidden">

                    {/* ── Conversation List ── */}
                    <div className="w-72 shrink-0 border-r border-surface-100 bg-white flex flex-col">
                        <div className="p-4 border-b border-surface-100">
                            <h2 className="text-sm font-bold text-surface-800">Conversations</h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                <span className="text-[10px] text-surface-400">{isConnected ? 'Connected' : 'Offline'}</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-14 rounded-xl bg-surface-50 animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {conversations.map((convo) => {
                                        const isActive = activeConvo?._id === convo._id;
                                        const name = getConvoName(convo);
                                        const initial = getConvoInitial(convo);
                                        const isAnn = convo.type === 'announcement';
                                        const otherUser = convo.participants?.find((p) => p._id !== user?.id);
                                        const isOnline = otherUser && onlineUsers.includes(otherUser._id);

                                        return (
                                            <button
                                                key={convo._id}
                                                onClick={() => openConversation(convo)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-surface-50
                                                    ${isActive ? 'bg-brand-50 border-l-2 border-l-brand-500' : 'hover:bg-surface-50'}`}
                                            >
                                                <div className="relative shrink-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold
                                                        ${isAnn ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>
                                                        {isAnn ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                                            </svg>
                                                        ) : initial}
                                                    </div>
                                                    {!isAnn && isOnline && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-surface-800 truncate">{name}</p>
                                                    {convo.lastMessage?.content && (
                                                        <p className="text-[10px] text-surface-400 truncate mt-0.5">
                                                            {convo.lastMessage.content}
                                                        </p>
                                                    )}
                                                </div>
                                                {convo.lastMessage?.timestamp && (
                                                    <span className="text-[9px] text-surface-300 shrink-0">
                                                        {timeAgo(convo.lastMessage.timestamp)}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}

                                    {/* Admin: Start new DM */}
                                    {isAdmin && internsWithoutDM.length > 0 && (
                                        <div className="p-3 border-t border-surface-100">
                                            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-2">Start Chat With</p>
                                            {internsWithoutDM.map((intern) => (
                                                <button
                                                    key={intern._id}
                                                    onClick={() => startDirectChat(intern._id)}
                                                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-50 transition-colors"
                                                >
                                                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold">
                                                        {intern.name[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-xs text-surface-600 font-medium truncate">{intern.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Chat Area ── */}
                    <div className="flex-1 flex flex-col bg-surface-50">
                        {!activeConvo ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-7 h-7 text-surface-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-surface-400">Select a conversation</p>
                                    <p className="text-xs text-surface-300 mt-1">
                                        {isAdmin ? 'Send announcements or message interns directly' : 'View announcements or chat with your admin'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat header */}
                                <div className="px-5 py-3.5 border-b border-surface-100 bg-white flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                                        ${activeConvo.type === 'announcement' ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>
                                        {activeConvo.type === 'announcement' ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                            </svg>
                                        ) : getConvoInitial(activeConvo)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-surface-800">{getConvoName(activeConvo)}</p>
                                        <p className="text-[10px] text-surface-400">
                                            {activeConvo.type === 'announcement'
                                                ? (isAdmin ? 'Broadcast to all interns' : 'Admin announcements')
                                                : (typingUsers[activeConvo._id] ? `${typingUsers[activeConvo._id]} is typing...` : 'Direct message')}
                                        </p>
                                    </div>
                                    {isReadOnly && (
                                        <span className="ml-auto text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                            Read only
                                        </span>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                                    {loadingMsgs ? (
                                        <div className="flex items-center justify-center h-full">
                                            <svg className="w-5 h-5 animate-spin text-surface-300" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-xs text-surface-300">No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isMe = msg.sender?._id === user?.id;
                                            const prev = messages[idx - 1];
                                            const sameSender = prev && prev.sender?._id === msg.sender?._id;
                                            const showAvatar = !sameSender;

                                            return (
                                                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
                                                    <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                                        {/* Avatar */}
                                                        {showAvatar ? (
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                                                ${isMe ? 'bg-brand-100 text-brand-700' : 'bg-violet-100 text-violet-700'}`}>
                                                                {(msg.sender?.name || '?')[0].toUpperCase()}
                                                            </div>
                                                        ) : (
                                                            <div className="w-7 shrink-0" />
                                                        )}

                                                        <div>
                                                            {showAvatar && (
                                                                <p className={`text-[10px] font-semibold mb-0.5 ${isMe ? 'text-right text-brand-600' : 'text-surface-500'}`}>
                                                                    {isMe ? 'You' : msg.sender?.name}
                                                                    {msg.sender?.role === 'admin' && !isMe && (
                                                                        <span className="ml-1 text-[9px] text-amber-500 font-bold">ADMIN</span>
                                                                    )}
                                                                </p>
                                                            )}
                                                            <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed
                                                                ${isMe
                                                                    ? 'bg-brand-600 text-white rounded-br-md'
                                                                    : 'bg-white text-surface-800 border border-surface-100 rounded-bl-md shadow-sm'
                                                                }`}>
                                                                {msg.content}
                                                            </div>
                                                            <p className={`text-[9px] text-surface-300 mt-0.5 ${isMe ? 'text-right' : ''}`}>
                                                                {timeAgo(msg.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Typing indicator */}
                                {typingUsers[activeConvo._id] && (
                                    <div className="px-5 py-1">
                                        <p className="text-xs text-surface-400 italic">
                                            {typingUsers[activeConvo._id]} is typing
                                            <span className="animate-pulse">...</span>
                                        </p>
                                    </div>
                                )}

                                {/* Input */}
                                {!isReadOnly && (
                                    <form onSubmit={handleSend} className="px-5 py-3 border-t border-surface-100 bg-white">
                                        <div className="flex items-center gap-3">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={newMsg}
                                                onChange={handleTypingInput}
                                                placeholder={activeConvo.type === 'announcement' ? 'Type an announcement...' : 'Type a message...'}
                                                className="input flex-1"
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMsg.trim() || sending}
                                                className="btn-primary px-4 py-2.5 shrink-0"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
