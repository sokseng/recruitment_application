import SearchIcon from '@mui/icons-material/Search';
import {
    Box, List, IconButton, ListItemAvatar, Avatar, Typography, TextField,
    InputAdornment, useMediaQuery, useTheme, Chip
} from "@mui/material";
import ChatComponent from '../components/chat/ChatComponent';
import { useState, useEffect, useRef } from 'react';
import FindUsers from '../components/chat/dialog/CreateChatDialog';
import api from '../services/api';
import { useWebSocket } from './../hooks/useWebSocket';
import useAuthStore from '../store/useAuthStore';
import { FormatTime } from '../components/chat/FormatTime';

function ChatPage() {
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

    const LIMIT = 50;

    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const messagesRef = useRef(null);
    const loadingOlderRef = useRef(false);
    const activeChatIdRef = useRef(null);
    const initialLoadRef = useRef(true);
    const messagesEndRef = useRef(null);

    const fetchChats = async () => {
        const res = await api.get('/chat/');
        setChats(res.data);

    }

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchMessages = async (chatId, reset = false) => {
        if (!chatId) return [];

        const currentOffset = reset ? 0 : offset;
        const res = await api.get(`/chat/${chatId}/messages`, {
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

        const chatId = selectedChat.id;
        activeChatIdRef.current = chatId;

        setMessages([]);
        setOffset(0);
        setHasMore(true);
        loadingOlderRef.current = false;
        initialLoadRef.current = true;

        fetchMessages(chatId, true).then(newMessages => {
            if (activeChatIdRef.current !== chatId) return;

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
    }, [selectedChat?.id]);

    const handleScroll = async () => {
        const el = messagesRef.current;
        if (!el || loadingOlderRef.current || !hasMore) return;

        // Skip if first load is not done
        if (initialLoadRef.current) return;

        if (el.scrollTop <= 10 && selectedChat) {
            loadingOlderRef.current = true;

            const prevScrollHeight = el.scrollHeight;

            const newMessages = await fetchMessages(selectedChat.id);

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

    const handleSelectUser = (user) => {
        setSelectedChat({
            id: user.pk_id,
            username: user.user_name,
            avatar_url: user.avatar_url,
        });
    };

    const { connected, send } = useWebSocket({
        otherUserId: selectedChat?.id,
        token,
        onMessage: (data) => {
            switch (data.type) {
                case "message":
                    console.log("message res", data.message)
                    setMessages(prev => {
                        const exists = prev.some(msg => msg.id === data.message.id);
                        if (exists) return prev; // skip duplicate
                        return [...prev, data.message];
                    });

                    if (isNearBottom() || prev.length === 0) {
                        setTimeout(scrollToBottom, 50);
                    }

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

                default:
                    console.log("WS event", data);
            }
        },
    });

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
                                const isOnline = onlineUsers[chat.id] || false;
                                return (
                                    <Box
                                        key={chat.id}
                                        onClick={() => setSelectedChat(chat)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: selectedChat?.id === chat.id ? 'primary.main' : 'white',
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
                                            <Typography sx={{ fontWeight: 'bold', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selectedChat?.id === chat.id ? 'white' : 'black' }}>
                                                {chat.username}
                                            </Typography>
                                            <Typography sx={{ fontSize: 10, color: selectedChat?.id == chat.id ? 'white' : 'grey.600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.25 }}>
                                                {chat.last_message?.content ?? 'Tap to start new message'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            alignItems: 'end'
                                        }}>
                                            <Typography sx={{ fontSize: 10, fontWeight: 'bold', color: selectedChat?.id == chat.id ? 'white' : 'grey.600' }}>
                                                {chat.last_message_at && <FormatTime time={chat.last_message_at} />}
                                            </Typography>
                                            {chat.unread_count > 0 && (
                                                <Box
                                                    sx={{
                                                        width: 15,
                                                        height: 15,
                                                        fontSize: 9,
                                                        mt: 0.25,
                                                        backgroundColor: chat.unread_count > 0 ? 'orange' : 'grey',
                                                        color: chat.unread_count > 0 ? 'white' : 'black',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        borderRadius: '50%'
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontSize: 9,
                                                        }}
                                                    >
                                                        {chat.unread_count}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        {isOnline && (
                                            <Chip
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    backgroundColor: 'rgba(42, 223, 48, 1)',
                                                    position: 'absolute',
                                                    top: 6,
                                                    left: 35,
                                                }}
                                            />
                                        )}
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
                        send={send}
                        currentUserId={currentUserId}
                        isOnline={onlineUsers[selectedChat?.id] || false}
                        typingUsers={typingUsers}
                        messagesRef={messagesRef}
                        onScroll={handleScroll}
                        loadingOlderRef={loadingOlderRef}
                        messagesEndRef={messagesEndRef}
                    />
                </Box>
            )}

            <FindUsers
                open={open}
                onClose={() => setOpen(false)}
                onSelectUser={handleSelectUser}
            />

        </Box>
    );
}

export default ChatPage;
