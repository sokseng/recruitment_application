import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PushPinIcon from '@mui/icons-material/PushPin';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormatTime } from './FormatTime';
import ReactionComponent from './ReactionComponent';

export default function ChatImage({ src, isOwn, created_at, edited_at, is_read, isPin, messageId, reactionsData, onRemoveReact, width = 200, height = 150 }) {
  const { t } = useTranslation();
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
          alt={t('upload')}
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
          <BrokenImageIcon sx={{ fontSize: 48, mb: 1, color: 'grey.500' }} />
          <Typography
            variant="body2"
            sx={{ textAlign: 'center' }}
          >
            {t('image_not_found')}
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
          right: isOwn && 15,
          left: !isOwn && 15,
          backgroundColor: 'grey',
          borderRadius: 5,
          pl: 0.5,
          color: 'white',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textAlign: 'right',
            flexDirection: isOwn ? 'row' : 'row-reverse',
            gap: 0.5
          }}
        >
          <Box sx={{
            color: isOwn ? 'white' : 'black',
          }}>
            <ReactionComponent
              messageId={messageId}
              reactionsData={reactionsData}
              onRemoveReact={onRemoveReact}
            />
          </Box>
          {isPin && (
            <PushPinIcon
              sx={{
                fontSize: 16,
                mr: 0.5,
                transform: 'rotate(30deg)',
              }}
            />
          )}

          <FormatTime time={created_at} />
          {edited_at && (
            <Typography
              variant="caption"
              sx={{ ml: 0.5, opacity: 0.7 }}
            >
              · {t('edited')}
            </Typography>
          )}
        </Typography>
        <Box sx={{ opacity: 0.7 }}>
          {is_read && isOwn && <DoneAllIcon sx={{ fontSize: 16 }} />}
        </Box>
      </Box>
    </Box>
  );
}