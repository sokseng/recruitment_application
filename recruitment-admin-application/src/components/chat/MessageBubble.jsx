import { Box, Typography, Paper, Button, Avatar, IconButton, Link, CircularProgress } from '@mui/material';
import Popper from '@mui/material/Popper';
import Fade from '@mui/material/Fade';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import ReplyIcon from '@mui/icons-material/Reply';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useEffect } from 'react';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import { FormatTime } from './FormatTime';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import VideoMessage from './VideoMessagePlayer';
import ChatImage from './ImageComponent';
import ChatFile from './ChatFile';
import ReplyComponent from './ReplyComponent';
import ForwardIcon from '@mui/icons-material/Forward';
import PushPinIcon from '@mui/icons-material/PushPin';
import ReactionComponent from './ReactionComponent';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { useTranslation } from 'react-i18next';

function MessageBubble({ message, isOwn, isForward, onEdit, onDelete, onReply, onForward, onReplace, onPreview, onPin, isPin, onUnpin, onReact, reactionsData, onRemoveReact, onStartCall, isBlocked, scrollToMessage, highlightedMessageId }) {
    const { t } = useTranslation();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const [reactionOpen, setReactionOpen] = React.useState(false);
    const [reactionAnchorEl, setReactionAnchorEl] = React.useState(null);
    const [isHovered, setIsHovered] = React.useState(false);

    const handleMenuOpen = (event) => {
        if (message.type === 'call' || isBlocked) return;
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSave = async () => {
        handleMenuClose();
        try {
            const response = await fetch(`${BASE_URL}${message.file_url}`);
            if (!response.ok) throw new Error('File not found');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = message.file_name || 'file';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const reactions = [
        { type: "like", emoji: "👍" },
        { type: "love", emoji: "❤️" },
        { type: "laugh", emoji: "😂" },
        { type: "wow", emoji: "😮" },
        { type: "sad", emoji: "😢" },
        { type: "angry", emoji: "😡" },
    ];

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                reactionAnchorEl &&
                !reactionAnchorEl.contains(event.target)
            ) {
                setReactionOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [reactionAnchorEl]);


    return (
        <Box
            id={`message-${message.id}`}
            sx={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                mb: 1.5,
                gap: 1,
            }}

        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: isOwn ? 'end' : 'start',
                    fontSize: 14
                }}
            >
                {message.forward_from && (
                    <Box
                        sx={{
                            color: isOwn ? 'primary.main' : 'grey',
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5
                        }}
                    >
                        <ForwardIcon sx={{ fontSize: 18 }} />
                        {t('forward_from')}
                        {isForward ?
                            (
                                t('you')
                            ) :
                            (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        ml: 0.5
                                    }}
                                >

                                    <Avatar
                                        sx={{
                                            width: 15,
                                            height: 15,
                                            mr: 0.25,
                                            fontSize: 10
                                        }}
                                    >
                                        {message.forward_from.sender.user_name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography>
                                        {message.forward_from.sender.user_name}
                                    </Typography>
                                </Box>
                            )}
                    </Box>
                )}
                <Paper
                    elevation={1}
                    sx={{
                        px: message.type === 'image' || message.type === 'video' ? 0 : 2,
                        py: message.type === 'image' || message.type === 'video' ? 0 : 1,
                        transition: 'box-shadow 0.3s ease',
                        bgcolor:
                            message.type === 'image' || message.type === 'video'
                                ? 'transparent'
                                : isOwn
                                    ? 'primary.main'
                                    : 'grey.100',
                        boxShadow: highlightedMessageId === message.id
                            ? '0 0 0 3px rgba(255, 193, 7, 0.6)' :
                            message.type === 'image' || message.type === 'video' ? 0 : 2,
                        color: isOwn ? 'white' : 'text.primary',
                        borderRadius: 2,
                        '&:hover': {
                            bgcolor:
                                message.type === 'image' || message.type === 'video'
                                    ? 'transparent'
                                    : isOwn
                                        ? '#1f62a5ff'
                                        : 'grey.200',
                            transition: 'transform 0.2s ease',
                        },
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                    onClick={handleMenuOpen}
                    onMouseEnter={() => {
                        setIsHovered(true);
                    }}
                    onMouseLeave={() => setIsHovered(false)}
                >

                    {message.reply_to && (
                        <ReplyComponent
                            reply={message.reply_to}
                            isOwn={isOwn}
                            isImage={message.type === 'image' || message.type === 'video'}
                            onScroll={() => scrollToMessage?.(message.reply_to.id)}
                        />
                    )}

                    {message.isUploading && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: isOwn
                                    ? 'rgba(0,0,0,0.45)'
                                    : 'rgba(0,0,0,0.25)',
                                backdropFilter: 'blur(2px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: 1,
                                zIndex: 10,
                            }}
                        >
                            <CircularProgress
                                variant="determinate"
                                value={message.progress || 0}
                                size={42}
                                thickness={4}
                                sx={{
                                    color: '#fff'
                                }}
                            />

                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#fff',
                                    fontWeight: 600
                                }}
                            >
                                {message.progress || 0}%
                            </Typography>
                        </Box>
                    )}

                    {message.type === 'text' && (
                        <>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: isOwn ? 'white' : 'gray',
                                    whiteSpace: 'pre-line',
                                    lineHeight: 1.2,
                                    textAlign: isOwn ? 'end' : 'start',
                                    fontSize: 14,
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {message.content.split('\n').map((line, lineIndex) => (
                                    <span key={lineIndex}>
                                        {line.split(/\s+/).map((word, i) => {
                                            const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+)/i;

                                            if (urlRegex.test(word)) {
                                                let href = word;
                                                if (!/^https?:\/\//i.test(word)) {
                                                    href = 'https://' + word;
                                                }
                                                return (
                                                    <Link
                                                        key={i}
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ color: isOwn ? 'orange' : 'primary.main', p: 0 }}
                                                    >
                                                        {word}{' '}
                                                    </Link>
                                                );
                                            }

                                            return word + ' ';
                                        })}
                                        {lineIndex < message.content.split('\n').length - 1 && <br />}
                                    </span>
                                ))}
                            </Typography>
                        </>
                    )}

                    {message.type === 'system' && (
                        <Typography
                            variant="caption"
                            sx={{
                                fontStyle: 'italic',
                                color: isOwn ? 'white' : 'gray',
                                whiteSpace: 'pre-line',
                                lineHeight: 1.2,
                                textAlign: isOwn ? 'end' : 'start',
                                fontSize: 14
                            }}
                        >
                            {message.content.split('\n').map((line, lineIndex) => (
                                <span key={lineIndex}>
                                    {line.split(/\s+/).map((word, i) => {
                                        const urlRegex = /^(https?:\/\/[^\s]+|www\.[^\s]+)/i;

                                        if (urlRegex.test(word)) {
                                            let href = word;
                                            if (!/^https?:\/\//i.test(word)) {
                                                href = 'https://' + word;
                                            }
                                            return (
                                                <Link
                                                    key={i}
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ color: isOwn ? 'orange' : 'primary.main', p: 0 }}
                                                >
                                                    {word}{' '}
                                                </Link>
                                            );
                                        }

                                        return word + ' ';
                                    })}
                                    {lineIndex < message.content.split('\n').length - 1 && <br />}
                                </span>
                            ))}
                        </Typography>
                    )}

                    {message.type === 'voice' && (
                        <VoiceMessagePlayer
                            url={`${BASE_URL}${message.file_url}`}
                            isOwn={isOwn}
                        />
                    )}

                    {message.type === 'video' && (
                        <VideoMessage
                            message={message}
                            isOwn={isOwn}
                            BASE_URL={BASE_URL}
                            isPin={isPin}
                            reactionsData={reactionsData}
                            onRemoveReact={onRemoveReact}
                        />
                    )}

                    {message.type === 'file' && (
                        <ChatFile
                            fileUrl={`${BASE_URL}${message.file_url}`}
                            isOwn={isOwn}
                        />
                    )}

                    {message.type === 'call' && (
                        <Box
                            sx={{
                                color: isOwn ? 'white' : 'text.primary',
                                wordBreak: 'break-word',
                                transition: 'all 0.2s',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            <Typography
                                variant="body2"
                            >
                                {message.content}
                            </Typography>

                            <Button
                                variant="outlined"
                                color={isOwn ? 'white' : 'black'}
                                size='small'
                                sx={{
                                    width: '100%',
                                    borderRadius: 2,
                                    boxShadow: 1,
                                    wordBreak: 'break-word',
                                    transition: 'all 0.2s',
                                    my: 1,
                                    textTransform: "none"
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartCall();
                                }}
                            >
                                {isOwn ? t('call_again') : t('call_back')}
                            </Button>
                        </Box>
                    )}

                    {message.type === 'image' && (
                        <ChatImage
                            src={`${BASE_URL}${message.file_url}`}
                            isOwn={isOwn}
                            created_at={message.created_at}
                            edited_at={message.edited_at}
                            is_read={message.is_read}
                            isPin={isPin}
                            messageId={message.id}
                            reactionsData={reactionsData}
                            onRemoveReact={onRemoveReact}
                        />
                    )}

                    <IconButton
                        size="small"
                        sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: isOwn && 4,
                            right: !isOwn && 4,
                            color: isOwn ? '#fff' : 'grey',
                            opacity: isHovered ? 1 : 0,
                            pointerEvents: isHovered ? 'auto' : 'none',
                            transition: 'opacity 0.2s',
                            '&:hover': { color: '#ffcc00ff', transform: 'scale(1.2)' },
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setReactionAnchorEl(e.currentTarget);
                            setReactionOpen((prev) => !prev);
                        }}
                    >
                        <EmojiEmotionsIcon fontSize="small" />
                    </IconButton>

                    {(message.type !== 'image' && message.type !== 'video') && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isOwn ? 'end' : 'start',
                                gap: 0.5
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    textAlign: 'right',
                                    flexDirection: isOwn ? 'row' : 'row-reverse',
                                    gap: 0.5
                                }}
                            >
                                <ReactionComponent
                                    messageId={message.id}
                                    reactionsData={reactionsData}
                                    onRemoveReact={onRemoveReact}
                                />
                                {isPin && (
                                    <PushPinIcon
                                        sx={{
                                            fontSize: 16,
                                            mr: 0.5,
                                            transform: 'rotate(30deg)',
                                            opacity: 0.7,
                                        }}
                                    />
                                )}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <FormatTime time={message.created_at} />
                                    {message.edited_at && (
                                        <Typography
                                            variant="caption"
                                            sx={{ ml: 0.5, opacity: 0.7 }}
                                        >
                                            · {t('edited')}
                                        </Typography>
                                    )}
                                </Box>
                            </Typography>
                            <Box
                                sx={{
                                    opacity: 0.7,
                                }}
                            >
                                {message.is_read && isOwn && <DoneAllIcon sx={{ fontSize: 16 }} />}
                            </Box>
                        </Box>
                    )}
                </Paper>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {message.type !== 'call' && (
                    <MenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            setReactionAnchorEl(e.currentTarget);
                            setReactionOpen((prev) => !prev);
                        }}
                    >
                        <ListItemIcon><EmojiEmotionsIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('react')}</ListItemText>
                    </MenuItem>
                )}
                {message.type !== 'call' && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        if (isPin) {
                            onUnpin();
                        } else {
                            onPin?.(message);
                        }
                    }}>
                        <ListItemIcon><PushPinIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{isPin ? t('unpin') : t('pin')}</ListItemText>
                    </MenuItem>
                )}

                {message.type !== 'call' && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onReply?.(message);
                    }}>
                        <ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('reply')}</ListItemText>
                    </MenuItem>
                )}

                {message.type !== 'call' && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onForward?.(message);
                    }}>
                        <ListItemIcon><ReplyAllIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('forward')}</ListItemText>
                    </MenuItem>
                )}

                {isOwn && (message.type === 'image' || message.type === 'video' || message.type === 'file') && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onReplace?.(message);
                    }}>
                        <ListItemIcon><AutorenewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('replace')}</ListItemText>
                    </MenuItem>
                )}

                {(message.type === 'image' || message.type === 'video' || message.type === 'file') && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onPreview?.(message);
                    }}>
                        <ListItemIcon><PreviewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('preview')}</ListItemText>
                    </MenuItem>
                )}

                {(message.type === 'image' || message.type === 'video' || message.type === 'file' || message.type === 'voice') && (
                    <MenuItem onClick={handleSave}>
                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('save')}</ListItemText>
                    </MenuItem>
                )}

                {isOwn && message.type === 'text' && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onEdit?.(message);
                    }}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{t('edit')}</ListItemText>
                    </MenuItem>
                )}

                {isOwn && (
                    <MenuItem
                        onClick={() => {
                            handleMenuClose();
                            onDelete?.(message);
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <ListItemIcon sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>{t('delete')}</ListItemText>
                    </MenuItem>
                )}
            </Menu>

            <Popper
                open={reactionOpen}
                anchorEl={reactionAnchorEl}
                placement="top"
                transition
                disablePortal={false}
                modifiers={[
                    { name: 'offset', options: { offset: [0, 8] } },
                    { name: 'preventOverflow', options: { padding: 8 } },
                ]}
                sx={{
                    zIndex: 1600,
                    position: 'absolute',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        right: -6,
                        top: '20px',
                        width: '2px',
                        height: '20px',
                        bgcolor: 'divider',
                    },
                }}
            >
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={150}>
                        <Paper
                            elevation={4}
                            sx={{
                                display: 'flex',
                                gap: 1,
                                px: 1.5,
                                py: 0.8,
                                borderRadius: 5,
                                bgcolor: 'background.paper',
                                boxShadow: 3,
                                position: 'relative',
                            }}
                        >
                            {reactions.map((reaction) => (
                                <Box
                                    key={reaction.type}
                                    onClick={() => {
                                        handleMenuClose();
                                        setReactionOpen(false);
                                        onReact?.(message, reaction.type);
                                    }}
                                    sx={{
                                        cursor: 'pointer',
                                        fontSize: 22,
                                        transition: 'transform 0.15s ease',
                                        '&:hover': { transform: 'scale(1.35)' },
                                    }}
                                >
                                    {reaction.emoji}
                                </Box>
                            ))}
                        </Paper>
                    </Fade>
                )}
            </Popper>
        </Box>
    );
}

export default MessageBubble;