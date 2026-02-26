import { Box, IconButton, Typography } from "@mui/material";
import { FormatTime } from './FormatTime';
import CloseIcon from '@mui/icons-material/Close';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useTranslation } from 'react-i18next';

function PinnedMessageComponent({ pinMessage, currentUserId, onUnpin, scrollToMessage }) {
    const { t } = useTranslation();

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}
            onClick={() => scrollToMessage?.(pinMessage.message.id)}
        >
            <Box
                sx={{
                    fontSize: 14,
                    borderLeft: 3,
                    borderColor: 'primary.main',
                    pl: 1,
                    borderRadius: 1,
                    backgroundColor: '#c5e7ff55',
                    width: '100%',
                    '&:hover': {
                        backgroundColor: '#c5e7ff8e',
                    }
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 14
                        }}
                    >{t('pinned_by')}</Typography>
                    <Typography component="span" sx={{ color: 'primary.main', textDecoration: 'underline', fontSize: 14 }}>
                        {currentUserId === pinMessage?.pinned_by_user?.pk_id ? t('you') : `@${pinMessage?.pinned_by_user?.user_name}`}
                    </Typography>
                    (<FormatTime time={pinMessage.pinned_at} />)
                    <PushPinIcon
                        sx={{
                            fontSize: 16,
                            mr: 0.5,
                            transform: 'rotate(30deg)',
                            opacity: 0.7,
                            color: 'primary.main'
                        }}
                    />
                </Box>
                <Box>
                    {(pinMessage.message.type === 'text' || pinMessage.message.type === 'system') && (
                        <Typography
                            sx={{
                                fontSize: 14,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 250
                            }}
                        >{pinMessage.message.content}</Typography>
                    )}
                    {pinMessage.message.type === 'voice' && (
                        <Typography
                            sx={{
                                fontSize: 14
                            }}
                        >{t('voice')}</Typography>
                    )}
                    {pinMessage.message.type === 'image' && (
                        <Typography
                            sx={{
                                fontSize: 14
                            }}
                        >{t('image')}</Typography>
                    )}
                    {pinMessage.message.type === 'file' && (
                        <Typography
                            sx={{
                                fontSize: 14
                            }}
                        >{t('file')}</Typography>
                    )}
                    {pinMessage.message.type === 'video' && (
                        <Typography
                            sx={{
                                fontSize: 14
                            }}
                        >{t('video')}</Typography>
                    )}
                </Box>
            </Box>
            <IconButton
                size="small"
                sx={{
                    position: 'absolute',
                    right: 10
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onUnpin();
                }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
    )
}

export default PinnedMessageComponent;