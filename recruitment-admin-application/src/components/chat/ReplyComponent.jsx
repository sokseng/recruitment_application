import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

function ReplyComponent({ reply, isOwn, isImage, onScroll }) {
    const { t } = useTranslation();

    if (!reply) return null;

    const getPreviewText = () => {
        if (reply.type === 'text' && reply.content) {
            return reply.content;
        }

        switch (reply.type) {
            case 'image':
                return t('photo');
            case 'video':
                return t('video');
            case 'voice':
                return t('voice_message');
            case 'file':
                return t('file');
            default:
                return t('message');
        }
    };

    return (
        <Box
            sx={{
                borderLeft: 2,
                borderColor: isImage ? (isOwn ? 'primary.main' : 'black') : isOwn ? 'white' : 'grey',
                backgroundColor: isImage ? '#ffffff97' : isOwn ? '#ffffff3c' : '#bab6b63c',
                px: 1,
                py: 0.5,
                mb: reply.type === 'voice' ? 1 : 0.5,
                borderRadius: 1,
                textAlign: 'start',
                maxWidth: '100%',
            }}
            onClick={(e) => {
                e.stopPropagation();
                onScroll();
            }}
        >
            <Typography
                variant="caption"
                sx={{ opacity: 0.7, color: isImage ? 'grey' : isOwn ? 'white' : 'grey' }}
            >
                {t('replying_to')}
            </Typography>

            <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 500, color: isImage ? 'grey' : isOwn ? 'white' : 'grey' }}
            >
                {getPreviewText()}
            </Typography>
        </Box>
    );
}

export default ReplyComponent;