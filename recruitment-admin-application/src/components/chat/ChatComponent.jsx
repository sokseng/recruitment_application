import {
    ArrowBack as ArrowBackIcon,
    EmojiEmotions as EmojiEmotionsIcon,
    InsertEmoticon as InsertEmoticonIcon,
} from '@mui/icons-material';
import { Box, IconButton, Avatar, Typography, AppBar, Toolbar, Paper, TextField, Snackbar, Alert, CircularProgress, Button } from "@mui/material";
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import MessageBubble from './MessageBubble';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { useRef, useState, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import CloseIcon from '@mui/icons-material/Close';
import StopIcon from '@mui/icons-material/Stop';
import ChatMenuDialog from './dialog/ChatMenuDialog';
import api from '../../services/api';
import TypingIndicator from './TypingIndicator';
import DeleteDialog from './dialog/DeleteDialog';

const FILE_RULES = {
    image: { extensions: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']) },
    voice: { extensions: new Set(['webm', 'ogg', 'm4a', 'mp3', 'wav']) },
    video: { extensions: new Set(['mp4', 'webm', 'mov', 'mkv', 'avi']) },
    file: { extensions: new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip']) },
};

const MAX_SIZE = 500 * 1024 * 1024; // 500MB

function ChatComponent({ chat, onBack, messages, setMessages, send, currentUserId, isOnline, typingUsers, messagesRef, onScroll, loadingOlderRef, loadingOlder, hasMore, messagesEndRef }) {
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

    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const prevMessageCountRef = useRef(0);
    const justOpenedChatRef = useRef(false);
    const [error, setError] = useState('');
    const [openConfirm, setOpenConfirm] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);

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
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioBlob(blob);
            clearInterval(timerRef.current);
        };

        mediaRecorderRef.current.start();
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const cancelRecording = () => {
        mediaRecorderRef.current?.stop();
        setAudioBlob(null);
        setIsRecording(false);
        clearInterval(timerRef.current);
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
                if (!Object.values(FILE_RULES).some(rule => rule.extensions.has(ext))) return `${f.name} (invalid type)`;
                if (f.size > MAX_SIZE) return `${f.name} (exceeds 500MB)`;
                return f.name;
            });
            setError(`Invalid file(s): ${messages.join(', ')}`);
            e.target.value = ''; // reset input
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
        });
        return res;
    }

    const handleSend = async () => {
        if (!chat?.room_id || !send) return;

        const addMessage = (msg) => {
            setMessages(prev => {
                // skip if duplicate
                if (prev.some(m => m.id === msg.id)) return prev;
                const updated = [...prev, msg];
                if (isNearBottom() || prev.length === 0) {
                    setTimeout(scrollToBottom, 50);
                }
                return updated;
            });
        }

        if (editingMessage) {
            if (!newMessage.trim()) return;

            await api.put(`/chat/room/${chat.room_id}/messages/${editingMessage.id}/text`, {
                content: newMessage.trim()
            });

            stopTyping();
            setEditingMessage(null);
            setNewMessage('');
            return;
        }

        if (audioBlob) {
            const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
                type: audioBlob.type,
            })

            const res = await uploadFileMessage({ file: audioFile, type: 'voice' })
            addMessage(res.data);
            setAudioBlob(null)
            setRecordTime(0)
            setTimeout(scrollToBottom, 50);
            return
        }

        if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
                const res = await uploadFileMessage({
                    file,
                    type: getFileType(file),
                    caption: newMessage || null,
                })
                addMessage(res.data);
            }
            setSelectedFiles([])
            setNewMessage('')
            clearFiles();
            setTimeout(scrollToBottom, 50);
            return;
        }

        if (newMessage.trim()) {

            await sendTextMessage(newMessage.trim());

            setNewMessage('');
            stopTyping();
            setTimeout(scrollToBottom, 50);
        }
    };

    const handleDeleteMessage = (message) => {
        setMessageToDelete(message);
        setOpenConfirm(true);
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;

        await api.delete(`/chat/room/${chat.room_id}/messages/${messageToDelete.id}`);

        setOpenConfirm(false);
        setMessageToDelete(null);
    };

    const cancelDelete = () => {
        setOpenConfirm(false);
        setMessageToDelete(null);
    };

    const handleEditMessage = (message) => {
        setEditingMessage(message);
        setNewMessage(message.content || '');
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
            }}
        >
            {chat !== null ? (
                <Box
                    sx={{
                        width: '100%',
                    }}
                >
                    <AppBar
                        position="static"
                        color="default"
                        elevation={2}
                        sx={{
                            backgroundColor: error ? 'rgba(255, 232, 236, 0.8)' : 'white',
                            borderBottom: 1,
                            borderColor: error ? 'red' : 'divider',
                            '&:hover': { bgcolor: 'grey.200' },
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
                                        '&:hover': { bgcolor: 'grey.200' },
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
                                        borderColor: 'divider',
                                        fontSize: 28
                                    }}
                                    src={chat?.avatar_url}
                                // onClick={() => setOpen(true)}
                                >
                                    {chat?.username?.charAt(0).toUpperCase() || 'P'}
                                </Avatar>

                                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                    <Typography variant="h6" fontWeight={600} noWrap>
                                        {chat?.username || 'Unkown User'}
                                    </Typography>

                                    <Typography variant="caption" sx={{ color: typingUsers[chat?.user_id] ? 'primary.main' : isOnline ? 'green' : 'grey', fontWeight: 'bold' }} noWrap>
                                        {typingUsers[chat?.user_id] ? 'Typing...' : isOnline ? 'Online' : 'Offline'}
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
                                        color: 'primary.main',
                                        transition: 'transform 1s',
                                        '&:hover': {
                                            scale: 1.1
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                    }}
                                />
                                <VideocamIcon
                                    sx={{
                                        fontSize: { xs: 24, md: 30 },
                                        color: 'primary.main',
                                        transition: 'transform 1s',
                                        '&:hover': {
                                            scale: 1.1
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                    }}
                                />
                            </Box>
                        </Toolbar>
                    </AppBar>
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
                                bgcolor: error ? 'rgba(255, 241, 243, 0.8)' : 'grey.100',
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
                                    <CircularProgress size={20} />
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
                                    <Typography variant='h6' fontWeight={600}>
                                        Say something to
                                    </Typography>
                                    <Typography variant='h6' fontWeight={600}>
                                        {chat?.username}
                                    </Typography>
                                </Box>
                            ) : (
                                messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        isOwn={message.sender_id === currentUserId}
                                        onEdit={handleEditMessage}
                                        onDelete={handleDeleteMessage}
                                    />
                                )))}

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
                                    bottom: 60,
                                    width: '100%',
                                    p: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderTop: 1,
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                }}
                            >

                                <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, overflowX: 'auto', py: 1 }}>
                                    {selectedFiles.map((file, index) => {
                                        const isImage = file.type.startsWith('image/');
                                        const url = isImage ? URL.createObjectURL(file) : null;

                                        return (
                                            <Paper
                                                key={index}
                                                variant="outlined"
                                                sx={{
                                                    p: 1,
                                                    minWidth: 120,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: 1,
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
                                                        sx={{ maxWidth: 100, textAlign: 'center' }}
                                                    >
                                                        {file.name}
                                                    </Typography>
                                                )}

                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => removeFile(index)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 14,
                                                        transform: 'translateX(200%)',
                                                        backgroundColor: 'white',
                                                        boxShadow: 1
                                                    }}
                                                >
                                                    <CloseIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                                <Snackbar
                                    open={!!error}
                                    autoHideDuration={5000}
                                    onClose={() => setError('')}
                                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                                >
                                    <Alert severity="error" onClose={() => setError('')}>
                                        {error}
                                    </Alert>
                                </Snackbar>
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
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                justifyContent: 'space-between'
                            }}>
                                <Typography >
                                    Editing message
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setEditingMessage(null);
                                        setNewMessage('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        )}

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
                                borderColor: 'divider',
                                bgcolor: error ? 'rgba(255, 232, 236, 0.8)' : 'background.paper',
                            }}
                        >
                            {(isRecording || audioBlob) && (
                                <>
                                    <IconButton color="error" onClick={cancelRecording}>
                                        {isRecording ? <StopIcon /> : <CloseIcon />}
                                    </IconButton>

                                    <Typography sx={{ flexGrow: 1 }}>
                                        {isRecording
                                            ? `Recording... ${recordTime}s`
                                            : 'Audio ready'}
                                    </Typography>
                                </>
                            )}

                            {!isRecording && !audioBlob && (
                                <>
                                    {!showContent && (
                                        <>
                                            <IconButton component="label">
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
                                                onMouseUp={stopRecording}
                                                onTouchStart={startRecording}
                                                onTouchEnd={stopRecording}
                                            >
                                                <MicIcon />
                                            </IconButton>

                                            <Box sx={{ position: 'relative' }}>
                                                <IconButton
                                                    ref={emojiButtonRef}
                                                    onClick={() => setShowEmojiPicker((v) => !v)}
                                                    sx={{ color: 'orange' }}
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
                                        placeholder="Aa..."
                                        value={newMessage}
                                        onChange={onInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                stopTyping();
                                                handleSend();
                                            }
                                        }}
                                        sx={{ '& fieldset': { borderRadius: 3 } }}
                                        onFocus={() => setSowContent(true)}
                                        onBlur={() => {
                                            stopTyping();
                                            setSowContent(false);
                                        }}
                                    />
                                </>
                            )}

                            <IconButton
                                color="primary"
                                onClick={handleSend}
                                disabled={
                                    isRecording ||
                                    (!newMessage.trim() && !audioBlob && selectedFiles.length === 0)
                                }
                            >
                                <SendIcon />
                            </IconButton>
                        </Paper>

                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <Typography variant='h6' fontWeight={600}>
                        Tab a chat to start message
                    </Typography>
                </Box>
            )}
            {chat != null && (
                <ChatMenuDialog
                    open={popup}
                    onClose={() => setPopup(false)}
                    user={chat}
                />
            )}
            <DeleteDialog
                open={openConfirm}
                onClose={() => setOpenConfirm(false)}
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
            />
        </Box>
    )
}

export default ChatComponent
