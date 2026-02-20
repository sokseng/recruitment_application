import { Box, Typography, Stack, IconButton, Avatar } from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';

function CallRequestDialog({ callRequest, onDeclinedCall, isCallBusy }) {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                zIndex: 1600,
                backgroundColor: 'grey',
                color: 'white',
                width: '100%',
                height: '100%',
                boxShadow: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'space-between',
                gap: 2,
                py: 10
            }}
        >
            <Box>
                <Avatar
                    sx={{
                        width: 45,
                        height: 45,
                        mx: 'auto'
                    }}
                >
                    {callRequest.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: isCallBusy ? 'red' : 'white' }}>
                    {isCallBusy ? `${callRequest.username} is in another call!!!` : `Calling to ${callRequest.username}`}
                </Typography>
            </Box>

            <Stack direction="row" spacing={2}>

                <IconButton
                    onClick={() => {
                        onDeclinedCall(callRequest.room_id);
                    }}
                    sx={{
                        backgroundColor: 'red',
                        color: 'white',
                        '&:hover': { backgroundColor: 'darkred' },
                        width: 45,
                        height: 45,
                    }}
                >
                    <CallEndIcon />
                </IconButton>
            </Stack>
        </Box>
    )
}

export default CallRequestDialog
