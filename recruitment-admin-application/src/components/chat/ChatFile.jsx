import { Box, Typography } from '@mui/material';
import { getFileIcon } from './FileIcon';
import React, { useState } from 'react';

export default function ChatFile({ fileUrl, isOwn, maxWidth = 300 }) {
  const [hasError, setHasError] = useState(false);
  const fileName = fileUrl ? fileUrl.split('/').pop() : 'Unknown File';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        maxWidth,
      }}
    >
      {/* File Icon */}
      <Box
        sx={{
          p: 1,
          backgroundColor: 'rgba(128,128,128,0.5)',
          borderRadius: '50%',
          height: { sm: 45 },
          width: { sm: 50 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {getFileIcon(fileUrl)}
      </Box>

      {/* File Link or Error */}
      <Typography
        variant="body2"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
        onClick={(e) => e.stopPropagation()}
      >
        {fileUrl && !hasError ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isOwn ? 'white' : 'black',
              textDecoration: 'none',
            }}
            onError={() => setHasError(true)}
          >
            {fileName}
          </a>
        ) : (
          <Typography variant="body2" sx={{ color: 'red' }}>
            File not found
          </Typography>
        )}
      </Typography>
    </Box>
  );
}
