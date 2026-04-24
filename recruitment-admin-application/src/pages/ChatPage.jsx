import SearchIcon from '@mui/icons-material/Search';
import {
    Box, List, ListItemAvatar, Avatar, Typography, TextField,
    InputAdornment, useMediaQuery, useTheme, ListItemText,
    Divider,
    ListItemButton,
    Snackbar,
    Alert
} from "@mui/material";
import ChatComponent from '../components/chat/ChatComponent';
import { useState, useEffect, useRef, useCallback } from 'react';
import FindUsers from '../components/chat/dialog/CreateChatDialog';
import api from '../services/api';
import { useWebSocket } from './../hooks/useWebSocket';
import { useGlobalWebSocket } from './../hooks/useGlobalWebSocket';
import { useUnreadStore } from '../store/unreadStore';
import useAuthStore from '../store/useAuthStore';
import { FormatTime } from '../components/chat/FormatTime';
import { useLocation } from "react-router-dom";
import CallRequestDialog from '../components/chat/dialog/CallRequestDialog';
import ringtone from '../assets/outgoing_sound.mp3';
import { useTranslation } from 'react-i18next';

function getLastMessagePreview(chat, currentUserId, t) {
    const msg = chat.last_message;
    if (!msg) return t('tap_to_start');

    const isMe = msg.sender_id === currentUserId;

    switch (msg.type) {
        case "text": return msg.content || "";
        case "image": return isMe ? t('you_sent_image') : t('sent_you_image');
        case "voice": return isMe ? t('you_sent_voice') : t('sent_you_voice');
        case "video": return isMe ? t('you_sent_video') : t('sent_you_video');
        case "file": return isMe ? t('you_sent_file') : t('sent_you_file');
        case "call": return msg.content || "";
        case "system": return msg.content || "";
        default: return t('new_message');
    }
}

function ChatPage() {
    const { t } = useTranslation();
    const location = useLocation();
    const initialRoomId = location.state?.roomId;
    const token = useAuthStore(s => s.access_token);
    const currentUserId = useAuthStore(s => s.user_data?.pk_id);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [selectedChat, setSelectedChat] = useState(null);
    const [open, setOpen] = useState(false);

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [reactionsData, setReactionsData] = useState({});
    const [blockMessage, setBlockMessage] = useState(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    const LIMIT = 10;
    const CHAT_LIMIT = 20;

    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const messagesRef = useRef(null);
    const loadingOlderRef = useRef(false);
    const activeChatIdRef = useRef(null);
    const initialLoadRef = useRef(true);
    const messagesEndRef = useRef(null);
    const selectedChatRef = useRef(selectedChat);

    const chatCounts = useUnreadStore(state => state.chatCounts);
    const incrementChat = useUnreadStore(state => state.incrementChat);
    const resetChat = useUnreadStore(state => state.resetChat);

    const [pinMessage, setPinMessage] = useState(null);
    const [chatSearch, setChatSearch] = useState("");
    const [foundUsers, setFoundUsers] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [callRequest, setCallRequest] = useState(null);
    const [isCallBusy, setIsCallBusy] = useState(false);
    const scrollContainerRef = useRef(null);
    const audioRef = useRef(null);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "info"
    });

    const showSnackbar = (message, severity = "info") => {
        setSnackbar(prev => ({ ...prev, open: false }));
        setTimeout(() => {
            setSnackbar({ open: true, message, severity });
        }, 50);
    };

    const handleCloseSnackbar = (_, reason) => {
        if (reason === "clickaway") return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    useEffect(() => {
        const search = chatSearch.trim();

        if (!search) {
            setFoundUsers([]);
            return;
        }

        if (filteredChats.length > 0) {
            setFoundUsers([]);
            return;
        }

        const timeout = setTimeout(() => {
            setSearchLoading(true);

            api.get("/chat/find-users", { params: { q: search } })
                .then(res => setFoundUsers(res.data))
                .catch(console.error)
                .finally(() => setSearchLoading(false));

        }, 300);

        return () => clearTimeout(timeout);

    }, [chatSearch]);

    const filteredChats = chats.filter(chat =>
        chat.username.toLowerCase().includes(chatSearch.toLowerCase())
    );

    const existingUserIds = chats.map(chat => chat.user_id);

    const newUsers = foundUsers.filter(
        user => !existingUserIds.includes(user.pk_id)
    );

    const handleStartChat = async (user) => {
        try {
            const res = await api.post("/chat/get-or-create-room", {
                other_user_id: user.pk_id,
            });

            const newRoom = res.data;

            if (!chats.find(c => c.room_id === newRoom.room_id)) {
                setChats(prev => [newRoom, ...prev]);
            }

            setSelectedChat(newRoom);
            setChatSearch("");
            setFoundUsers([]);

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        if (!initialRoomId || chats.length === 0) return;

        const room = chats.find(c => c.room_id === initialRoomId);

        if (room) {
            setSelectedChat(room);
        }
    }, [initialRoomId, chats]);

    const fetchUnreadCount = async () => {
        const unreadRes = await api.get('/chat/messages/unread/counts')

        useUnreadStore.getState().setAllChats(unreadRes.data);
    };

    const fetchChats = async (offset = 0, limit = CHAT_LIMIT) => {
        try {
            const res = await api.get("/chat/", { params: { limit, offset } });
            const newChats = res.data;

            if (offset === 0) {
                setChats(newChats);
            } else {
                setChats(prev => [...prev, ...newChats]);
            }

            setHasMore(newChats.length === limit);
        } catch (err) {
            console.error(err);
        }
    };

    const handleChatScroll = () => {
        const container = scrollContainerRef.current;
        if (!container || loadingOlderRef.current || !hasMore) return;

        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
            // near bottom
            loadingOlderRef.current = true;
            const newOffset = offset + CHAT_LIMIT;
            fetchChats(newOffset, CHAT_LIMIT).then(() => {
                setOffset(newOffset);
                loadingOlderRef.current = false;
            });
        }
    };

    useEffect(() => {
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        fetchChats(0, CHAT_LIMIT);
    }, []);

    const fetchPinMessages = async (roomId) => {
        if (!roomId) return;

        const res = await api.get(`/chat/rooms/${roomId}/pin`);
        setPinMessage(res.data);
    }

    const fetchReactions = async (roomId, messageId) => {
        try {
            const res = await api.get(`/chat/rooms/${roomId}/messages/${messageId}/reactions`);
            return res.data; // array of reactions
        } catch (err) {
            console.error("Error fetching reactions:", err);
            return [];
        }
    };

    const fetchBlockMessage = async (roomId) => {
        try {
            const res = await api.get(`/chat/rooms/${roomId}/block-status`);
            setBlockMessage(res.data);
        } catch (err) {
            console.error("Error fetching reactions:", err);
            return [];
        }
    }

    useEffect(() => {
        if (!selectedChat) return;

        fetchPinMessages(selectedChat.room_id);
        fetchBlockMessage(selectedChat.room_id);
    }, [selectedChat]);

    const fetchMessages = async (roomId, reset = false) => {
        if (!roomId) return [];

        const currentOffset = reset ? 0 : offset;

        try {
            const res = await api.get(`/chat/room/${roomId}/messages`, {
                params: { limit: LIMIT, offset: currentOffset },
            });

            const newMessages = res.data;

            if (newMessages.length < LIMIT) setHasMore(false);
            else setHasMore(true);

            setOffset(prev => (reset ? LIMIT : prev + newMessages.length));

            return newMessages;
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    useEffect(() => {
        if (!selectedChat) return;

        const roomId = selectedChat.room_id;
        activeChatIdRef.current = roomId;

        setMessages([]);
        setOffset(0);
        setHasMore(true);
        loadingOlderRef.current = false;
        initialLoadRef.current = true;

        fetchMessages(roomId, true).then(async (newMessages) => {
            if (activeChatIdRef.current !== roomId) return;

            setMessages(newMessages);

            resetChat(roomId);

            const reactionsMap = {};
            for (let msg of newMessages) {
                reactionsMap[msg.id] = await fetchReactions(roomId, msg.id);
            }
            setReactionsData(reactionsMap);

            setTimeout(() => {
                const el = messagesRef.current;
                if (el) el.scrollTop = el.scrollHeight;

                initialLoadRef.current = false;
            }, 50);
        });

        return () => {
            activeChatIdRef.current = null;
            setMessages([]);
            setReactionsData({});
        };
    }, [selectedChat?.room_id]);

    const handleScroll = async () => {
        const el = messagesRef.current;
        if (!el || loadingOlderRef.current || !hasMore) return;

        // Skip if first load is not done
        if (initialLoadRef.current) return;

        if (el.scrollTop <= 10 && selectedChat) {
            loadingOlderRef.current = true;
            setLoadingOlder(true);

            const prevScrollHeight = el.scrollHeight;

            const newMessages = await fetchMessages(selectedChat.room_id);

            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const filteredNewMessages = newMessages.filter(m => !existingIds.has(m.id));
                return [...filteredNewMessages, ...prev]; // prepend older messages
            });

            setTimeout(() => {
                const el = messagesRef.current;
                if (el) {
                    el.scrollTop = el.scrollHeight - prevScrollHeight;
                }
                loadingOlderRef.current = false;
                setLoadingOlder(false);
            }, 0);
        }
    };

    const isNearBottom = () => {
        const el = messagesRef.current;
        if (!el) return false;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        setOpen(false);

        resetChat(chat.room_id);

        setChats(prev => {
            const exists = prev.some(c => c.room_id === chat.room_id);
            return exists ? prev : [chat, ...prev];
        });


    };

    const { connected, send } = useWebSocket({
        roomId: selectedChat?.room_id,
        token,
        onMessage: (data) => {
            // console.log("WS EVENT RECEIVED:", data);

            switch (data.type) {
                case "connected":
                    return;

                case "message":
                    setMessages(prev => {
                        const exists = prev.some(msg => msg.id === data.message.id);
                        if (exists) return prev; // skip duplicate

                        const updated = [...prev, data.message];

                        if (isNearBottom() || prev.length === 0) {
                            setTimeout(scrollToBottom, 50);
                        }

                        return updated;
                    });

                    const isCurrentRoom = selectedChatRef.current?.room_id === data.message.room_id;

                    if (!isCurrentRoom && data.message.sender_id !== currentUserId) {
                        incrementChat(data.message.room_id);
                    }

                    break;

                case "message_updated":
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === data.message.id ? data.message : msg
                        )
                    );
                    break;

                case "message_deleted":
                    setMessages(prev =>
                        prev.filter(msg => msg.id !== data.message_id)
                    );
                    break;

                case "presence":
                    setOnlineUsers(prev => ({
                        ...prev,
                        [data.userId]: data.online
                    }));
                    break;

                case "typing":
                    setTypingUsers(prev => ({
                        ...prev,
                        [data.user_id]: data.is_typing
                    }));
                    break;

                case "message_pinned":
                    if (data.room_id === selectedChat?.room_id) {
                        setPinMessage(data);
                    }
                    setChats(prev =>
                        prev.map(chat =>
                            chat.room_id === data.room_id
                                ? { ...chat, message: data } : chat
                        )
                    );
                    break;
                case "message_unpinned":
                    if (data.room_id === selectedChat?.room_id) {
                        setPinMessage(null);
                    }
                    setChats(prev =>
                        prev.map(chat =>
                            chat.room_id === data.room_id
                                ? { ...chat, message: null } : chat
                        )
                    );
                    break;
                case "message_reaction":
                    setReactionsData(prev => ({
                        ...prev,
                        [data.message_id]: {
                            ...prev[data.message_id],
                            reactions: data.reactions
                        }
                    }));
                    break;

                case "message_reaction_personal":
                    setReactionsData(prev => ({
                        ...prev,
                        [data.message_id]: {
                            ...prev[data.message_id],
                            my_reaction: data.my_reaction
                        }
                    }));
                    break;

                case "message_reaction_removed":
                    setReactionsData(prev => {
                        const updated = { ...prev };

                        if (updated[data.message_id]) {
                            // Remove the user's reaction
                            updated[data.message_id] = {
                                ...updated[data.message_id],
                                reactions: data.reactions,
                                my_reaction: null
                            };

                            if (Object.keys(data.reactions).length === 0) {
                                delete updated[data.message_id];
                            }
                        }

                        return updated;
                    });
                    break;
                case "read":
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.sender_id === currentUserId
                                ? { ...msg, is_read: true, read_at: data.timestamp }
                                : msg
                        )
                    );
                    break;
                case "chat_room_block_update":
                    if (selectedChat?.room_id === data.room_id) {
                        setBlockMessage({
                            is_blocked: data.is_blocked,
                            blocked_by_user: data.blocked_by_user,
                            blocked_at: data.blocked_at
                        })
                    }
                    break;

                case "error":
                    stopRingtone();
                    setCallRequest(null);
                    showSnackbar(data.message, "error");
                    break;

                default:
                    // console.log("WS event", data);
                    break;
            }
        },
    });

    const currentSend = useCallback((data) => {
        if (connected && send) send(data);
    }, [connected, send]);

    const { send: sendGlobal, connected: globalConnected } = useGlobalWebSocket((data) => {
        // console.log("WS EVENT RECEIVED:", data);
        switch (data.type) {
            case "chat_list_update":
                setChats(prev => {
                    const exists = prev.some(chat => chat.room_id === data.room_id);

                    const updated = exists
                        ? prev.map(chat =>
                            chat.room_id === data.room_id
                                ? {
                                    ...chat,
                                    last_message: data.last_message,
                                    last_message_at: data.last_message?.created_at
                                }
                                : chat
                        )
                        : [
                            ...prev,
                            {
                                room_id: data.room_id,
                                username: data.username || t('new_user'),
                                profile_image: data.profile_image || null,
                                last_message: data.last_message,
                                last_message_at: data.last_message?.created_at,
                                unread_count: 0
                            }
                        ];

                    return updated.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
                });
                break;

            case "call.accepted":
            case "call.missed":
            case "call.declined":
                stopRingtone();
                setCallRequest(null);
                break;

            case "call.busy":
                stopRingtone();
                setIsCallBusy(true);
                setTimeout(() => {
                    setCallRequest(null);
                    setIsCallBusy(false);
                }, 2000);

                setMessages(prev => {
                    const exists = prev.some(msg => msg.id === data.message.id);
                    if (exists) return prev; // skip duplicate

                    const updated = [...prev, data.message];

                    if (isNearBottom() || prev.length === 0) {
                        setTimeout(scrollToBottom, 50);
                    }

                    return updated;
                });

                const isCurrentRoom = selectedChatRef.current?.room_id === data.message.room_id;

                if (!isCurrentRoom && data.message.sender_id !== currentUserId) {
                    incrementChat(data.message.room_id);
                }

                break;

            case "error":
                stopRingtone();
                setCallRequest(null);
                showSnackbar(data.message, "error");
                break;

            default:
                break;
        }
    });

    const startCall = (roomId, mode = 'video') => {
        if (!globalConnected && selectedChat) {
            console.warn("WS not connected yet");
            return;
        }
        sendGlobal({
            type: "call.initiate",
            payload: { room_id: roomId, mode: mode }
        });
        setCallRequest(selectedChat);
        playRingtone();
    };

    const declinedCall = (roomId) => {
        sendGlobal({
            type: "call.decline",
            payload: { room_id: roomId }
        });
        stopRingtone();
        setCallRequest(null);
    };

    useEffect(() => {
        audioRef.current = new Audio(ringtone);
        audioRef.current.loop = true; // Keep ringing until stopped

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const playRingtone = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => {
                console.warn("Autoplay prevented:", err);
            });
        }
    };

    const stopRingtone = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const scrollToMessage = async (messageId) => {
        if (!messageId || !selectedChat) return;

        const elementId = `message-${messageId}`;
        let element = document.getElementById(elementId);

        let reachedEnd = false;
        let localOffset = 0;

        while (!element && !reachedEnd) {
            setLoadingOlder(true);

            const prevScrollHeight = messagesRef.current?.scrollHeight || 0;

            const res = await api.get(`/chat/room/${selectedChat.room_id}/messages`, {
                params: { limit: LIMIT, offset: localOffset },
            });

            const newMessages = res.data;

            if (newMessages.length === 0) {
                reachedEnd = true;
                break;
            }

            localOffset += newMessages.length;

            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const filtered = newMessages.filter(m => !existingIds.has(m.id));
                return [...filtered, ...prev];
            });

            await new Promise(requestAnimationFrame);

            element = document.getElementById(elementId);

            if (messagesRef.current) {
                messagesRef.current.scrollTop =
                    messagesRef.current.scrollHeight - prevScrollHeight;
            }

            setLoadingOlder(false);
        }

        if (!element) return;

        element.scrollIntoView({ behavior: "smooth", block: "center" });

        setHighlightedMessageId(messageId);
        setTimeout(() => setHighlightedMessageId(null), 1500);
    };

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                width: '100%', 
                height: '91vh', 
                position: 'relative', 
                border: 1, 
                borderColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: 2,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(239, 246, 255, 0.9) 100%)',
            }}
        >

            {snackbar && (
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: "top", horizontal: "center", zIndex: 2000 }}
                >
                    <Alert 
                        onClose={handleCloseSnackbar} 
                        severity={snackbar.severity} 
                        sx={{ 
                            width: "100%",
                            ...(snackbar.severity === "success" && { bgcolor: "#10b981", color: "white" }),
                            ...(snackbar.severity === "error" && { bgcolor: "#ef4444", color: "white" }),
                            ...(snackbar.severity === "warning" && { bgcolor: "#f97316", color: "white" }),
                            ...(snackbar.severity === "info" && { bgcolor: "#3b82f6", color: "white" }),
                        }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            )}

            {(!isMobile || !selectedChat) && (
                <Box
                    sx={{
                        position: 'relative',
                        width: { xs: '100%', md: 400 },
                        display: 'flex',
                        flexDirection: 'column',
                        borderRight: { sm: '1px solid rgba(59, 130, 246, 0.15)' },
                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(239, 246, 255, 0.95) 100%)',
                        backdropFilter: 'blur(12px)',
                        zIndex: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            pt: 2,
                            width: '100%',
                            gap: 1
                        }}

                    >
                        <Box sx={{ width: '100%' }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder={t('search')}
                                value={chatSearch}
                                onChange={(e) => setChatSearch(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '30px',
                                        paddingRight: 1,
                                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#3b82f6' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                        </Box>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(59, 130, 246, 0.15)', py: 1 }} />
                    <Typography
                        sx={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold',
                            px: 1,
                            pt: 0.5
                        }}
                    >
                        {t('all_chats')}
                    </Typography>

                    <Box
                        ref={scrollContainerRef}
                        onScroll={handleChatScroll}
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none',
                        }}
                    >
                        <List>
                            {filteredChats.map(chat => {
                                const isSelected = selectedChat?.room_id === chat.room_id;
                                return (
                                    <Box
                                        key={chat.room_id}
                                        onClick={() => setSelectedChat(chat)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5,
                                            mx: 0.5,
                                            my: 0.3,
                                            cursor: 'pointer',
                                            borderRadius: 2,
                                            transition: 'all 0.2s ease',
                                            background: isSelected 
                                                ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 150%)'
                                                : 'transparent',
                                            '&:hover': {
                                                background: isSelected 
                                                    ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 0%, #ea580c 150%)'
                                                    : 'rgba(59, 130, 246, 0.06)',
                                                transform: { xs: 'none', sm: 'translateY(-2px)' },
                                                boxShadow: { xs: 'none', sm: '0 4px 12px rgba(30, 58, 138, 0.1)' },
                                            },
                                            position: 'relative',
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 48 }}>
                                            <Avatar 
                                                src={`${BASE_URL}/uploads/user/profile/${chat?.profile_image}`} 
                                                sx={{ 
                                                    borderRadius: 12,
                                                    border: '2px solid',
                                                    borderColor: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(59, 130, 246, 0.3)',
                                                }}
                                            >
                                                {chat.username?.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>

                                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                            <Typography 
                                                sx={{ 
                                                    fontWeight: 'bold', 
                                                    fontSize: 14, 
                                                    whiteSpace: 'nowrap', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis', 
                                                    color: isSelected ? 'white' : '#1e3a8a' 
                                                }}
                                            >
                                                {chat.username}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: isSelected ? "rgba(255,255,255,0.8)" : "#f97316",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    mt: 0.25,
                                                }}
                                            >
                                                {getLastMessagePreview(chat, currentUserId, t)}
                                            </Typography>

                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            alignItems: 'end'
                                        }}>
                                            <Typography sx={{ fontSize: 10, fontWeight: 'bold', color: isSelected ? 'rgba(255,255,255,0.9)' : '#3b82f6' }}>
                                                {chat.last_message_at && <FormatTime time={chat.last_message_at} />}
                                            </Typography>
                                            {(chatCounts[chat.room_id] || 0) > 0 && (
                                                <Box
                                                    sx={{
                                                        width: 20,
                                                        height: 20,
                                                        fontSize: 10,
                                                        mt: 0.25,
                                                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        borderRadius: '50%',
                                                        fontWeight: 700,
                                                        boxShadow: '0 2px 8px rgba(249, 115, 22, 0.4)',
                                                    }}
                                                >
                                                    <Typography sx={{ fontSize: 9 }}>
                                                        {chatCounts[chat.room_id]}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                );

                            })}
                            {chatSearch && newUsers.length > 0 && (
                                <>
                                    <Typography sx={{ px: 2, mt: 1, color: '#1e3a8a', fontWeight: 600, }}>
                                        {t('start_new_chat')}
                                    </Typography>

                                    {newUsers.map(user => (
                                        <ListItemButton
                                            key={user.pk_id}
                                            onClick={() => handleStartChat(user)}
                                            sx={{
                                                borderRadius: 2,
                                                mx: 0.5,
                                                my: 0.3,
                                                '&:hover': {
                                                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                                                },
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar 
                                                    src={`${BASE_URL}/uploads/user/profile/${user.profile_image}`}
                                                    sx={{ border: '2px solid rgba(59, 130, 246, 0.3)' }}
                                                >
                                                    {user.user_name?.[0]?.toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={user.user_name}
                                                secondary={user.email}
                                                primaryTypographyProps={{ sx: { color: '#1e3a8a', fontWeight: 600 } }}
                                                secondaryTypographyProps={{ sx: { color: '#f97316' } }}
                                            />
                                        </ListItemButton>
                                    ))}
                                </>
                            )}
                            {chatSearch &&
                                filteredChats.length === 0 &&
                                newUsers.length === 0 &&
                                !searchLoading && (
                                    <Typography 
                                        sx={{ 
                                            textAlign: 'center', 
                                            mt: 2, 
                                            color: '#1e3a8a',
                                            opacity: 0.7,
                                        }}
                                    >
                                        {t('no_chats_or_users_found')}
                                    </Typography>
                                )}
                        </List>
                    </Box>
                </Box>
            )}

            {(!isMobile || selectedChat) && (
                <Box
                    sx={{
                        flex: 1,
                        width: '100%',
                        position: 'relative',
                        background: 'linear-gradient(135deg, rgba(245, 245, 245, 0.8) 0%, rgba(239, 246, 255, 0.6) 100%)',
                    }}
                >
                    <ChatComponent
                        chat={selectedChat}
                        onBack={() => setSelectedChat(null)}
                        messages={messages}
                        setMessages={setMessages}
                        send={currentSend}
                        currentUserId={currentUserId}
                        isOnline={onlineUsers[selectedChat?.user_id] || false}
                        typingUsers={typingUsers}
                        messagesRef={messagesRef}
                        onScroll={handleScroll}
                        loadingOlderRef={loadingOlderRef}
                        loadingOlder={loadingOlder}
                        hasMore={hasMore}
                        messagesEndRef={messagesEndRef}
                        pinMessage={pinMessage}
                        reactionsData={reactionsData}
                        onStartCall={startCall}
                        blockMessage={blockMessage}
                        scrollToMessage={scrollToMessage}
                        highlightedMessageId={highlightedMessageId}
                    />
                </Box>
            )}

            <FindUsers
                open={open}
                onClose={() => setOpen(false)}
                onSelectUser={handleSelectChat}
            />

            {callRequest && (
                <CallRequestDialog
                    callRequest={callRequest}
                    onDeclinedCall={declinedCall}
                    isCallBusy={isCallBusy}
                    BASE_URL={BASE_URL}
                />
            )}

        </Box>
    );
}

export default ChatPage;