import { Box, Typography, Paper, Button, Avatar } from '@mui/material';
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
import React from 'react';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';
import { FormatTime } from './FormatTime';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import VideoMessage from './VideoMessagePlayer';
import ChatImage from './ImageComponent';
import ChatFile from './ChatFile';
import ReplyComponent from './ReplyComponent';
import ForwardIcon from '@mui/icons-material/Forward';
import PushPinIcon from '@mui/icons-material/PushPin';

function MessageBubble({ message, isOwn, isForward, onEdit, onDelete, onReply, onForward, onReplace, onPreview, onPin, isPin }) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const handleMenuOpen = (event) => {
        if (message.type === 'system') return;
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

            window.URL.revokeObjectURL(url); // free memory
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

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                mb: 1.5,
                gap: 1
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    alignItems: isOwn ? 'end' : 'start'
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
                        <ForwardIcon />
                        forward from
                        {isForward ?
                            (
                                ' you'
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
                        // maxWidth: '70%',
                        px: message.type === 'image' || message.type === 'video' ? 0 : 2,
                        py: message.type === 'image' || message.type === 'video' ? 0 : 1,
                        bgcolor:
                            message.type === 'image' || message.type === 'video'
                                ? 'transparent'
                                : isOwn
                                    ? 'primary.main'
                                    : 'grey.100',
                        boxShadow: message.type === 'image' || message.type === 'video' ? 0 : 2,
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
                    }}
                    onClick={handleMenuOpen}
                >

                    {message.reply_to && (
                        <ReplyComponent
                            reply={message.reply_to}
                            isOwn={isOwn}
                            isImage={message.type === 'image' || message.type === 'video'}
                        />
                    )}

                    {message.type === 'text' && (
                        <Typography
                            variant="body2"
                            sx={{
                                textAlign: isOwn ? 'end' : 'start'
                            }}
                        >
                            {message.content}
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
                        />
                    )}

                    {message.type === 'file' && (
                        <ChatFile
                            fileUrl={`${BASE_URL}${message.file_url}`}
                            isOwn={isOwn}
                        />
                    )}

                    {message.type === 'system' && (
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
                            >
                                Call back
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
                        />
                    )}

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
                                    opacity: 0.7,
                                }}
                            >
                                {isPin && (
                                    <PushPinIcon
                                        sx={{
                                            fontSize: 16,
                                            mr: 0.5,
                                            transform: 'rotate(30deg)'
                                        }}
                                    />
                                )}

                                <FormatTime time={message.created_at} />
                                {message.edited_at && (
                                    <Typography
                                        variant="caption"
                                        sx={{ ml: 0.5, opacity: 0.7 }}
                                    >
                                        · edited
                                    </Typography>
                                )}
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

            <Popper
                open={open && message.type !== 'system'}
                anchorEl={anchorEl}
                placement="top"
                transition
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, -10], // space between emoji bar and menu
                        },
                    },
                ]}
                sx={{ zIndex: 1600 }}
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
                                mb: 2,
                                mr: isOwn ? 2 : 0,
                                ml: !isOwn ? 2 : 0
                            }}
                        >
                            {reactions.map((reaction) => (
                                <Box
                                    key={reaction.type}
                                    onClick={() => {
                                        handleMenuClose();
                                        // onReact?.(message, reaction.type);
                                    }}
                                    sx={{
                                        cursor: 'pointer',
                                        fontSize: 22,
                                        transition: 'transform 0.15s ease',
                                        '&:hover': {
                                            transform: 'scale(1.35)',
                                        },
                                    }}
                                >
                                    {reaction.emoji}
                                </Box>
                            ))}
                        </Paper>
                    </Fade>
                )}
            </Popper>


            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {message.type !== 'system' && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onPin?.(message);
                    }}>
                        <ListItemIcon><PushPinIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>{isPin ? 'Unpin' : 'Pin'}</ListItemText>
                    </MenuItem>
                )}

                {message.type !== 'system' && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onReply?.(message);
                    }}>
                        <ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Reply</ListItemText>
                    </MenuItem>
                )}

                {message.type !== 'system' && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onForward?.(message);
                    }}>
                        <ListItemIcon><ReplyAllIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Forward</ListItemText>
                    </MenuItem>
                )}

                {isOwn && (message.type === 'image' || message.type === 'video' || message.type === 'file') && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onReplace?.(message);
                    }}>
                        <ListItemIcon><AutorenewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Replace</ListItemText>
                    </MenuItem>
                )}

                {(message.type === 'image' || message.type === 'video' || message.type === 'file') && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onPreview?.(message);
                    }}>
                        <ListItemIcon><PreviewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Preview</ListItemText>
                    </MenuItem>
                )}

                {(message.type === 'image' || message.type === 'video' || message.type === 'file' || message.type === 'voice') && (
                    <MenuItem onClick={handleSave}>
                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Save</ListItemText>
                    </MenuItem>
                )}

                {isOwn && message.type === 'text' && (
                    <MenuItem onClick={() => {
                        handleMenuClose();
                        onEdit?.(message);
                    }}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Edit</ListItemText>
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
                        <ListItemText>Delete</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </Box>
    );
}

export default MessageBubble;
