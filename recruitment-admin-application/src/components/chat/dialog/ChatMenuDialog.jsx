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
    ListItemIcon,
    ListItemText,
    DialogActions,
    Button
} from '@mui/material';
import { useEffect, useState, useRef, useMemo } from 'react';
import api from '../../../services/api';
import { VoiceMessagePlayer } from '../VoiceMessagePlayer';
import ChatFile from '../ChatFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BackHandIcon from '@mui/icons-material/BackHand';
import BlockIcon from '@mui/icons-material/Block';
import MediaPreviewDialog from './MediaPreviewDialog';
import { useTranslation } from 'react-i18next';
import ViewProfileDialog from './ViewProfileDialog';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function ChatMenuDialog({ open, onClose, user, roomId, currentUserId, onBlockUser, blockMessage }) {
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [previewIndex, setPreviewIndex] = useState(null);

    const LIMIT = 10;
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState(null);

    const scrollRef = useRef(null);
    const loadMoreRef = useRef(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [actionType, setActionType] = useState('block');

    const TAB_TYPES = ['media', 'voice', 'file'];
    const activeTypeRef = useRef(TAB_TYPES[0]);

    const loadSharedMedia = async (reset = false) => {
        if (loading || loadingMore) return;

        const type = activeTypeRef.current;

        try {
            if (reset) {
                setLoading(true);
                setCursor(null);
                setHasMore(true);
                setMessages([]);
            } else {
                setLoadingMore(true);
            }

            const response = await api.get(`/chat/rooms/${roomId}/shared-media`, {
                params: {
                    limit: LIMIT,
                    cursor: reset ? null : cursor,
                    type,
                },
            });

            const { data = [], nextCursor, hasMore: backendHasMore } = response.data;

            setMessages(prev => reset ? data : [...prev, ...data]);
            setCursor(nextCursor);
            setHasMore(backendHasMore);

        } catch (err) {
            console.error("Failed to load shared media", err);
            setErrorMsg(t('load_shared_media_failed'));
            setHasMore(false);
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

        activeTypeRef.current = TAB_TYPES[tabValue];
        loadSharedMedia(true);

        if (scrollRef.current) scrollRef.current.scrollTop = 0;
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
                    !loading &&
                    scrollRef.current.scrollHeight > scrollRef.current.clientHeight
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
        activeTypeRef.current = TAB_TYPES[newValue];
        loadSharedMedia(true);
    };

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleBlockClick = () => {
        if (blockMessage?.is_blocked) {
            if (blockMessage?.blocked_by_user?.pk_id !== currentUserId) {
                alert(t('only_blocker_can_unblock'));
                return;
            }
            setActionType('unblock');
        } else {
            setActionType('block');
        }
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setConfirmOpen(false);
        await onBlockUser(actionType === 'block');
        handleMenuClose();
        onClose();
    };

    const filteredMedia = useMemo(
        () => messages.filter(msg => msg.type === 'image' || msg.type === 'video' || msg.type === 'voice' || msg.type === 'file'),
        [messages]
    );

    const openPreview = (index) => {
        setPreviewIndex(index);
    };

    const closePreview = () => setPreviewIndex(null);

    const showPrev = () => {
        if (previewIndex > 0) setPreviewIndex(previewIndex - 1);
    };

    const showNext = () => {
        if (previewIndex < filteredMedia.length - 1) setPreviewIndex(previewIndex + 1);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ position: 'relative', textAlign: 'center', py: 1 }}>
                        <Avatar
                            src={`${BASE_URL}/uploads/user/profile/${user?.profile_image}`}
                            sx={{
                                width: 80,
                                height: 80,
                                mx: 'auto',
                                mb: 1,
                                transition: 'transform 0.1s ease-in-out',
                                '&:hover': {
                                    transform: '(1.1)'
                                }
                            }}
                            onClick={() => setOpenProfile(true)}
                        >
                            {user?.username?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>

                        <Typography variant="h6">{user?.username || t('user')}</Typography>

                        <Typography
                            variant="caption"
                            color={user?.is_online ? 'success.main' : 'text.secondary'}
                        >
                            {user?.is_online ? t('online') : t('offline')}
                        </Typography>

                        {(!blockMessage?.is_blocked || blockMessage?.blocked_by_user?.pk_id === currentUserId) && (
                            <IconButton
                                onClick={handleMenuOpen}
                                sx={{ position: 'absolute', top: 8, right: 8 }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        )}

                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                            <MenuItem onClick={(e) => { e.stopPropagation(); handleBlockClick(); }} sx={{ color: 'error.main' }}>
                                <ListItemIcon>
                                    {!blockMessage?.is_blocked ? (
                                        <BackHandIcon fontSize="small" sx={{ color: 'error.main' }} />
                                    ) : (
                                        <BlockIcon fontSize="small" sx={{ color: 'black' }} />
                                    )}
                                </ListItemIcon>
                                <ListItemText sx={{ color: !blockMessage?.is_blocked ? 'error.main' : 'black' }}>
                                    {blockMessage?.is_blocked ? t('unblock_user') : t('block_user')}
                                </ListItemText>
                            </MenuItem>
                        </Menu>
                    </Box>
                </DialogTitle>

                <DialogContent ref={scrollRef} sx={{ px: 2, pb: 3, maxHeight: 500, overflowY: 'auto' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label={t('media')} />
                        <Tab label={t('voice')} />
                        <Tab label={t('file')} />
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
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1.5 }}>
                                    {messages.length === 0 ? (
                                        <Typography color="text.secondary" align="center" sx={{ gridColumn: '1 / -1', py: 8 }}>
                                            {t('no_media_shared')}
                                        </Typography>
                                    ) : (
                                        messages.map(msg => (
                                            <Box
                                                key={msg.id}
                                                sx={{ position: 'relative', aspectRatio: '1', borderRadius: 2, overflow: 'hidden', bgcolor: 'grey.100', cursor: 'pointer', mb: 1 }}
                                                onClick={() => openPreview(filteredMedia.findIndex(m => m.id === msg.id))}
                                            >
                                                {msg.type === 'video' ? (
                                                    <>
                                                        <video src={`${BASE_URL}${msg.file_url}`} muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <PlayArrowIcon sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: 48, opacity: 0.8, pointerEvents: 'none' }} />
                                                    </>
                                                ) : (
                                                    <img src={`${BASE_URL}${msg.file_url}`} alt="chat media" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box sx={{ px: 1 }}>
                                    {messages.length === 0 ? (
                                        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>{t('no_voice_messages')}</Typography>
                                    ) : (
                                        messages.map(msg => {
                                            const isOwn = currentUserId === msg.sender_id;
                                            return (
                                                <Box key={msg.id} sx={{ px: 2, py: 1, bgcolor: isOwn ? 'primary.main' : 'grey.100', boxShadow: 2, color: isOwn ? 'white' : 'text.primary', borderRadius: 2, mb: 1 }}>
                                                    <VoiceMessagePlayer url={`${BASE_URL}${msg.file_url}`} isOwn={isOwn} />
                                                </Box>
                                            )
                                        })
                                    )}
                                </Box>
                            )}

                            {tabValue === 2 && (
                                <Box sx={{ px: 1 }}>
                                    {messages.length === 0 ? (
                                        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>{t('no_files_shared')}</Typography>
                                    ) : (
                                        messages.map(msg => {
                                            const isOwn = currentUserId === msg.sender_id;
                                            return (
                                                <Box key={msg.id} sx={{ px: 2, py: 1, bgcolor: isOwn ? 'primary.main' : 'grey.100', boxShadow: 2, color: isOwn ? 'white' : 'text.primary', borderRadius: 2, mb: 1 }}>
                                                    <ChatFile fileUrl={`${BASE_URL}${msg.file_url}`} isOwn={isOwn} />
                                                </Box>
                                            )
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

            {previewIndex !== null && (
                <MediaPreviewDialog
                    open={previewIndex !== null}
                    onClose={closePreview}
                    mediaMessages={filteredMedia}
                    currentIndex={previewIndex}
                    onPrev={showPrev}
                    onNext={showNext}
                    BASE_URL={BASE_URL}
                />
            )}

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>
                    {actionType === 'block' ? t('block_user') : t('unblock_user')}
                </DialogTitle>

                <DialogContent>
                    {t('confirm_block_message', {
                        action: actionType === 'block' ? t('block') : t('unblock'),
                        username: user?.username || t('this_user')
                    })}
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => setConfirmOpen(false)}
                        color="primary"
                    >
                        {t('cancel')}
                    </Button>

                    <Button
                        onClick={handleConfirm}
                        color="error"
                    >
                        {actionType === 'block' ? t('block') : t('unblock')}
                    </Button>
                </DialogActions>
            </Dialog>

            <ViewProfileDialog
                open={openProfile}
                onClose={() => setOpenProfile(false)}
                imageUrl={`${BASE_URL}/uploads/user/profile/${user?.profile_image}`}
            />
        </>
    );
}

export default ChatMenuDialog;