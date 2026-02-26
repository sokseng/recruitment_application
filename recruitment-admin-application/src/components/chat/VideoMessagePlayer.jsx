import { useRef, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { FormatTime } from './FormatTime';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import ReactionComponent from './ReactionComponent';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useTranslation } from 'react-i18next';

export default function VideoMessage({ message, isOwn, BASE_URL, isPin, reactionsData, onRemoveReact }) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState(false);

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (!videoRef.current || error) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        display: 'inline-block',
        width: 200,
        height: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: error ? 'none' : 'scale(1.025)',
        },
        bgcolor: error ? (isOwn ? 'primary.main' : 'grey.200') : 'black',
      }}
    >
      {error ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 200,
            height: 150,
            bgcolor: 'grey',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <BrokenImageIcon
            sx={{
              fontSize: 48,
              color: 'grey.500',
              mb: 1,
            }}
          />

          <Typography
            variant="body2"
            sx={{
              color: 'white',
              textAlign: 'center',
              px: 1,
              wordBreak: 'break-word',
            }}
          >
            {t('video_not_found')}
          </Typography>

          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
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
              }}
            >
              <ReactionComponent
                messageId={message.id}
                reactionsData={reactionsData}
                onRemoveReact={onRemoveReact}
              />
              {isPin && (
                <PushPinIcon
                  sx={{
                    fontSize: 16,
                    mr: 0.5,
                    transform: 'rotate(30deg)',
                    opacity: 0.7,
                  }}
                />
              )}

              <FormatTime time={message.created_at} />
              {message.edited_at && (
                <Typography
                  variant="caption"
                  sx={{ ml: 0.5, opacity: 0.7 }}
                >
                  · {t('edited')}
                </Typography>
              )}
            </Typography>
            <Box sx={{ opacity: 0.7 }}>
              {message.is_read && isOwn && <DoneAllIcon sx={{ fontSize: 16 }} />}
            </Box>
          </Box>
        </Box>

      ) : (
        <>
          <Box
            component="video"
            src={`${BASE_URL}${message.file_url}`}
            loop
            muted
            playsInline
            ref={videoRef}
            onError={() => setError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Centered Play/Pause Button */}
          {isHovered && (
            <IconButton
              onClick={handlePlayPause}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                bgcolor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
                transition: '0.2s',
              }}
            >
              {isPlaying ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
            </IconButton>
          )}

          {/* Bottom timestamp & read status */}
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
              <ReactionComponent
                messageId={message.id}
                reactionsData={reactionsData}
                onRemoveReact={onRemoveReact}
              />
              {isPin && (
                <PushPinIcon
                  sx={{
                    fontSize: 16,
                    mr: 0.5,
                    transform: 'rotate(30deg)',
                    opacity: 0.7,
                  }}
                />
              )}

              <FormatTime time={message.created_at} />
              {message.edited_at && (
                <Typography
                  variant="caption"
                  sx={{ ml: 0.5, opacity: 0.6 }}
                >
                  · {t('edited')}
                </Typography>
              )}
            </Typography>
            <Box sx={{ opacity: 0.7 }}>
              {message.is_read && isOwn && <DoneAllIcon sx={{ fontSize: 16 }} />}
            </Box>
          </Box>
        </>
      )
      }
    </Box >
  );
}