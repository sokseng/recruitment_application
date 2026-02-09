
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    Avatar,
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../../../services/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function ChatMenuDialog({ open, onClose, user, roomId }) {
    const [tabValue, setTabValue] = useState(0);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        if (!open || !roomId) {
            setMessages([]);
            setErrorMsg(null);
            return;
        }

        let isMounted = true;

        const loadChatHistory = async () => {
            setLoading(true);
            setErrorMsg(null);

            try {
                const response = await api.get(`/chat/room/${roomId}/messages`, {
                    params: {
                        limit: 120,
                        offset: 0,
                    },
                });

                if (isMounted) {
                    setMessages(response.data || []);
                }
            } catch (err) {
                console.error('Failed to load chat history for profile', err);
                if (isMounted) {
                    setErrorMsg('Could not load media / voice / links history');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadChatHistory();

        return () => {
            isMounted = false;
        };
    }, [open, roomId, tabValue]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const mediaMessages = messages.filter(
        (m) => (m.type === 'image' || m.type === 'video') && m.file_url
    );

    const voiceMessages = messages.filter(
        (m) => m.type === 'voice' && m.file_url
    );

    const linkMessages = messages.filter((m) => {
        if (m.type === 'text' && m.content && /https?:\/\/[^\s]+/.test(m.content)) {
            return true;
        }

        if (m.type === 'file' && m.file_url) {
            return true;
        }


        return false;
    });

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ position: 'relative', textAlign: 'center', py: 1 }}>
                    <Avatar
                        src={user?.avatar_url || undefined}
                        sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                    >
                        {user?.username?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>

                    <Typography variant="h6">{user?.username || 'User'}</Typography>

                    <Typography
                        variant="caption"
                        color={user?.is_online ? 'success.main' : 'text.secondary'}
                    >
                        {user?.is_online ? 'Online' : 'Offline'}
                    </Typography>

                    <IconButton
                        onClick={handleMenuOpen}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                    >
                        <MoreVertIcon />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleMenuClose}>Mute notifications</MenuItem>
                        <MenuItem onClick={handleMenuClose}>Report user</MenuItem>
                        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
                            Block user
                        </MenuItem>
                    </Menu>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 2, pb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Media" />
                    <Tab label="Voice" />
                    <Tab label="Links" />
                </Tabs>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : errorMsg ? (
                    <Typography color="error" align="center" sx={{ py: 6 }}>
                        {errorMsg}
                    </Typography>
                ) : (
                    <>
                        {tabValue === 0 && (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                    gap: 1.5,
                                }}
                            >
                                {mediaMessages.length === 0 ? (
                                    <Typography
                                        color="text.secondary"
                                        align="center"
                                        sx={{ gridColumn: '1 / -1', py: 8 }}
                                    >
                                        No images or videos shared yet
                                    </Typography>
                                ) : (
                                    mediaMessages.map((msg) => (
                                        <Box
                                            key={msg.id}
                                            sx={{
                                                aspectRatio: '1',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                bgcolor: 'grey.100',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => {
                                                if (msg.file_url) {
                                                    window.open(`${BASE_URL}${msg.file_url}`, '_blank');
                                                }
                                            }}
                                        >
                                            {msg.type === 'video' ? (
                                                <video
                                                    src={`${BASE_URL}${msg.file_url}`}
                                                    muted
                                                    loop
                                                    playsInline
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={`${BASE_URL}${msg.file_url}`}
                                                    alt="chat media"
                                                    loading="lazy"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    ))
                                )}
                            </Box>
                        )}

                        {tabValue === 1 && (
                            <Box sx={{ px: 1 }}>
                                {voiceMessages.length === 0 ? (
                                    <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                                        No voice messages yet
                                    </Typography>
                                ) : (
                                    voiceMessages.map((msg) => (
                                        <Box key={msg.id} sx={{ mb: 3 }}>
                                            <audio
                                                controls
                                                src={`${BASE_URL}${msg.file_url}`}
                                                style={{ width: '100%' }}
                                            />
                                            {msg.content && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ mt: 0.5, display: 'block' }}
                                                >
                                                    {msg.content}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))
                                )}
                            </Box>
                        )}
                        {tabValue === 2 && (
                            <Box sx={{ px: 1, py: 1 }}>
                                {linkMessages.length === 0 ? (
                                    <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                                        No links or documents shared yet
                                    </Typography>
                                ) : (
                                    linkMessages.map((msg) => {
                                        if (msg.type === 'text') {
                                            const urlMatch = msg.content?.match(/https?:\/\/[^\s]+/);
                                            const url = urlMatch ? urlMatch[0] : '';

                                            return (
                                                <Box key={msg.id} sx={{ mb: 2.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                                                    <Typography
                                                        component="a"
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        color="primary"
                                                        variant="body2"
                                                        sx={{ wordBreak: 'break-all', fontWeight: 500 }}
                                                    >
                                                        {url}
                                                    </Typography>
                                                    {msg.content && msg.content !== url && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                            {msg.content}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        }

                                        // File message (PDF, doc, etc.)
                                        if (msg.type === 'file' && msg.file_url) {
                                            const fileName = msg.file_url.split('/').pop() || 'document.pdf';
                                            const isPdf = /\.pdf$/i.test(fileName);

                                            return (
                                                <Box
                                                    key={msg.id}
                                                    sx={{
                                                        mb: 2,
                                                        p: 2,
                                                        bgcolor: 'grey.50',
                                                        borderRadius: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                        '&:hover': { bgcolor: 'grey.100' },
                                                        transition: 'background-color 0.2s',
                                                    }}
                                                >
                                                    <Box sx={{ fontSize: 32, color: isPdf ? '#d32f2f' : 'primary.main' }}>
                                                        {isPdf ? '📄' : '📎'}
                                                    </Box>

                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            component="a"
                                                            href={`${BASE_URL}${msg.file_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: 500,
                                                                color: 'primary.main',
                                                                textDecoration: 'none',
                                                                display: 'block',
                                                                wordBreak: 'break-all',
                                                            }}
                                                        >
                                                            {fileName}
                                                        </Typography>

                                                        {msg.content && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ display: 'block', mt: 0.5 }}
                                                            >
                                                                {msg.content}
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                        {new Date(msg.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            );
                                        }

                                        return null;
                                    })
                                )}
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ChatMenuDialog;