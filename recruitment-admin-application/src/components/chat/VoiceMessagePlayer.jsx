import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, IconButton, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from 'react-i18next';

export const VoiceMessagePlayer = ({ url, isOwn }) => {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [error, setError] = useState(false);

  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || error) return;

    if (!playing) audio.play();
    else audio.pause();

    setPlaying(!playing);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const bar = progressBarRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || error) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    audio.currentTime = audio.duration * percentage;
    setProgress(percentage * 100);
  };

  return (
    <Box
      sx={{
        color: isOwn ? "white" : "black",
        borderRadius: 3,
        width: '100%',
      }}
    >
      {error ? (
        <Typography variant="body2" sx={{ color: isOwn ? "white" : "black", textAlign: "center" }}>
          {t('voice_message_not_found')}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: '100%',
            gap: 1,
          }}
        >
          <IconButton
            onClick={togglePlay}
            sx={{
              bgcolor: isOwn ? "rgba(255,255,255,0.25)" : "white",
              "&:hover": { bgcolor: isOwn ? "rgba(255,255,255,0.4)" : "#eee" },
            }}
          >
            {playing ? (
              <PauseIcon sx={{ color: isOwn ? "white" : "#333" }} />
            ) : (
              <PlayArrowIcon sx={{ color: isOwn ? "white" : "#333" }} />
            )}
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Box
              ref={progressBarRef}
              onClick={handleSeek}
              sx={{
                position: "relative",
                height: 6,
                borderRadius: 3,
                mt:1,
                cursor: "pointer",
                bgcolor: isOwn ? "rgba(255,255,255,0.3)" : "#ddd",
                overflow: "hidden",
                "&:hover": { bgcolor: isOwn ? "rgba(255,255,255,0.4)" : "#ccc" },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${progress}%`,
                  bgcolor: isOwn ? "white" : "#1976d2",
                  transition: "width 0.1s linear",
                }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{ opacity: 0.8, mt: 0.5, display: "block", textAlign: "right" }}
            >
              {currentTime} / {duration}
            </Typography>
          </Box>

          <audio
            ref={audioRef}
            src={url}
            preload="metadata"
            onLoadedMetadata={(e) => setDuration(formatTime(e.target.duration))}
            onTimeUpdate={(e) => {
              const audio = e.target;
              setCurrentTime(formatTime(audio.currentTime));
              setProgress((audio.currentTime / audio.duration) * 100);
            }}
            onEnded={() => {
              setPlaying(false);
              setProgress(0);
              setCurrentTime("0:00");
            }}
            onError={() => setError(true)}
            style={{ display: "none" }}
          />
        </Box>
      )}
    </Box>
  );
};