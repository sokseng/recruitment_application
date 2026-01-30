import {
    ArrowBack as ArrowBackIcon,
    Send as SendIcon
} from '@mui/icons-material';
import { Box, IconButton, Button, Avatar, Typography, AppBar, Toolbar } from "@mui/material";
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';

function ChatComponent({ chat }) {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%'
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
                            '&:hover': { bgcolor: 'grey.200' },
                        }}
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
                                    {chat?.username?.charAt(0) || 'P'}
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
                                    // onClick={handleStartVoiceCall}
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
                                    // onClick={handleStartGroupCall}
                                />
                            </Box>
                        </Toolbar>
                    </AppBar>
                    <Box>
                        
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
        </Box>
    )
}

export default ChatComponent
