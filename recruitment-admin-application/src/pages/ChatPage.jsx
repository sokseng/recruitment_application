import SearchIcon from '@mui/icons-material/Search';
import AddBoxIcon from '@mui/icons-material/AddBox';
import {
    Box, List, IconButton, Button, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, TextField,
    InputAdornment, useMediaQuery, useTheme, Chip, Fade
} from "@mui/material";
import ChatComponent from '../components/chat/ChatComponent';
import { useState, useEffect } from 'react';
import FindUsers from '../components/chat/dialog/CreateChatDialog';
import api from '../services/api';
import { useWebSocket } from './../hooks/useWebSocket';
import useAuthStore from '../store/useAuthStore';
import useTypewriter from '../hooks/useTypewriter';

function ChatPage() {
    const token = useAuthStore.getState().access_token;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [selectedChat, setSelectedChat] = useState(null);
    const [open, setOpen] = useState(false);

    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);

    const fetchChats = async () => {
        const res = await api.get('/chat/');
        setChats(res.data);

        console.log("chats", res.data)
    }

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (!selectedChat) return;

        api.get(`/chat/${selectedChat.id}/messages`)
            .then(res => setMessages(res.data))
            .catch(console.error);
    }, [selectedChat]);

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
                    setMessages(prev => [...prev, data.message]);
                    break;

                case "presence":
                    console.log("Presence update", data);
                    break;

                case "typing":
                    console.log("User typing...");
                    break;

                case "call_offer":
                    console.log("Incoming call", data);
                    break;

                default:
                    console.log("WS event", data);
            }
        },
    });

    const animatedText = useTypewriter('Connecting...', 100, 1000);

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
                            {chats.map(chat => (
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
                                    <ListItemAvatar sx={{minWidth: 48}}>
                                        <Avatar src={chat?.avatar_url} sx={{ borderRadius: 12 }}>
                                            {chat.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>

                                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                        <Typography sx={{ fontWeight: 'bold', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selectedChat?.id === chat.id ? 'white' : 'black' }}>
                                            {chat.username}
                                        </Typography>
                                        <Typography sx={{ fontSize: 10, color: selectedChat?.id == chat.id ? 'white' : 'grey.600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.25 }}>
                                            {chat.last_message ?? 'Tap to start new message'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        alignItems: 'end'
                                    }}>
                                        <Typography sx={{ fontSize: 10, fontWeight: 'bold', color: selectedChat?.id == chat.id ? 'white' : 'grey.600' }}>
                                            {chat.last_message_at}
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

                                    {chat.isOnline && (
                                        <Chip
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                backgroundColor: chat.isOnline ? 'rgba(42, 223, 48, 1)' : 'grey',
                                                position: 'absolute',
                                                top: 6,
                                                left: 35,
                                            }}
                                        />
                                    )}
                                </Box>

                            ))}
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
