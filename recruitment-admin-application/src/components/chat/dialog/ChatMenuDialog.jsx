
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
import { useEffect, useState, useRef, useMemo } from 'react';
import api from '../../../services/api';
import { VoiceMessagePlayer } from '../VoiceMessagePlayer';
import ChatFile from '../ChatFile';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function ChatMenuDialog({ open, onClose, user, roomId, currentUserId }) {
    const [tabValue, setTabValue] = useState(0);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [previewMedia, setPreviewMedia] = useState(null);

    const LIMIT = 30;

    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState(null);

    const scrollRef = useRef(null);
    const loadMoreRef = useRef(null);

    const loadSharedMedia = async (reset = false) => {
        if (loading || loadingMore) return;

        try {
            if (reset) {
                setLoading(true);
                setCursor(null);
                setHasMore(true);
            } else {
                setLoadingMore(true);
            }

            const response = await api.get(
                `/chat/rooms/${roomId}/shared-media`,
                {
                    params: {
                        limit: LIMIT,
                        cursor: reset ? null : cursor,
                    },
                }
            );

            const { data, nextCursor } = response.data;

            setMessages(prev =>
                reset ? data : [...prev, ...data]
            );

            setCursor(nextCursor);
            setHasMore(Boolean(nextCursor));

        } catch (err) {
            console.error("Failed to load shared media", err);
            setErrorMsg("Could not load shared media");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!open || !roomId) {
            setMessages([]);
            setCursor(null);
            setHasMore(true);
            setErrorMsg(null);
            return;
        }

        loadSharedMedia(true);

        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [open, roomId]);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasMore &&
                    !loadingMore &&
                    !loading
                ) {
                    loadSharedMedia();
                }
            },
            {
                root: scrollRef.current,
                threshold: 0.1,
            }
        );

        observer.observe(target);

        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const { mediaMessages, voiceMessages, fileMessages } = useMemo(() => {
        const media = [];
        const voice = [];
        const file = [];

        for (const m of messages) {
            if (!m.file_url) continue;

            if (m.type === 'image' || m.type === 'video') {
                media.push(m);
            } else if (m.type === 'voice') {
                voice.push(m);
            } else if (m.type === 'file') {
                file.push(m);
            }
        }

        return {
            mediaMessages: media,
            voiceMessages: voice,
            fileMessages: file,
        };
    }, [messages]);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
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

                <DialogContent
                    ref={scrollRef}
                    sx={{
                        px: 2,
                        pb: 3,
                        maxHeight: 500,
                        overflowY: 'auto',
                    }}
                >
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label="Media" />
                        <Tab label="Voice" />
                        <Tab label="File" />
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
                            {/* TAB CONTENT */}
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
                                                    mb: 1
                                                }}
                                                onClick={() => setPreviewMedia(msg)}
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
                                        voiceMessages.map((msg) => {
                                            const isOwn = currentUserId === msg.sender_id;
                                            return (
                                                <Box key={msg.id}
                                                    sx={{
                                                        px: msg.type === 'image' || msg.type === 'video' ? 0 : 2,
                                                        py: msg.type === 'image' || msg.type === 'video' ? 0 : 1,
                                                        bgcolor:
                                                            msg.type === 'image' || msg.type === 'video'
                                                                ? 'transparent'
                                                                : isOwn
                                                                    ? 'primary.main'
                                                                    : 'grey.100',
                                                        boxShadow: msg.type === 'image' || msg.type === 'video' ? 0 : 2,
                                                        color: isOwn ? 'white' : 'text.primary',
                                                        borderRadius: 2,
                                                        '&:hover': {
                                                            bgcolor:
                                                                msg.type === 'image' || msg.type === 'video'
                                                                    ? 'transparent'
                                                                    : isOwn
                                                                        ? '#1f62a5ff'
                                                                        : 'grey.200',
                                                            transition: 'transform 0.2s ease',
                                                        },
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        mb: 1
                                                    }}
                                                >
                                                    <VoiceMessagePlayer
                                                        url={`${BASE_URL}${msg.file_url}`}
                                                        isOwn={isOwn}
                                                    />
                                                </Box>
                                            )
                                        })
                                    )}
                                </Box>
                            )}

                            {tabValue === 2 && (
                                <Box sx={{ px: 1 }}>
                                    {fileMessages.length === 0 ? (
                                        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                                            No files shared yet
                                        </Typography>
                                    ) : (
                                        fileMessages.map((msg) => {
                                            const isOwn = currentUserId === msg.sender_id;
                                            return (
                                                <Box key={msg.id}
                                                    sx={{
                                                        px: msg.type === 'image' || msg.type === 'video' ? 0 : 2,
                                                        py: msg.type === 'image' || msg.type === 'video' ? 0 : 1,
                                                        bgcolor:
                                                            msg.type === 'image' || msg.type === 'video'
                                                                ? 'transparent'
                                                                : isOwn
                                                                    ? 'primary.main'
                                                                    : 'grey.100',
                                                        boxShadow: msg.type === 'image' || msg.type === 'video' ? 0 : 2,
                                                        color: isOwn ? 'white' : 'text.primary',
                                                        borderRadius: 2,
                                                        '&:hover': {
                                                            bgcolor:
                                                                msg.type === 'image' || msg.type === 'video'
                                                                    ? 'transparent'
                                                                    : isOwn
                                                                        ? '#1f62a5ff'
                                                                        : 'grey.200',
                                                            transition: 'transform 0.2s ease',
                                                        },
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        mb: 1
                                                    }}
                                                >
                                                    <ChatFile
                                                        fileUrl={`${BASE_URL}${msg.file_url}`}
                                                        isOwn={isOwn}
                                                    />
                                                </Box>
                                            );
                                        })
                                    )}
                                </Box>
                            )}

                            {loadingMore && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}
                        </>
                    )}
                    <Box ref={loadMoreRef} />
                </DialogContent>
            </Dialog>
            {previewMedia && (
                <Dialog
                    open={Boolean(previewMedia)}
                    onClose={() => setPreviewMedia(null)}
                    maxWidth="md"
                    fullWidth
                >
                    {previewMedia?.type === 'video' ? (
                        <video
                            src={`${BASE_URL}${previewMedia.file_url}`}
                            controls
                            autoPlay
                            style={{ width: '100%' }}
                        />
                    ) : (
                        <img
                            src={`${BASE_URL}${previewMedia.file_url}`}
                            alt="preview"
                            style={{ width: '100%' }}
                        />
                    )}
                </Dialog>
            )}
        </>
    );
}

export default ChatMenuDialog;