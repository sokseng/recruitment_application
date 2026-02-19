import { Box, Typography, Stack, IconButton } from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';

function CallRequestDialog({ callRequest, onDeclinedCall }) {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1600,
                backgroundColor: 'grey',
                color: 'white',
                width: '100%',
                boxShadow: 3,
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'space-between',
                px: {xs: 2, md: 10},
                py: 1,
                gap: { xs: 2, md: 25 }
            }}
        >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Calling to {callRequest.username}
            </Typography>

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
