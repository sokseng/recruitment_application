import SearchIcon from '@mui/icons-material/Search';
import {
    Box, List, IconButton, ListItemAvatar, Avatar, Typography, TextField,
    InputAdornment, useMediaQuery, useTheme, Chip
} from "@mui/material";
import ChatComponent from '../components/chat/ChatComponent';
import { useState, useEffect, useRef, useCallback } from 'react';
import FindUsers from '../components/chat/dialog/CreateChatDialog';
import api from '../services/api';
import { useWebSocket } from './../hooks/useWebSocket';
import { useUnreadStore } from '../store/unreadStore';
import useAuthStore from '../store/useAuthStore';
import { FormatTime } from '../components/chat/FormatTime';
import { useLocation } from "react-router-dom";

function getLastMessagePreview(chat, currentUserId) {
    const msg = chat.last_message;
    if (!msg) return "Tap to start a new message";

    const isMe = msg.sender_id === currentUserId;

    switch (msg.type) {
        case "text": return msg.content || "";
        case "image": return isMe ? "You sent an image" : `${chat.username} sent you an image`;
        case "voice": return isMe ? "You sent a voice message" : `${chat.username} sent you a voice message`;
        case "video": return isMe ? "You sent a video" : `${chat.username} sent you a video`;
        case "file": return isMe ? "You sent a file" : `${chat.username} sent you a file`;
        case "system": return msg.content || "";
        default: return "New message";
    }
}

function ChatPage() {
    const location = useLocation();
    const initialRoomId = location.state?.roomId;
    const token = useAuthStore.getState().access_token;
    const currentUserId = useAuthStore.getState().user_data.pk_id;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [selectedChat, setSelectedChat] = useState(null);
    const [open, setOpen] = useState(false);

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [loadingOlder, setLoadingOlder] = useState(false);

    const LIMIT = 50;

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

    const fetchChats = async () => {
        const res = await api.get('/chat/');
        const unreadData = await api.get("/chat/messages/unread/count");

        setChats(res.data);

        const countsByRoom = unreadData.data.count;
        const countsObject =
            typeof countsByRoom === 'number'
                ? { [res.data[0]?.room_id || 0]: countsByRoom }
                : countsByRoom;

        useUnreadStore.getState().setAllChats(countsObject);

    }

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchMessages = async (roomId, reset = false) => {
        if (!roomId) return [];

        const currentOffset = reset ? 0 : offset;
        const res = await api.get(`/chat/room/${roomId}/messages`, {
            params: { limit: LIMIT, offset: currentOffset }
        });

        const newMessages = res.data;
        if (newMessages.length < LIMIT) setHasMore(false);
        if (reset) setOffset(LIMIT);
        else setOffset(prev => prev + LIMIT);

        return newMessages;
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

        fetchMessages(roomId, true).then(newMessages => {
            if (activeChatIdRef.current !== roomId) return;

            setMessages(newMessages);

            setTimeout(() => {
                const el = messagesRef.current;
                if (el) el.scrollTop = el.scrollHeight;

                initialLoadRef.current = false;
            }, 50);
        });

        return () => {
            activeChatIdRef.current = null;
            setMessages([]);
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

        resetUnread(chat.room_id);

        setChats(prev => {
            const exists = prev.some(c => c.room_id === chat.room_id);
            return exists ? prev : [chat, ...prev];
        });

    };

    const { connected, send } = useWebSocket({
        roomId: selectedChat?.room_id,
        token,
        onMessage: (data) => {
            console.log("WS EVENT RECEIVED:", data);

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

                    if (selectedChat?.room_id !== data.message.room_id && data.message.sender_id !== currentUserId) {
                        incrementUnread(data.message.room_id);
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
                                    username: data.username || "New User",
                                    avatar_url: data.avatar_url || null,
                                    last_message: data.last_message,
                                    last_message_at: data.last_message?.created_at,
                                    unread_count: 0
                                }
                            ];

                        return updated.sort(
                            (a, b) => new Date(b.last_message_at) - new Date(a.last_message_at)
                        );
                    });
                    break;

                default:
                    console.log("WS event", data);
            }
        },
    });

    const currentSend = useCallback((data) => {
        if (connected && send) send(data);
    }, [connected, send]);

    useEffect(() => {
        if (!connected && !selectedChatRef.current) return;
    }, [connected]);

    return (
        <Box sx={{ display: 'flex', width: '100%', height: '91vh', position: 'relative', border: 1, borderColor: 'divider' }}>

            {(!isMobile || !selectedChat) && (
                <Box
                    sx={{
                        position: 'relative',
                        width: { xs: '100%', md: 400 },
                        display: 'flex',
                        flexDirection: 'column',
                        borderRight: { sm: '1px solid #ddd' },
                        backgroundColor: 'white',
                        zIndex: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            All Chats ({chats.length})
                        </Typography>
                    </Box>

                    <Box sx={{ py: 2, px: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Search chat"
                            onClick={() => setOpen(true)}
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton>
                                            <SearchIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none',
                        }}
                    >
                        <List>
                            {chats.map(chat => {
                                return (
                                    <Box
                                        key={chat.room_id}
                                        onClick={() => setSelectedChat(chat)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: selectedChat?.room_id === chat.room_id ? 'primary.main' : 'white',
                                            '&:hover': {
                                                transform: { xs: 'none', sm: 'translateY(-2px)' },
                                                boxShadow: { xs: 'none', sm: '0 4px 12px rgba(0,0,0,0.1)' },
                                            },
                                            position: 'relative',
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 48 }}>
                                            <Avatar src={chat?.avatar_url} sx={{ borderRadius: 12 }}>
                                                {chat.username.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemAvatar>

                                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                            <Typography sx={{ fontWeight: 'bold', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selectedChat?.room_id === chat.room_id ? 'white' : 'black' }}>
                                                {chat.username}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: 10,
                                                    color: selectedChat?.room_id === chat.room_id ? "white" : "grey.600",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    mt: 0.25,
                                                }}
                                            >
                                                {getLastMessagePreview(chat, currentUserId)}
                                            </Typography>

                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            alignItems: 'end'
                                        }}>
                                            <Typography sx={{ fontSize: 10, fontWeight: 'bold', color: selectedChat?.room_id === chat.room_id ? 'white' : 'grey.600' }}>
                                                {chat.last_message_at && <FormatTime time={chat.last_message_at} />}
                                            </Typography>
                                            {(chatCounts[chat.room_id] || 0) > 0 && (
                                                <Box
                                                    sx={{
                                                        width: 15,
                                                        height: 15,
                                                        fontSize: 9,
                                                        mt: 0.25,
                                                        backgroundColor: 'orange',
                                                        color: 'white',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        borderRadius: '50%',
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
                        backgroundColor: '#f5f5f5',
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
                    />
                </Box>
            )}

            <FindUsers
                open={open}
                onClose={() => setOpen(false)}
                onSelectUser={handleSelectChat}
            />

        </Box>
    );
}

export default ChatPage;
