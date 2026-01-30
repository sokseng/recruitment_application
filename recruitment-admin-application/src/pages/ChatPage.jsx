import SearchIcon from '@mui/icons-material/Search';
import AddBoxIcon from '@mui/icons-material/AddBox';
import {
    Box, List, IconButton, Button, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, TextField,
    InputAdornment, useMediaQuery, useTheme, Chip, Fade
} from "@mui/material";
import ChatComponent from '../components/chat/ChatComponent';
import { useState } from 'react';
import CreateChatDialog from '../components/chat/dialog/CreateChatDialog';

function ChatPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedChat, setSelectedChat] = useState(null);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const chats = [
        {
            id: 1,
            username: 'test',
            avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc',
            last_message: 'Hi b, can i ask any question',
            last_sended_at: '5m',
            unread: 2,
            isOnline: true
        },
        {
            id: 2,
            username: 'boygame',
            avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc',
            last_message: 'Hi',
            last_sended_at: '10m',
            unread: 5,
            isOnline: true
        },
    ];

    const messages = [
        {
            id: 1,
            content: 'admin ended a call',
            message_type: 'system',
            created_at: '2m',
            sender: { id: 1, username: 'admin', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 2, username: 'john' },
            is_read: true,
        },
        {
            id: 2,
            content: 'Hello! How are you?',
            message_type: 'text',
            created_at: '1m',
            sender: { id: 2, username: 'john', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 1, username: 'admin' },
            is_read: true,
        },
        {
            id: 3,
            content: 'jonh ended a call',
            message_type: 'system',
            created_at: '1m',
            sender: { id: 2, username: 'john', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 1, username: 'admin' },
            is_read: true,
        },
        {
            id: 4,
            content: 'Hello! How are you?',
            message_type: 'text',
            created_at: '1m',
            sender: { id: 1, username: 'admin', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 2, username: 'john' },
            is_read: true,
        },
        {
            id: 5,
            content: 'Hello! How are you?',
            message_type: 'text',
            created_at: '1m',
            sender: { id: 2, username: 'john', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 1, username: 'admin' },
            is_read: true,
        },
        {
            id: 6,
            content: 'Hello! How are you?',
            message_type: 'text',
            created_at: '1m',
            sender: { id: 1, username: 'admin', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 2, username: 'john' },
            is_read: true,
        },
        {
            id: 7,
            content: 'https://voice.google.com/u/0/calls?a=nc,%2B18005550111',
            message_type: 'voice',
            created_at: '1m',
            sender: { id: 1, username: 'admin', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 2, username: 'john' },
            is_read: true,
        },
        {
            id: 8,
            content: 'https://voice.google.com/u/0/calls?a=nc,%2B18005550111',
            message_type: 'voice',
            created_at: '1m',
            sender: { id: 2, username: 'john', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 1, username: 'admin' },
            is_read: false,
        },
        {
            id: 9,
            content: 'Hello! How are you?',
            message_type: 'text',
            created_at: '1m',
            sender: { id: 2, username: 'john', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 1, username: 'admin' },
            is_read: false,
        },
        {
            id: 10,
            content: 'Hello! How are you?',
            message_type: 'text',
            created_at: '1m',
            sender: { id: 1, username: 'admin', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 2, username: 'john' },
            is_read: true,
        },
        {
            id: 11,
            content: 'https://imgs.search.brave.com/td_mSZ2hVBHK1joTctjOC0qYyKhlwhhymVXfxzUO7Yg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMjYv/MzgwLzg2MS9zbWFs/bC95ZWxsb3ctYmFu/YW5hLXBhdHRlcm4t/aGVhbHRoLWdlbmVy/YXRlLWFpLXBob3Rv/LmpwZw',
            message_type: 'media',
            created_at: '1m',
            sender: { id: 2, username: 'john', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 1, username: 'admin' },
            is_read: false,
        },
        {
            id: 12,
            content: 'https://imgs.search.brave.com/td_mSZ2hVBHK1joTctjOC0qYyKhlwhhymVXfxzUO7Yg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMjYv/MzgwLzg2MS9zbWFs/bC95ZWxsb3ctYmFu/YW5hLXBhdHRlcm4t/aGVhbHRoLWdlbmVy/YXRlLWFpLXBob3Rv/LmpwZw',
            message_type: 'media',
            created_at: '1m',
            sender: { id: 1, username: 'admin', avatar_url: 'https://imgs.search.brave.com/cxRhojvDUtrTJINdGsVrfMDopLSAqVei-OsGZdEj-zY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9paDEu/cmVkYnViYmxlLm5l/dC9pbWFnZS41ODc4/NTY5MzY2LjY0ODQv/ZnBvc3RlcixzbWFs/bCx3YWxsX3RleHR1/cmUsc3F1YXJlX3By/b2R1Y3QsNjAweDYw/MC5qcGc', },
            receiver: { id: 2, username: 'john' },
            is_read: false,
        },
    ]

    const filteredChats = chats.filter(chat =>
        chat.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', width: '100%', height: '91vh', position: 'relative', border: 1, borderColor: 'divider' }}>

            {(!isMobile || !selectedChat) && (
                <Box
                    sx={{
                        position: 'relative',
                        width: { xs: '100%', sm: 400 },
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
                        <Button
                            variant="contained"
                            startIcon={<AddBoxIcon />}
                            sx={{ borderRadius: 1, minWidth: { xs: 10, sm: 'auto', textTransform: "none" } }}
                            size="small"
                            onClick={() => setOpen(true)}
                        >
                            Create New
                        </Button>
                    </Box>

                    <Box sx={{ py: 2, px: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Search chat"
                            variant="outlined"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
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
                            {filteredChats.map(chat => (
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
                                    <ListItemAvatar>
                                        <Avatar src={chat.avatar_url} sx={{ borderRadius: 12 }}>
                                            {chat.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>

                                    <Box sx={{ flex: 1, ml: 1, overflow: 'hidden' }}>
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
                                            {chat.last_sended_at}
                                        </Typography>
                                        {chat.unread && (
                                            <Box
                                                sx={{
                                                    width: 15,
                                                    height: 15,
                                                    fontSize: 9,
                                                    mt: 0.25,
                                                    backgroundColor: chat.unread > 0 ? 'orange' : 'grey',
                                                    color: chat.unread > 0 ? 'white' : 'black',
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
                                                    {chat.unread}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

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

            <CreateChatDialog
                open={open}
                onClose={() => setOpen(false)}
            />

        </Box>
    );
}

export default ChatPage;
