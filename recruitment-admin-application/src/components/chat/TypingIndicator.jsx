import { Box, Avatar } from "@mui/material";

export default function TypingIndicator({ username }) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1,
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 2.5,
                    py: 1.5,
                    bgcolor: 'grey.300',
                    borderRadius: 2,
                    minWidth: 50,
                }}
            >
                <Box className="dot" sx={dotStyle}></Box>
                <Box className="dot" sx={dotStyle}></Box>
                <Box className="dot" sx={dotStyle}></Box>
            </Box>
        </Box>
    );
}

const dotStyle = {
    width: 6,
    height: 6,
    bgcolor: 'grey.600',
    borderRadius: '50%',
    animation: 'blink 1.4s infinite both',
    '@keyframes blink': {
        '0%, 80%, 100%': { opacity: 0 },
        '40%': { opacity: 1 },
    },
};
