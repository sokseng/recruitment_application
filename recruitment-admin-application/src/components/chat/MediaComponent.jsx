import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next';

function MediaComponent() {
    const { t } = useTranslation();

    return (
        <Box>
            <Box
                sx={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '100%',
                    maxWidth: 100,
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
                    src='https://imgs.search.brave.com/td_mSZ2hVBHK1joTctjOC0qYyKhlwhhymVXfxzUO7Yg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wMjYv/MzgwLzg2MS9zbWFs/bC95ZWxsb3ctYmFu/YW5hLXBhdHRlcm4t/aGVhbHRoLWdlbmVy/YXRlLWFpLXBob3Rv/LmpwZw'
                    alt={t('upload')}
                    sx={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'cover',
                        display: 'block',
                        borderRadius: 2
                    }}
                />
            </Box>
        </Box>
    )
}

export default MediaComponent