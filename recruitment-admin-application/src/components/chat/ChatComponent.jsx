import {
    ArrowBack as ArrowBackIcon,
    EmojiEmotions as EmojiEmotionsIcon,
    InsertEmoticon as InsertEmoticonIcon,
    Translate,
} from '@mui/icons-material';
import { Box, IconButton, Button, Avatar, Typography, AppBar, Toolbar, Paper, TextField } from "@mui/material";
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

function ChatComponent({ chat, onBack, messages, setMessages, send, currentUserId }) {
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordTime, setRecordTime] = useState(0);

    const messagesEndRef = useRef(null);

    const [showContent, setSowContent] = useState(false);
    const emojiButtonRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [popup, setPopup] = useState(false);

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

    useEffect(() => {
        scrollToBottom();
    }, [chat, messages]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
    };

    const removeFile = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadFileMessage = async ({ file, type, caption }) => {
        const formData = new FormData();
        formData.append("to_user_id", chat.id);
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

    const handleSend = async () => {
        if (audioBlob) {
            const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
                type: audioBlob.type,
            })

            await uploadFileMessage({ file: audioFile, type: 'voice' })
            setAudioBlob(null)
            setRecordTime(0)
            return
        }

        if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
                const isImage = file.type.startsWith('image/')
                await uploadFileMessage({
                    file,
                    type: isImage ? 'image' : 'voice',
                    caption: newMessage || null,
                })
            }
            setSelectedFiles([])
            setNewMessage('')
        }

        if (newMessage.trim()) {
            send({
                type: "text",
                content: newMessage.trim(),
            });
            setNewMessage('');
        }
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
                            backgroundColor: 'white',
                            borderBottom: 1,
                            borderColor: 'divider',
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
                                    onClick={() => setOpen(true)}
                                >
                                    {chat?.username?.charAt(0).toUpperCase() || 'P'}
                                </Avatar>

                                <Box sx={{ flexGrow: 1, overflow: 'hidden', display: { xs: 'none', sm: 'block' } }}>
                                    <Typography variant="h6" fontWeight={600} noWrap>
                                        {chat?.username || 'Unkown User'}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary" noWrap>
                                        offline
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
                            sx={{
                                height: '75vh',
                                overflowY: 'auto',
                                px: 2,
                                py: 1,
                                bgcolor: 'grey.100',
                            }}
                        >
                            {messages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    isOwn={message.sender_id === currentUserId}
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
                            </Paper>
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
                                bgcolor: 'background.paper',
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
                                                <input hidden type="file" multiple onChange={handleFileSelect} />
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
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        sx={{ '& fieldset': { borderRadius: 3 } }}
                                        onFocus={() => setSowContent(true)}
                                        onBlur={() => setSowContent(false)}
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
        </Box>
    )
}

export default ChatComponent
