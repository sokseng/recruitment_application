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

function LocalTracksPublisher({ startWithVideo = true }) {

  const room = useRoomContext();
  const connectionState = useConnectionState();


  useEffect(() => {
    if (!room) return;
    if (connectionState !== ConnectionState.Connected) return;

    let videoTrack, audioTrack;

    async function initTracks() {
      // console.log("[LocalTracksPublisher] Room connected. Creating tracks...");

      videoTrack = await createLocalVideoTrack();
      audioTrack = await createLocalAudioTrack();

      await room.localParticipant.publishTrack(audioTrack);

      if (startWithVideo) {
        await room.localParticipant.publishTrack(videoTrack);
      } else {
        await room.localParticipant.publishTrack(videoTrack);
        await room.localParticipant.setCameraEnabled(false); // starts muted
      }

      // console.log("[LocalTracksPublisher] Tracks published!");
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

function CallControls({ onEndCall }) {
  const room = useRoomContext();
  const connectionState = useConnectionState();

  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

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

  if (!room || connectionState !== ConnectionState.Connected) return null;

  const toggleMic = async () => {
    await room.localParticipant.setMicrophoneEnabled(!micEnabled);
  };

  const toggleCamera = async () => {
    if (!room) return;
    const newState = !camEnabled;
    await room.localParticipant.setCameraEnabled(newState);
    setCamEnabled(newState);
  };

  const endCall = () => {
    room.disconnect();
    onEndCall?.();
  };

  return (
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
  );
}

function CallParticipants({ userData }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const tracks = useTracks(
    [
      { source: "camera", withPlaceholder: true },
      { source: "microphone", withPlaceholder: true },
    ],
    { onlySubscribed: false }
  );

  if (!tracks.length)
    return (
      <div style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        Connecting...
      </div>
    );

  const localVideo = tracks.find(
    (t) => t.participant?.isLocal && t.source === "camera"
  );

  const remoteVideos = tracks.filter(
    (t) => !t.participant?.isLocal && t.source === "camera"
  );

  const audioTracks = tracks.filter((t) => t.source === "microphone");

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#000" }}>
      {remoteVideos.map((trackRef) => {
        const isMuted = trackRef.publication?.isMuted;
        return (
          <div key={trackRef.trackSid ?? `${trackRef.participant?.identity}-${trackRef.source}`} style={{ width: "100%", height: "100%", position: "relative" }}>
            {!isMuted ? (
              <VideoTrack
                trackRef={trackRef}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Box sx={{
                width: "100%",
                height: "100%",
                background: "#222",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexDirection: 'column',
                textAlign: 'center',
                gap: 1
              }}>
                <Avatar
                  sx={{
                    width: 45,
                    height: 45
                  }}
                >
                  {userData.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  sx={{
                    color: 'white'
                  }}
                >
                  {userData.username}
                </Typography>
              </Box>
            )}

            {/* Mic muted badge */}
            {audioTracks
              .filter(a => a.participant?.identity === trackRef.participant?.identity)
              .some(a => a.publication?.isMuted) && (
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
                  {userData.username} is muted
                </div>
              )}

            <Box
              style={{
                position: 'fixed',
                top: 10,
                backgroundColor: 'transparent',
                padding: 2,
                borderRadius: 2,
                color: 'white',
                textAlign: 'center',
                width: '100%',
                zIndex: 1600
              }}
            >
              {!isMuted && (
                <Typography variant="h6">
                  {userData.username}
                </Typography>
              )}
              <Typography>
                {Math.floor(seconds / 60)}:
                {String(seconds % 60).padStart(2, '0')}
              </Typography>
            </Box>
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
            <VideoTrack
              trackRef={localVideo}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
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
              Camera Off
            </div>
          )}
        </div>
      )}

      {audioTracks.map((trackRef) => (
        <AudioTrack
          key={trackRef.trackSid ?? `${trackRef.participant?.identity}-audio`}
          trackRef={trackRef}
          autoPlay
        />
      ))}
    </div>
  );
}

export default function CallRoom({ roomId, userId, mode, onEndCall, userData }) {
  const [tokenData, setTokenData] = useState(null);
  const isVideoCall = mode === "video";

  useEffect(() => {
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

  if (!tokenData) return <div>Loading...</div>;

  return (
    <Box sx={{ position: 'fixed', zIndex: 1600, top: 0, left: 0, width: '100%', height: '100%', background: '#111' }}>
      <LiveKitRoom
        serverUrl={tokenData.url}
        token={tokenData.token}
        connect={true}
        onConnected={() => console.log("LiveKit connected")}
        onDisconnected={() => console.log("LiveKit disconnected")}
      >
        <LocalTracksPublisher startWithVideo={isVideoCall} />
        <CallParticipants userData={userData} />
        <CallControls onEndCall={onEndCall} />
      </LiveKitRoom>
    </Box>
  );
}
