import { Box, Typography, Paper, Button } from '@mui/material';
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

function MessageBubble({ message, isOwn, onEdit, onDelete }) {
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

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                mb: 1.5,
                gap: 1
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    maxWidth: '70%',
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

                {message.type === 'text' && (
                    <Typography variant="body2">
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
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {message.type !== 'system' && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Reply</ListItemText>
                    </MenuItem>
                )}

                {message.type !== 'system' && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><ReplyAllIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Forward</ListItemText>
                    </MenuItem>
                )}

                {isOwn && (message.type === 'image' || message.type === 'video' || message.type === 'file') && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><AutorenewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Replace</ListItemText>
                    </MenuItem>
                )}

                {(message.type === 'image' || message.type === 'video' || message.type === 'file') && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><PreviewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Preview</ListItemText>
                    </MenuItem>
                )}

                {(message.type === 'image' || message.type === 'video' || message.type === 'file' || message.type === 'voice') && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Download</ListItemText>
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
