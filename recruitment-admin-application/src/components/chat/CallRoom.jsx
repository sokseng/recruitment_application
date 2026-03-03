import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  AudioTrack,
  useTracks,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import api from '../../services/api';
import { createLocalVideoTrack, createLocalAudioTrack } from "livekit-client";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import { useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import MicOffIcon from '@mui/icons-material/MicOff';
import MicIcon from '@mui/icons-material/Mic';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { Snackbar, Alert } from "@mui/material";
import { useTranslation } from 'react-i18next';

function LocalTracksPublisher({ startWithVideo = true }) {

  const room = useRoomContext();
  const connectionState = useConnectionState();

  useEffect(() => {
    if (!room) return;
    if (connectionState !== ConnectionState.Connected) return;

    let videoTrack, audioTrack;

    async function initTracks() {
      if (room.localParticipant.videoTrackPublications.size > 0) return;

      videoTrack = await createLocalVideoTrack();
      audioTrack = await createLocalAudioTrack();

      await room.localParticipant.publishTrack(audioTrack);

      if (startWithVideo) {
        await room.localParticipant.publishTrack(videoTrack);
      } else {
        await room.localParticipant.publishTrack(videoTrack);
        await room.localParticipant.setCameraEnabled(false);
      }
    }

    initTracks();

    return () => {
      if (videoTrack) {
        room.localParticipant.unpublishTrack(videoTrack);
        videoTrack.stop();
      }
      if (audioTrack) {
        room.localParticipant.unpublishTrack(audioTrack);
        audioTrack.stop();
      }
    };
  }, [room, connectionState, startWithVideo]);

  return null;
}

function CallControls({ onEndCall, send, micEnabled, setMicEnabled, camEnabled, setCamEnabled, roomId }) {
  const { t } = useTranslation();
  const room = useRoomContext();
  // const connectionState = useConnectionState();

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    if (!room) return;

    const updateState = () => {
      const audioPub = Array.from(
        room.localParticipant?.audioTrackPublications?.values() || []
      )[0];

      const videoPub = Array.from(
        room.localParticipant?.videoTrackPublications?.values() || []
      )[0];

      setMicEnabled(!audioPub?.track?.isMuted);
      setCamEnabled(videoPub?.track?.isMuted ? false : true);
    };

    updateState();

    room.localParticipant.on("trackMuted", updateState);
    room.localParticipant.on("trackUnmuted", updateState);

    return () => {
      room.localParticipant.off("trackMuted", updateState);
      room.localParticipant.off("trackUnmuted", updateState);
    };
  }, [room]);

  if (!room) return null;

  const toggleMic = async () => {
    if (!room) return;

    const newState = !micEnabled;
    try {
      await room.localParticipant.setMicrophoneEnabled(newState);
      setMicEnabled(newState);

      send({
        type: "call.toggle",
        payload: { room_id: roomId, mic: newState, cam: camEnabled }
      });
    } catch (err) {
      showSnackbar(t('no_microphone_found'), "error");
    }
  };

  const toggleCamera = async () => {
    if (!room) return;

    const newState = !camEnabled;
    try {
      await room.localParticipant.setCameraEnabled(newState);
      setCamEnabled(newState);

      send({
        type: "call.toggle",
        payload: { room_id: roomId, mic: micEnabled, cam: newState }
      });
    } catch (err) {
      showSnackbar(t('no_camera_found'), "error");
    }
  };

  const endCall = () => {
    room.disconnect();
    onEndCall?.();
  };

  if (!room) return null;

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2000,
        }}
      >
        <IconButton
          onClick={toggleMic}
          sx={{
            backgroundColor: micEnabled ? "primary.main" : "error.main",
            color: "white",
            "&:hover": {
              backgroundColor: micEnabled ? "primary.dark" : "error.dark",
            },
          }}
        >
          {micEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>

        <IconButton
          onClick={toggleCamera}
          sx={{
            backgroundColor: camEnabled ? "primary.main" : "error.main",
            color: "white",
            "&:hover": {
              backgroundColor: camEnabled ? "primary.dark" : "error.dark",
            },
          }}
        >
          {camEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>

        <IconButton
          onClick={endCall}
          sx={{
            backgroundColor: "error.main",
            color: "white",
            "&:hover": {
              backgroundColor: "error.dark",
            },
          }}
        >
          <CallEndIcon />
        </IconButton>

      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "left", zIndex: 1600 }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

function CallParticipants({ userData, remoteParticipantsWS, firstData, BASE_URL }) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(0);
  const safeUsername = userData?.username || "User";
  const safeProfileImage = userData?.profileImage
    ? `${BASE_URL}/uploads/user/profile/${userData.profileImage}`
    : undefined;

  const [remoteParticipants, setRemoteParticipants] = useState(remoteParticipantsWS);
  const connectionState = useConnectionState();

  const isReconnecting =
    connectionState === ConnectionState.Reconnecting;

  const tracks = useTracks(
    [
      { source: "camera", withPlaceholder: true },
      { source: "microphone", withPlaceholder: true },
    ],
    { onlySubscribed: false }
  );

  useEffect(() => {
    setRemoteParticipants(remoteParticipantsWS);
  }, [remoteParticipantsWS]);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const localVideo = tracks.find(t => t.participant?.isLocal && t.source === "camera");
  const remoteVideos = tracks.filter(t => !t.participant?.isLocal && t.source === "camera");
  const audioTracks = tracks.filter(t => t.source === "microphone");

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#000" }}>

      {connectionState !== ConnectionState.Connected && (
        <Box sx={{
          position: "absolute",
          top: 0,
          width: "100%",
          textAlign: "center",
          backgroundColor:
            connectionState === ConnectionState.Reconnecting
              ? "orange"
              : "primary.main",
          color: "white",
          zIndex: 3000,
          py: 1
        }}>
          {connectionState === ConnectionState.Reconnecting
            ? "Reconnecting..."
            : "Connecting..."}
        </Box>
      )}

      {!isReconnecting && remoteVideos.map(trackRef => {
        const key = trackRef.trackSid ?? `${trackRef.participant?.identity}-camera`;
        const participantState = remoteParticipants.find(p => p.userId === trackRef.participant?.identity);

        const isCamOn =
          firstData !== null
            ? firstData === "video"
            : participantState?.cam ?? !trackRef.publication?.isMuted;
        const isMicOn = participantState?.mic ?? !audioTracks.some(
          a => a.participant?.identity === trackRef.participant?.identity && a.publication?.isMuted
        );

        return (
          <div key={key} style={{ width: "100%", height: "100%", position: "relative" }}>

            {(isCamOn) ? (
              <VideoTrack trackRef={trackRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Box sx={{
                width: "100%",
                height: "100%",
                background: "#222",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                textAlign: "center",
                gap: 1,
                fontSize: 24
              }}>
                <Avatar sx={{ width: 45, height: 45 }} src={safeProfileImage}>
                  {safeUsername?.charAt(0).toUpperCase()}
                </Avatar>
                <Typography sx={{ color: "white" }}>{safeUsername}</Typography>
              </Box>
            )}

            {!isMicOn && (
              <div style={{
                position: "absolute",
                top: 20,
                left: 20,
                background: "grey",
                color: "white",
                padding: "6px 10px",
                borderRadius: 20,
                fontSize: 12
              }}>
                {t('user_muted', { username: safeUsername })}
              </div>
            )}
          </div>
        );
      })}

      {localVideo && (
        <div style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 150,
          height: 175,
          border: "2px solid white",
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 1000,
          background: "#000"
        }}>
          {!localVideo.publication?.isMuted ? (
            <VideoTrack trackRef={localVideo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              background: "#333",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12
            }}>
              {t('camera_off')}
            </div>
          )}
        </div>
      )}

      {audioTracks.map(trackRef => {
        const key = trackRef.trackSid ?? `${trackRef.participant?.identity}-audio`;
        return (
          <AudioTrack key={key} trackRef={trackRef} autoPlay />
        )
      })}

      <Box sx={{
        position: 'absolute',
        top: 10,
        width: '100%',
        textAlign: 'center',
        color: 'white',
        zIndex: 1200
      }}>
        <Typography variant="h6" sx={{ color: "white" }}>{isReconnecting ? 'Reconnecting...' : safeUsername}</Typography>
        <Typography variant="body2">
          {formatTime(seconds)}
        </Typography>
      </Box>

    </div>
  );
}

export default function CallRoom({ roomId, userId, mode, onEndCall, userData, send, remoteParticipants, firstData, BASE_URL }) {
  const { t } = useTranslation();
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const [tokenData, setTokenData] = useState(null);
  const isVideoCall = mode === "video";
  // const [lkReconnecting, setLkReconnecting] = useState(false);

  useEffect(() => {
    if (tokenData) return;

    async function fetchToken() {
      try {
        const res = await api.post(`/call/token`, { user_id: userId, room_name: `chat_${roomId}` });
        setTokenData(res.data);
      } catch (err) {
        console.error("[CallRoom] Failed to fetch token", err);
      }
    }
    fetchToken();
  }, [roomId, userId]);

  if (!tokenData) {
    return (
      <Box sx={{
        position: 'fixed',
        inset: 0,
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        {t('connecting')}...
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'fixed', zIndex: 1600, top: 0, left: 0, width: '100%', height: '100%', background: '#111' }}>
      <LiveKitRoom
        serverUrl={tokenData.url}
        token={tokenData.token}
        connect={true}
        options={{
          autoSubscribe: true,
          reconnectPolicy: {
            maxRetries: Infinity
          }
        }}
        // onReconnecting={() => setLkReconnecting(true)}
        // onReconnected={() => setLkReconnecting(false)}
      >
        <LocalTracksPublisher startWithVideo={isVideoCall} />
        <CallParticipants userData={userData} remoteParticipantsWS={remoteParticipants} firstData={firstData} BASE_URL={BASE_URL} />
        <CallControls onEndCall={onEndCall} send={send} micEnabled={micEnabled} setMicEnabled={setMicEnabled} camEnabled={camEnabled} setCamEnabled={setCamEnabled} roomId={roomId} />
      </LiveKitRoom>
    </Box>
  );
}