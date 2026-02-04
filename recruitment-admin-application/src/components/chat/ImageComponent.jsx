import { Box, Typography } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { FormatTime } from './FormatTime';
import React, { useState } from 'react';

export default function ChatImage({ src, isOwn, created_at, is_read, width = 200, height = 150 }) {
  const [hasError, setHasError] = useState(false);

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 0.2s ease',
        '&:hover': { transform: 'scale(1.025)' },
        bgcolor: hasError ? 'grey' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!hasError && (
        <Box
          component="img"
          src={src}
          alt="upload"
          onError={() => setHasError(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      {hasError && (
        <Box
          sx={{
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1,
            color: 'white'
          }}
        >
          <BrokenImageIcon sx={{ fontSize: 48, mb: 1, color:'grey.500' }} />
          <Typography
            variant="body2"
            sx={{ textAlign: 'center' }}
          >
            Image not found
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOwn ? 'end' : 'start',
          gap: 0.5,
          position: 'absolute',
          bottom: 10,
          right: 15,
          backgroundColor: 'grey',
          opacity: 0.75,
          borderRadius: 2,
          px: 1,
          color: 'white',
        }}
      >
        <Typography
          variant="caption"
          sx={{ display: 'block', textAlign: 'right', opacity: 0.7 }}
        >
          <FormatTime time={created_at} />
        </Typography>
        <Box sx={{ opacity: 0.7 }}>
          {is_read && isOwn && <DoneAllIcon sx={{ fontSize: 16 }} />}
        </Box>
      </Box>
    </Box>
  );
}
