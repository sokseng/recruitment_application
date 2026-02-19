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
import { Box } from "@mui/material";
import { useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";

function LocalTracksPublisher() {
  const room = useRoomContext();
  const connectionState = useConnectionState();

  useEffect(() => {
    if (!room) return;
    if (connectionState !== ConnectionState.Connected) return;

    let videoTrack, audioTrack;

    async function initTracks() {
      console.log("[LocalTracksPublisher] Room connected. Creating tracks...");

      videoTrack = await createLocalVideoTrack();
      audioTrack = await createLocalAudioTrack();

      await room.localParticipant.publishTrack(videoTrack);
      await room.localParticipant.publishTrack(audioTrack);

      console.log("[LocalTracksPublisher] Tracks published!");
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
  }, [room, connectionState]);

  return null;
}

export default function CallRoom({ roomId, userId }) {
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    console.log("CallRoom mounted");
    return () => console.log("CallRoom unmounted");
  }, []);

  useEffect(() => {
    async function fetchToken() {
      try {
        console.log("[CallRoom] Fetching token for room:", roomId, "user:", userId);
        const res = await api.post(`/call/token`, { user_id: userId, room_name: `chat_${roomId}` });
        setTokenData(res.data);
        console.log("[CallRoom] Token received:", res.data);
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
        <LocalTracksPublisher />
        <CallParticipants />
      </LiveKitRoom>
    </Box>
  );
}

function CallParticipants() {
  const tracks = useTracks(
    [
      { source: "camera", withPlaceholder: true },
      { source: "microphone", withPlaceholder: true },
    ],
    { onlySubscribed: false }
  );

  if (!tracks.length) return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>Connecting...</div>
  );

  const localVideo = tracks.find(t => t.participant?.isLocal && t.source === "camera");
  const remoteVideoTracks = tracks.filter(t => !t.participant?.isLocal && t.source === "camera");
  const audioTracks = tracks.filter(t => t.source === "microphone");

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", background: "#000" }}>
      {/* Remote Video - Fullscreen */}
      {remoteVideoTracks.map(trackRef => (
        <VideoTrack
          key={`${trackRef.participant?.identity}-${trackRef.trackSid}`}
          trackRef={trackRef}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ))}

      {/* Local Video - Small Overlay */}
      {localVideo && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 150,
            height: 175,
            border: "2px solid white",
            borderRadius: 8,
            overflow: "hidden",
            zIndex: 1000,
            background: "#000",
          }}
        >
          <VideoTrack
            trackRef={localVideo}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Audio Tracks - invisible but plays */}
      {audioTracks.map(trackRef => (
        <AudioTrack
          key={`${trackRef.participant?.identity}-${trackRef.trackSid}`}
          trackRef={trackRef}
          autoPlay
        />
      ))}
    </div>
  );
}



