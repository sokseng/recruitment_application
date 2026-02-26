import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useTranslation } from 'react-i18next';

export default function MediaPreviewDialog({ open, onClose, mediaMessages, currentIndex, onPrev, onNext, BASE_URL }) {
    const { t } = useTranslation();

    if (!mediaMessages[currentIndex]) return null;

    const message = mediaMessages[currentIndex];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md">
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {/* Prev Button */}
                <IconButton
                    onClick={onPrev}
                    sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                >
                    <ArrowBackIosIcon />
                </IconButton>

                <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {message.type === 'image' && (
                        <img
                            src={`${BASE_URL}${message.file_url}`}
                            alt={t('image_preview')}
                            style={{ maxWidth: '100%', maxHeight: '80vh' }}
                            onError={(e) => {
                                e.target.style.display = 'none'; // hide broken image
                                // optionally, skip to next media automatically
                            }}
                        />
                    )}
                    {message.type === 'video' && (
                        <video controls style={{ maxWidth: '100%', maxHeight: '80vh' }}>
                            <source src={`${BASE_URL}${message.file_url}`} type="video/mp4" />
                            {t('video_not_supported')}
                        </video>
                    )}
                    {message.type === 'voice' && (
                        <audio controls style={{ width: '100%' }}>
                            <source src={`${BASE_URL}${message.file_url}`} type="audio/mpeg" />
                            {t('audio_not_supported')}
                        </audio>
                    )}
                    {message.type === 'file' && (
                        <a href={`${BASE_URL}${message.file_url}`} target="_blank" rel="noreferrer">
                            {t('download_file', { filename: message.file_name || t('file') })}
                        </a>
                    )}
                </DialogContent>

                {/* Next Button */}
                <IconButton
                    onClick={onNext}
                    sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                >
                    <ArrowForwardIosIcon />
                </IconButton>

                {/* Close Button */}
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', top: 0, right: 0 }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>
        </Dialog>
    );
}