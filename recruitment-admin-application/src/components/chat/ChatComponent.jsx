import {
    ArrowBack as ArrowBackIcon,
    EmojiEmotions as EmojiEmotionsIcon,
    InsertEmoticon as InsertEmoticonIcon,
} from '@mui/icons-material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CallIcon from '@mui/icons-material/Call';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import VideocamIcon from '@mui/icons-material/Videocam';
import { Alert, AppBar, Avatar, Box, CircularProgress, IconButton, Paper, Snackbar, TextField, Toolbar, Typography, Button } from "@mui/material";
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import ChatMenuDialog from './dialog/ChatMenuDialog';
import EmojiPicker from './EmojiPicker';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import DeleteDialog from './dialog/DeleteDialog';
import ForwardDialog from './dialog/ForwardDialog';
import MediaPreviewDialog from './dialog/MediaPreviewDialog';
import PinnedMessageComponent from './PinnedMessageComponent';

const FILE_RULES = {
    image: { extensions: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']) },
    voice: { extensions: new Set(['webm', 'ogg', 'm4a', 'mp3', 'wav']) },
    video: { extensions: new Set(['mp4', 'webm', 'mov', 'mkv', 'avi']) },
    file: { extensions: new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip']) },
};

const MAX_SIZE = 500 * 1024 * 1024; // 500MB

function ChatComponent({ chat, onBack, messages, setMessages, send, currentUserId, isOnline, typingUsers, messagesRef, onScroll, loadingOlderRef, loadingOlder, hasMore, messagesEndRef, pinMessage, reactionsData, onStartCall, blockMessage, scrollToMessage, highlightedMessageId }) {
    const { t } = useTranslation();
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const fileInputRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordTime, setRecordTime] = useState(0);

    const [showContent, setSowContent] = useState(false);
    const emojiButtonRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [popup, setPopup] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);

    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const prevMessageCountRef = useRef(0);
    const justOpenedChatRef = useRef(false);
    const [error, setError] = useState('');
    const [openConfirm, setOpenConfirm] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);

    const [forwardOpen, setForwardOpen] = useState(false);
    const [forwardMessage, setForwardMessage] = useState(null);
    const [forwardRooms, setForwardRooms] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState(new Set());
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [roomOffset, setRoomOffset] = useState(0);
    const [roomsHasMore, setRoomsHasMore] = useState(true);

    const ROOM_LIMIT = 10;

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [previewMedia, setPreviewMedia] = useState('');
    const mediaMessages = messages.filter(msg => {
        if (!['image', 'video'].includes(msg.type)) return false;
        if (!msg.file_url) return false; // skip if no URL
        return true;
    });

    const [uploadingFiles, setUploadingFiles] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const isUploading = isSending || uploadingFiles.length > 0;
    const [deleting, setDeleting] = useState(false);

    const checkMediaUrl = async (url) => {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch {
            return false;
        }
    };

    const handleOpenPreview = async (message) => {
        const validMedia = await Promise.all(mediaMessages.map(async (msg) => {
            const isValid = await checkMediaUrl(`${BASE_URL}${msg.file_url}`);
            return isValid ? msg : null;
        }));
        const filtered = validMedia.filter(Boolean);

        const index = filtered.findIndex(m => m.id === message.id);
        if (index !== -1) {
            setPreviewMedia(filtered); // store only valid media
            setPreviewIndex(index);
            setPreviewOpen(true);
        }
    };

    const handleClosePreview = () => setPreviewOpen(false);

    const handlePrevPreview = () => {
        setPreviewIndex((prev) => (prev > 0 ? prev - 1 : mediaMessages.length - 1));
    }

    const handleNextPreview = () => {
        setPreviewIndex((prev) => (prev < mediaMessages.length - 1 ? prev + 1 : 0));
    }

    const startTyping = () => {
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            send({ type: "typing", is_typing: true });
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 1200);
    };

    const stopTyping = () => {
        if (isTypingRef.current) {
            isTypingRef.current = false;
            send({ type: "typing", is_typing: false });
        }
        clearTimeout(typingTimeoutRef.current);
    };

    const onInputChange = (e) => {
        const value = e.target.value;
        setNewMessage(value);

        if (value.trim()) {
            startTyping();
        } else {
            stopTyping();
        }
    };

    useEffect(() => {
        return () => stopTyping();
    }, []);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        setIsRecording(true);
        setRecordTime(0);

        timerRef.current = setInterval(() => {
            setRecordTime((t) => t + 1);
        }, 1000);

        mediaRecorderRef.current.ondataavailable = (e) => {
            audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
            clearInterval(timerRef.current);
        };

        mediaRecorderRef.current.start();
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setAudioBlob(null);
        setIsRecording(false);
        clearInterval(timerRef.current);
    };

    // Helper to stop and get blob for sending
    const stopRecordingAndGetBlob = () => {
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current) return resolve(null);

            const recorder = mediaRecorderRef.current;

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                clearInterval(timerRef.current);
                resolve(blob);
            };

            recorder.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    };

    const isNearBottom = (threshold = 50) => {
        const el = messagesRef.current;
        if (!el) return false;

        return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };

    useEffect(() => {
        if (!chat?.room_id) return;

        justOpenedChatRef.current = true;

        const timer = setTimeout(() => {
            scrollToBottom();
            justOpenedChatRef.current = false;
        }, 50);

        return () => clearTimeout(timer);
    }, [chat?.room_id]);

    useEffect(() => {
        const prevCount = prevMessageCountRef.current;
        const currentCount = messages.length;

        if (
            currentCount > prevCount &&
            !loadingOlderRef.current &&
            isNearBottom()
        ) {
            scrollToBottom();
        }

        prevMessageCountRef.current = currentCount;
    }, [messages]);

    const handleFileSelect = (e) => {
        if (isRecording || audioBlob) return;

        const files = Array.from(e.target.files);

        const invalidFiles = files.filter((file) => {
            const ext = file.name.split('.').pop().toLowerCase();
            const allowed = Object.values(FILE_RULES).some((rule) => rule.extensions.has(ext));
            return !allowed || file.size > MAX_SIZE;
        });

        if (invalidFiles.length > 0) {
            const messages = invalidFiles.map((f) => {
                const ext = f.name.split('.').pop().toLowerCase();
                if (!Object.values(FILE_RULES).some(rule => rule.extensions.has(ext))) return `${f.name} (${t('invalid_type')})`;
                if (f.size > MAX_SIZE) return `${f.name} (${t('exceeds_limit')})`;
                return f.name;
            });
            setError(t('invalid_files', { files: messages.join(', ') }));
            e.target.value = '';
            return;
        }

        setSelectedFiles((prev) => [...prev, ...files]);

        e.target.value = '';
    };

    const removeFile = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const clearFiles = () => {
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getFileType = (file) => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('audio/')) return 'voice';
        if (file.type.startsWith('video/')) return 'video';
        return 'file';
    };

    const uploadFileMessage = async ({ file, type, caption }) => {
        const formData = new FormData();
        formData.append("room_id", chat.room_id);
        formData.append("type", type);  // "image" | "voice"
        if (caption) formData.append("content", caption);
        if (replyingTo) formData.append("reply_to_id", replyingTo.id);
        formData.append("file", file);

        const res = await api.post("/chat/messages/file", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return res;

    }

    const sendTextMessage = async (content) => {
        const res = await api.post("/chat/messages", {
            room_id: chat.room_id,
            content,
            reply_to_id: replyingTo?.id || null,
        });
        return res;
    }

    const handleSend = async () => {
        if (!chat?.room_id || !send || isSending) return;

        setIsSending(true);
        try {
            const addMessage = (msg) => {
                setMessages(prev => {
                    // skip duplicates
                    if (prev.some(m => m.id === msg.id)) return prev;
                    const updated = [...prev, msg];
                    if (isNearBottom() || prev.length === 0) {
                        setTimeout(scrollToBottom, 50);
                    }
                    return updated;
                });
            };

            if (editingMessage) {
                if (!newMessage.trim()) return;

                try {
                    await api.put(`/chat/room/${chat.room_id}/messages/${editingMessage.id}/text`, {
                        content: newMessage.trim()
                    });
                    stopTyping();
                    setEditingMessage(null);
                    setNewMessage('');
                } catch (err) {
                    const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
                    console.error(err);
                    setError(t(`Failed to edit message: ${errorMessage}`));
                }
                return;
            }

            if (isRecording) {
                try {
                    const blob = await stopRecordingAndGetBlob();
                    if (blob) {
                        const audioFile = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
                        const res = await uploadFileMessage({ file: audioFile, type: 'voice' });
                        addMessage(res.data);
                        setReplyingTo(null);
                        setAudioBlob(null);
                        setRecordTime(0);
                        setTimeout(scrollToBottom, 50);
                    }
                } catch (err) {
                    console.error(err);
                    setError(t("Failed to send recorded audio"));
                }
                return;
            }

            if (audioBlob) {
                const id = `temp-voice-${Date.now()}`;
                setUploadingFiles(prev => [
                    ...prev,
                    { id, sender_id: currentUserId, type: 'voice', isUploading: true, progress: 0 }
                ]);

                try {
                    const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: audioBlob.type });
                    const res = await uploadFileMessage({ file: audioFile, type: 'voice' });
                    addMessage(res.data);
                } catch (err) {
                    const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
                    console.error(err);
                    setError(t(`Failed to send audio: ${errorMessage}`));
                } finally {
                    setUploadingFiles(prev => prev.filter(f => f.id !== id));
                    setAudioBlob(null);
                    setRecordTime(0);
                }
                return;
            }

            if (selectedFiles.length > 0) {
                const filesToUpload = selectedFiles.map(file => ({
                    file,
                    id: `temp-${file.name}-${Date.now()}`,
                    type: getFileType(file),
                    progress: 0
                }));

                const placeholders = filesToUpload.map(item => ({
                    id: item.id,
                    sender_id: currentUserId,
                    type: item.type,
                    content: item.file.name,
                    isUploading: true,
                    progress: 0
                }));

                setUploadingFiles(prev => [...prev, ...placeholders]);

                for (const item of filesToUpload) {
                    try {
                        const res = await uploadFileMessage({
                            file: item.file,
                            type: item.type,
                            caption: newMessage || null,
                            onUploadProgress: (e) => {
                                const progress = Math.round((e.loaded * 100) / e.total);
                                setUploadingFiles(prev =>
                                    prev.map(f => f.id === item.id ? { ...f, progress } : f)
                                );
                            }
                        });

                        addMessage(res.data);
                        setSelectedFiles(prev => prev.filter(f => f !== item.file));
                    } catch (err) {
                        const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
                        console.error(err);
                        setError(t(`Failed to upload ${item.file.name}: ${errorMessage}`));
                    } finally {
                        setUploadingFiles(prev => prev.filter(f => f.id !== item.id));
                    }
                }

                setSelectedFiles([]);
                setNewMessage('');
                setReplyingTo(null);
                clearFiles();
                return;
            }

            if (newMessage.trim()) {
                try {
                    await sendTextMessage(newMessage.trim());
                    setNewMessage('');
                    setReplyingTo(null);
                    stopTyping();
                    setTimeout(scrollToBottom, 50);
                } catch (err) {
                    const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
                    console.error(err);
                    setError(t(`Failed to send message: ${errorMessage}`));
                }
            }

        } finally {
            setIsSending(false);
        }
    };

    const deleteLocalMessage = (messageId) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    };


    const handleDeleteMessage = (message) => {
        setMessageToDelete(message);
        setOpenConfirm(true);
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;

        try {
            setDeleting(true);
            await api.delete(`/chat/room/${chat.room_id}/messages/${messageToDelete.id}`);

            deleteLocalMessage(messageToDelete.id);

            setOpenConfirm(false);
            setMessageToDelete(null);
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
            console.error(err);
            setError(t(`Failed to delete: ${errorMessage}`));
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setOpenConfirm(false);
        setMessageToDelete(null);
    };

    const handleEditMessage = (message) => {
        setEditingMessage(message);
        setNewMessage(message.content || '');
    };

    const fetchForwardRooms = async () => {
        if (loadingRooms || !roomsHasMore) return;

        setLoadingRooms(true);

        const res = await api.get(`/chat/${chat.room_id}`, {
            params: {
                limit: ROOM_LIMIT,
                offset: roomOffset,
            },
        });

        setForwardRooms(prev => [...prev, ...res.data.items]);
        setRoomsHasMore(res.data.has_more);
        setRoomOffset(prev => prev + ROOM_LIMIT);
        setLoadingRooms(false);
    };

    useEffect(() => {
        if (forwardOpen) {
            fetchForwardRooms();
        }
    }, [forwardOpen]);

    const handleForwardMessage = (message) => {
        setForwardMessage(message);
        setForwardOpen(true);
        setForwardRooms([]);
        setSelectedRooms(new Set());
        setRoomOffset(0);
        setRoomsHasMore(true);
    }

    const toggleRoomSelection = (roomId) => {
        setSelectedRooms(prev => {
            const copy = new Set(prev);
            copy.has(roomId) ? copy.delete(roomId) : copy.add(roomId);
            return copy;
        });
    };

    const confirmForward = async () => {
        if (!forwardMessage || selectedRooms.size === 0) return;

        const payload = {
            message_id: forwardMessage.id,
            target_room_ids: Array.from(selectedRooms),
        };

        try {
            await api.post("/chat/messages/forward", payload);

            setForwardOpen(false);
            setForwardMessage(null);
            setSelectedRooms(new Set());
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
            console.error(err);
            setError(t(`Failed to forward ${errorMessage}`));
        }
    };

    const handleReplaceMessage = (message) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = Object.values(FILE_RULES)
            .flatMap(r => [...r.extensions])
            .map(ext => `.${ext}`)
            .join(',');

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const ext = file.name.split('.').pop().toLowerCase();
            const allowed = Object.values(FILE_RULES)
                .some(rule => rule.extensions.has(ext));
            if (!allowed) {
                setError(t('invalid_file_type'));
                return;
            }
            if (file.size > MAX_SIZE) {
                setError(t('file_exceeds_limit'));
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('file_type', message.type);
            formData.append('caption', message.content || '');

            try {
                const data = await api.put(
                    `/chat/room/${chat.room_id}/messages/${message.id}/file`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );

                setMessages(prev =>
                    prev.map(m =>
                        m.id === data.id
                            ? { ...m, file_url: data.file_url, type: data.type, edited_at: data.edited_at }
                            : m
                    )
                )

            } catch (err) {
                const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
                console.error(err);
                setError(t(`replace_failed ${errorMessage}`));
            }
        };

        input.click();
    };

    const handlePinMessage = async (message) => {
        try {
            await api.post(`/chat/rooms/${chat.room_id}/messages/${message.id}/pin`)
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
            console.error("Unpin failed", err);
            setError(`Unpin failed: ${errorMessage}`);
        }

    }

    const handleUnpinMessage = async () => {
        try {
            await api.delete(`/chat/rooms/${chat.room_id}/pin`)
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
            console.error("Unpin failed", err);
            setError(`Unpin failed: ${errorMessage}`);
        }

    }

    const toggleReactMessage = async (message, reactionType) => {
        try {

            await api.post(
                `/chat/rooms/${chat.room_id}/messages/${message.id}/react`,
                { reaction: reactionType }
            );
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
            console.error("Reaction failed", err);
            setError(`Reaction failed ${errorMessage}`);
        }
    };

    const handleRemoveReact = async (messageId) => {
        try {

            await api.delete(
                `/chat/rooms/${chat.room_id}/messages/${messageId}/react`
            );
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err.message || err?.response?.data || "Unknown error";
            console.error("Reaction failed", err);
            setError(`Reaction failed ${errorMessage}`);
        }
    }

    const isBlocked = blockMessage?.is_blocked ?? false;

    const handleBlockUser = async () => {
        try {
            if (!isBlocked) {
                await api.post(`/chat/rooms/${chat.room_id}/block`);
            } else {
                await api.post(`/chat/rooms/${chat.room_id}/unblock`);
            }
        } catch (e) {
            console.error(`Failed to ${!isBlocked ? 'block' : 'unblock'}`, e);
            setError(`Failed to ${!isBlocked ? 'block' : 'unblock'}`);
        }
    }

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
            }}
        >
            <Snackbar
                open={!!error}
                autoHideDuration={5000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'top', horizontal: 'center', zIndex: 2000 }}
            >
                <Alert 
                    severity="error" 
                    onClose={() => setError('')}
                    sx={{ bgcolor: '#ef4444', color: 'white' }}
                >
                    {error}
                </Alert>
            </Snackbar>
            {chat !== null ? (
                <Box
                    sx={{
                        width: '100%',
                    }}
                >
                    <AppBar
                        position="static"
                        elevation={2}
                        sx={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 0%, #f97316 150%)',
                            borderBottom: 1,
                            borderColor: 'rgba(249, 115, 22, 0.3)',
                            zIndex: 1300
                        }}
                        onClick={() => setPopup(true)}
                    >
                        <Toolbar
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: { xs: 1, sm: 2 },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                                        display: { xs: 'block', md: 'none' }
                                    }}
                                    onClick={onBack}
                                >
                                    <ArrowBackIcon />
                                </IconButton>

                                <Avatar
                                    sx={{
                                        width: { xs: 38, md: 44 },
                                        height: { xs: 38, md: 44 },
                                        border: 1,
                                         borderColor: 'rgba(255,255,255,0.5)',
                                        fontSize: 28
                                    }}
                                    src={`${BASE_URL}/uploads/user/profile/${chat?.profile_image}`}
                                // onClick={() => setOpen(true)}
                                >
                                    {chat?.username?.charAt(0).toUpperCase() || 'P'}
                                </Avatar>

                                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                    <Typography variant="h6" fontWeight={600} noWrap sx={{ color: 'white' }}>
                                        {chat?.username || t('unknown_user')}
                                    </Typography>

                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            color: typingUsers[chat?.user_id] 
                                                ? '#fbbf24' 
                                                : isOnline 
                                                    ? '#017110' 
                                                    : 'rgba(255,255,255,0.7)', 
                                            fontWeight: 'bold' 
                                        }} 
                                        noWrap
                                    >
                                        {typingUsers[chat?.user_id] ? t('typing') : isOnline ? t('online') : t('offline')}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: { xs: 1, sm: 2 },
                                    alignItems: 'center',
                                }}
                            >
                                <CallIcon
                                    sx={{
                                        fontSize: { xs: 22, md: 26 },
                                        color: isBlocked ? 'rgba(255,255,255,0.4)' : 'white',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.15)',
                                            color: isBlocked ? 'rgba(255,255,255,0.4)' : '#fbbf24',
                                        },
                                        cursor: isBlocked ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isBlocked) return;
                                        onStartCall(chat.room_id, 'voice');
                                    }}
                                />
                                <VideocamIcon
                                    sx={{
                                        fontSize: { xs: 24, md: 30 },
                                        color: isBlocked ? 'rgba(255,255,255,0.4)' : 'white',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.15)',
                                            color: isBlocked ? 'rgba(255,255,255,0.4)' : '#fbbf24',
                                        },
                                        cursor: isBlocked ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isBlocked) return;
                                        onStartCall(chat.room_id, 'video');
                                    }}
                                />
                            </Box>
                        </Toolbar>
                    </AppBar>
                    {pinMessage && (
                        <Paper
                            elevation={0}
                            sx={{
                                position: 'absolute',
                                top: { xs: 56, md: 64 },
                                width: '100%',
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                borderTop: 1,
                                borderColor: 'rgba(59, 130, 246, 0.2)',
                                bgcolor: 'rgba(239, 246, 255, 0.9)',
                                backdropFilter: 'blur(8px)',
                                zIndex: 1200,
                                borderRadius: 0
                            }}
                        >
                            <PinnedMessageComponent pinMessage={pinMessage} currentUserId={currentUserId} onUnpin={handleUnpinMessage} scrollToMessage={scrollToMessage} />
                        </Paper>
                    )}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >

                        <Box
                            ref={messagesRef}
                            onScroll={onScroll}
                            sx={{
                                height: '75vh',
                                overflowY: 'auto',
                                px: 2,
                                py: 1,
                                background: 'linear-gradient(180deg, rgba(239, 246, 255, 0.6) 0%, rgba(255, 255, 255, 0.9) 100%)',
                                position: 'relative',
                            }}
                        >

                            {hasMore && loadingOlder && (
                                <Box
                                    sx={{
                                        py: 1,
                                        mt: 5,
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CircularProgress size={20} sx={{ color: '#3b82f6' }}/>
                                </Box>
                            )}

                            {messages.length === 0 ? (
                                <Box
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Typography 
                                        variant='h6' 
                                        fontWeight={600}
                                        sx={{
                                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {t('say_something_to')}
                                    </Typography>
                                    <Typography variant='h6' fontWeight={600} sx={{ color: '#f97316' }}>
                                        {chat?.username}
                                    </Typography>
                                </Box>
                            ) : (
                                messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        isOwn={message.sender_id === currentUserId}
                                        isForward={message?.forward_from?.sender?.pk_id === currentUserId}
                                        onEdit={handleEditMessage}
                                        onDelete={handleDeleteMessage}
                                        onReply={(msg) => setReplyingTo(msg)}
                                        onForward={handleForwardMessage}
                                        onReplace={handleReplaceMessage}
                                        onPreview={handleOpenPreview}
                                        onPin={handlePinMessage}
                                        isPin={pinMessage?.message?.id === message?.id}
                                        onUnpin={handleUnpinMessage}
                                        onReact={toggleReactMessage}
                                        reactionsData={reactionsData}
                                        onRemoveReact={handleRemoveReact}
                                        onStartCall={() => { onStartCall(chat.room_id, 'video'); }}
                                        isBlocked={isBlocked}
                                        scrollToMessage={scrollToMessage}
                                        highlightedMessageId={highlightedMessageId}
                                    />
                                )))}

                            {uploadingFiles.map((file) => (
                                <MessageBubble
                                    key={file.id}
                                    message={file}
                                    isOwn={true}
                                    isForward={false}
                                    onEdit={handleEditMessage}
                                    onDelete={handleDeleteMessage}
                                    onReply={(msg) => setReplyingTo(msg)}
                                    onForward={handleForwardMessage}
                                    onReplace={handleReplaceMessage}
                                    onPreview={handleOpenPreview}
                                    onPin={handlePinMessage}
                                    isPin={false}
                                    onUnpin={handleUnpinMessage}
                                    onReact={toggleReactMessage}
                                    reactionsData={reactionsData}
                                    onRemoveReact={handleRemoveReact}
                                    onStartCall={() => { onStartCall(chat.room_id, 'video'); }}
                                    isBlocked={isBlocked}
                                    scrollToMessage={scrollToMessage}
                                    highlightedMessageId={highlightedMessageId}
                                />
                            ))}

                            {Object.entries(typingUsers)
                                .filter(([userId, isTyping]) => isTyping && parseInt(userId) !== currentUserId)
                                .map(([userId]) => (
                                    <TypingIndicator
                                        key={userId}
                                        username={chat.username}
                                    />
                                ))}

                            <div ref={messagesEndRef} />

                        </Box>

                        {selectedFiles.length > 0 && !isRecording && !audioBlob && (
                            <Paper
                                elevation={0}
                                sx={{
                                    position: 'absolute',
                                    bottom: replyingTo ? 120 : 60,
                                    width: '100%',
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderTop: 1,
                                    borderColor: 'rgba(59, 130, 246, 0.2)',
                                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(8px)',
                                    overflowX: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1,
                                        flexGrow: 1,
                                        overflowX: 'auto',
                                        py: 1,
                                        scrollSnapType: 'x mandatory',
                                    }}
                                >
                                    {selectedFiles.map((file, index) => {
                                        const isImage = file.type.startsWith('image/');
                                        const url = isImage ? URL.createObjectURL(file) : null;

                                        const uploadingFile = uploadingFiles.find(f => f.file === file);
                                        const progress = uploadingFile?.progress || 0;
                                        const isUploading = uploadingFile?.isUploading;

                                        return (
                                            <Paper
                                                key={index}
                                                variant="outlined"
                                                sx={{
                                                    flex: '0 0 auto',
                                                    p: 1,
                                                    minWidth: 120,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    position: 'relative',
                                                    borderColor: 'rgba(59, 130, 246, 0.3)',
                                                }}
                                            >
                                                {isImage ? (
                                                    <Box
                                                        component="img"
                                                        src={url}
                                                        alt={file.name}
                                                        sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1 }}
                                                    />
                                                ) : (
                                                    <Typography
                                                        variant="body2"
                                                        noWrap
                                                        sx={{ maxWidth: 100, textAlign: 'center', color: '#1e3a8a' }}
                                                    >
                                                        {file.name}
                                                    </Typography>
                                                )}

                                                {isUploading && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: 'translate(-50%, -50%)',
                                                        }}
                                                    >
                                                        <CircularProgress
                                                            variant={progress ? 'determinate' : 'indeterminate'}
                                                            value={progress}
                                                            size={40}
                                                            thickness={4}
                                                            sx={{ color: '#3b82f6' }}
                                                        />
                                                    </Box>
                                                )}

                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => removeFile(index)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 4,
                                                        right: 4,
                                                        backgroundColor: 'white',
                                                        boxShadow: 1,
                                                        color: '#f97316',
                                                        '&:hover': { color: '#ef4444' },
                                                    }}
                                                >
                                                    <CloseIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Paper>
                                        );
                                    })}
                                </Box>

                            </Paper>
                        )}

                        {editingMessage && (
                            <Box sx={{
                                position: 'absolute',
                                bottom: 60,
                                width: '100%',
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                borderTop: 1,
                                borderColor: 'rgba(59, 130, 246, 0.2)',
                                bgcolor: 'rgba(239, 246, 255, 0.95)',
                                backdropFilter: 'blur(8px)',
                                justifyContent: 'space-between'
                            }}>
                                <Typography sx={{ color: '#3b82f6', fontWeight: 600 }}>
                                    {t('editing_message')}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setEditingMessage(null);
                                        setNewMessage('');
                                    }}
                                    sx={{ color: '#f97316' }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}

                        {replyingTo && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 60,
                                    width: '100%',
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderTop: 1,
                                    borderColor: 'rgba(59, 130, 246, 0.2)',
                                    bgcolor: 'rgba(239, 246, 255, 0.95)',
                                    backdropFilter: 'blur(8px)',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Box sx={{ maxWidth: '80%' }}>
                                    <Typography variant="caption" sx={{ opacity: 0.7, color: '#1e3a8a' }}>
                                        {t('replying_to')}
                                    </Typography>
                                    <Typography variant="body2" noWrap  sx={{ color: '#f97316' }}>
                                        {replyingTo.content || replyingTo.type}
                                    </Typography>
                                </Box>

                                <IconButton
                                    size="small"
                                    onClick={() => setReplyingTo(null)}
                                    sx={{ color: '#f97316' }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}

                        {isBlocked ?
                            (
                                <Box
                                    sx={{
                                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.05) 100%)',
                                        p: 2,
                                        textAlign: 'center',
                                        borderTop: 1,
                                        borderColor: 'rgba(239, 68, 68, 0.2)',
                                    }}
                                >
                                    <Typography sx={{ color: '#ef4444', fontWeight: 500 }}>
                                        {t('user_not_contactable')}
                                    </Typography>
                                </Box>
                            ) : (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        width: '100%',
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderTop: 1,
                                        borderColor: 'rgba(59, 130, 246, 0.2)',
                                        bgcolor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(8px)',
                                    }}
                                >
                                    {(isRecording || audioBlob) && (
                                        <>
                                            <IconButton color="error" sx={{ color: '#ef4444' }} onClick={cancelRecording}>
                                                <CloseIcon />
                                            </IconButton>

                                            <Typography sx={{ flexGrow: 1, color: '#1e3a8a' }}>
                                                {isRecording
                                                    ? t('recording', { seconds: recordTime })
                                                    : t('audio_ready')}
                                            </Typography>
                                        </>
                                    )}

                                    {!isRecording && !audioBlob && (
                                        <>
                                            {!showContent && (
                                                <>
                                                    <IconButton component="label" sx={{ color: '#3b82f6', '&:hover': { color: '#1e3a8a' } }}>
                                                        <AttachFileIcon />
                                                        <input
                                                            ref={fileInputRef}
                                                            hidden
                                                            type="file"
                                                            multiple
                                                            onChange={handleFileSelect}
                                                            accept={Object.values(FILE_RULES).flatMap(r => [...r.extensions]).map(ext => `.${ext}`).join(',')}
                                                        />
                                                    </IconButton>

                                                    <IconButton
                                                        color="primary"
                                                        onMouseDown={startRecording}
                                                        onMouseUp={handleSend}
                                                        onTouchStart={startRecording}
                                                        onTouchEnd={handleSend}
                                                        sx={{ color: '#f97316', '&:hover': { color: '#ea580c' } }}
                                                    >
                                                        <MicIcon />
                                                    </IconButton>

                                                    <Box sx={{ position: 'relative' }}>
                                                        <IconButton
                                                            ref={emojiButtonRef}
                                                            onClick={() => setShowEmojiPicker((v) => !v)}
                                                            sx={{ color: '#f97316' }}
                                                        >
                                                            {showEmojiPicker
                                                                ? <EmojiEmotionsIcon />
                                                                : <InsertEmoticonIcon />}
                                                        </IconButton>

                                                        {showEmojiPicker && (
                                                            <EmojiPicker
                                                                onSelect={(emoji) =>
                                                                    setNewMessage((prev) => prev + emoji)
                                                                }
                                                                onClose={() => setShowEmojiPicker(false)}
                                                                anchorEl={emojiButtonRef.current}
                                                                placement="top-start"
                                                            />
                                                        )}
                                                    </Box>
                                                </>
                                            )}

                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder={t('message_placeholder')}
                                                multiline
                                                value={newMessage}
                                                onChange={onInputChange}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        if (e.shiftKey) {
                                                            const cursorPos = e.target.selectionStart;
                                                            const textBefore = newMessage.slice(0, cursorPos);
                                                            const textAfter = newMessage.slice(cursorPos);
                                                            onInputChange({
                                                                target: { value: textBefore + '\n' + textAfter }
                                                            });
                                                            e.preventDefault();
                                                        } else {
                                                            e.preventDefault();
                                                            stopTyping();
                                                            handleSend();
                                                        }
                                                    }
                                                }}
                                                sx={{
                                                    '& fieldset': { 
                                                        borderRadius: 25,
                                                        borderColor: 'rgba(59, 130, 246, 0.3)',
                                                    },
                                                    '& .MuiOutlinedInput-root': {
                                                        '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                                                        '&:hover fieldset': { borderColor: '#f97316' },
                                                    },
                                                    '& .MuiInputBase-input': {
                                                        height: '30px',
                                                        lineHeight: '20px',
                                                        overflowY: 'auto',
                                                        whiteSpace: 'pre-wrap',
                                                        padding: '4px',
                                                        color: '#1e3a8a',
                                                    },
                                                }}
                                                InputProps={{
                                                    style: {
                                                        overflowY: 'hidden',
                                                    },
                                                }}
                                                onBlur={() => stopTyping()}
                                            />
                                        </>
                                    )}

                                    <IconButton
                                        color="primary"
                                        onClick={handleSend}
                                        disabled={
                                            (!newMessage.trim() && !audioBlob && selectedFiles.length === 0 && !isRecording)
                                            || isSending
                                        }
                                        sx={{
                                            color: '#3b82f6',
                                            '&:hover': { color: '#1e3a8a' },
                                            '&.Mui-disabled': { color: 'rgba(59, 130, 246, 0.3)' },
                                        }}
                                    >
                                        {isUploading ? (
                                            <CircularProgress size={24} sx={{ color: '#3b82f6' }} />
                                        ) : (
                                            <SendIcon />
                                        )}
                                    </IconButton>
                                </Paper>
                            )}

                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.6) 0%, rgba(255, 255, 255, 0.9) 100%)',
                    }}
                >
                    <Typography 
                        variant='h6' 
                        fontWeight={600}
                        sx={{
                            background: '#1e3a8a',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {t('tab_chat_to_start')}
                    </Typography>
                </Box>
            )}
            {chat != null && (
                <ChatMenuDialog
                    open={popup}
                    onClose={() => setPopup(false)}
                    user={chat}
                    roomId={chat?.room_id}
                    currentUserId={currentUserId}
                    onBlockUser={handleBlockUser}
                    blockMessage={blockMessage}
                />
            )}
            <DeleteDialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
                deleting={deleting}
            />
            <ForwardDialog
                open={forwardOpen}
                onClose={() => setForwardOpen(false)}
                onConfirm={confirmForward}
                rooms={forwardRooms}
                selectedRooms={selectedRooms}
                toggleRoom={toggleRoomSelection}
                loadMore={fetchForwardRooms}
                hasMore={roomsHasMore}
                loading={loadingRooms}
            />
            <MediaPreviewDialog
                open={previewOpen}
                onClose={handleClosePreview}
                mediaMessages={previewMedia}
                currentIndex={previewIndex}
                onPrev={handlePrevPreview}
                onNext={handleNextPreview}
                BASE_URL={BASE_URL}
            />
        </Box>
    )
}

export default ChatComponent