import { Box, Typography, Paper, Avatar, Button } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import ReplyIcon from '@mui/icons-material/Reply';
import ForwardIcon from '@mui/icons-material/Forward';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import React from 'react';
import ReplyAllIcon from '@mui/icons-material/ReplyAll';

function MessageBubble({ message, isOwn }) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (event) => {
        if (message.message_type === 'system') return;
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
            {!isOwn && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                    }}
                >
                    <Avatar
                        src={message.sender.avatar_url}
                        sx={{
                            width: 15,
                            height: 15,
                            fontSize: 10
                        }}
                    >
                        {message.sender.username.charAt(0).toUpperCase()}
                    </Avatar>
                </Box>
            )}
            <Paper
                elevation={1}
                sx={{
                    maxWidth: '70%',
                    px: message.message_type === 'media' ? 0 : 2,
                    py: message.message_type === 'media' ? 0 : 1,
                    bgcolor: message.message_type === 'media' ? 'transparent' : isOwn ? 'primary.main' : 'grey.100',
                    boxShadow: message.message_type === 'media' ? 0 : 2,
                    color: isOwn ? 'white' : 'text.primary',
                    borderRadius: 2,
                    '&:hover': {
                        bgcolor: message.message_type === 'media' ? 'transparent' : isOwn ? '#1f62a5ff' : 'grey.200',
                        transform: 'translate 0.2s ease'
                    }
                }}
                onClick={handleMenuOpen}
            >
                {message.message_type === 'text' && (
                    <Typography variant="body2">
                        {message.content}
                    </Typography>
                )}
                {message.message_type === 'voice' && (
                    <VoiceMessagePlayer
                        url={message.content}
                        isOwn={isOwn}
                    />
                )}
                {message.message_type === 'system' && (
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
                {message.message_type === 'media' && (
                    <Box
                        sx={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '100%',
                            maxWidth: 200,
                            height: '100%',
                            overflow: 'hidden',
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                                transform: 'scale(1.025)',
                            },
                        }}
                    >
                        <Box
                            component="img"
                            src={message.content}
                            alt="upload"
                            sx={{
                                width: '100%',
                                height: 'auto',
                                objectFit: 'cover',
                                display: 'block',
                                borderRadius: 2
                            }}
                        />
                    </Box>
                )}
                {message.message_type !== 'media' && (
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
                                display: 'block',
                                textAlign: 'right',
                                opacity: 0.7,
                            }}
                        >
                            {message.created_at}
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
                {message.message_type !== 'system' && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><ReplyIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Reply</ListItemText>
                    </MenuItem>
                )}

                {message.message_type !== 'system' && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><ReplyAllIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Forward</ListItemText>
                    </MenuItem>
                )}

                {message.message_type === 'media' && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><PreviewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Preview</ListItemText>
                    </MenuItem>
                )}

                {message.message_type === 'media' && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Download</ListItemText>
                    </MenuItem>
                )}

                {isOwn && message.message_type === 'text' && (
                    <MenuItem onClick={() => { handleMenuClose(); }}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Edit</ListItemText>
                    </MenuItem>
                )}

                {isOwn && (
                    <MenuItem
                        onClick={() => { handleMenuClose(); }}
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
