import SearchIcon from '@mui/icons-material/Search';
import {
    Box, List, ListItemAvatar, Avatar, Typography, TextField,
    InputAdornment, useMediaQuery, useTheme, ListItemText,
    Divider,
    ListItemButton
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
    const token = useAuthStore(s => s.access_token);
    const currentUserId = useAuthStore(s => s.user_data?.pk_id);

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

    const LIMIT = 10;

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

    const fetchChats = async () => {
        const [roomsRes, unreadRes] = await Promise.all([
            api.get('/chat/'),
            api.get('/chat/messages/unread/counts')
        ]);

        setChats(roomsRes.data);

        useUnreadStore.getState().setAllChats(unreadRes.data);
    };

    useEffect(() => {
        fetchChats();
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

    useEffect(() => {
        if (!selectedChat) return;

        fetchPinMessages(selectedChat.room_id);
    }, [selectedChat]);

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
                                username: data.username || "New User",
                                avatar_url: data.avatar_url || null,
                                last_message: data.last_message,
                                last_message_at: data.last_message?.created_at,
                                unread_count: 0
                            }
                        ];

                    return updated.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
                });
                break;
            case "call.accepted":
                setCallRequest(null);
                break;

            case "call.missed":
                setCallRequest(null);
                break;

            case "call.busy":
                setIsCallBusy(true);
                setTimeout(() => {
                    setCallRequest(null);
                    setIsCallBusy(false);
                }, 2000);
                break;

            case "call.declined":
                setCallRequest(null);
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
    };

    const declinedCall = (roomId) => {
        sendGlobal({
            type: "call.decline",
            payload: { room_id: roomId }
        });
        setCallRequest(null);
    };

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
                                placeholder="Search..."
                                value={chatSearch}
                                onChange={(e) => setChatSearch(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '30px',
                                        // backgroundColor: '#ffffffff',
                                        paddingRight: 1,
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'grey.500' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                        </Box>
                    </Box>
                    <Divider sx={{ py: 1 }} />
                    <Typography
                        sx={{
                            color: 'primary.main',
                            fontWeight: 'bold',
                            px: 1,
                            pt: 0.5
                        }}
                    >Chat ({chats.length})</Typography>

                    <Box
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            '&::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none',
                        }}
                    >
                        <List>
                            {filteredChats.map(chat => {
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
                            {chatSearch && newUsers.length > 0 && (
                                <>
                                    <Typography sx={{ px: 2, mt: 1, opacity: 0.6 }}>
                                        Start new chat
                                    </Typography>

                                    {newUsers.map(user => (
                                        <ListItemButton
                                            key={user.pk_id}
                                            onClick={() => handleStartChat(user)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar src={user.avatar_url}>
                                                    {user.user_name[0]?.toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={user.user_name}
                                                secondary={user.email}
                                            />
                                        </ListItemButton>
                                    ))}
                                </>
                            )}
                            {chatSearch &&
                                filteredChats.length === 0 &&
                                newUsers.length === 0 &&
                                !searchLoading && (
                                    <Typography sx={{ textAlign: 'center', mt: 2, opacity: 0.6 }}>
                                        No chats or users found
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
                        pinMessage={pinMessage}
                        reactionsData={reactionsData}
                        onStartCall={startCall}
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
                />
            )}

        </Box>
    );
}

export default ChatPage;
