import { Box, Typography, Stack, IconButton, Avatar } from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useTranslation } from 'react-i18next';

function CallRequestDialog({ callRequest, onDeclinedCall, isCallBusy, BASE_URL }) {
    const { t } = useTranslation();

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
                    src={`${BASE_URL}/uploads/user/profile/${callRequest.profile_image}`}
                >
                    {callRequest.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mt: 1 }}>
                    {isCallBusy
                        ? t('user_in_another_call', { username: callRequest.username })
                        : t('calling_to', { username: callRequest.username })}
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

export default CallRequestDialog;