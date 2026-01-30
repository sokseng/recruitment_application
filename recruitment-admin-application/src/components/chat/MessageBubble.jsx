import { Box, Typography, Paper, Avatar, Button } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

function MessageBubble({ message, isOwn }) {
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
                }}
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
        </Box>
    );
}

export default MessageBubble;
