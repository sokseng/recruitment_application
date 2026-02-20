import { useState, useEffect } from "react";
import { Room } from "livekit-client";

export function useCall({ token, serverUrl }) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!token || !serverUrl) return;

    const lkRoom = new Room();

    lkRoom
      .connect(serverUrl, token)
      .then(() => {
        setParticipants(Array.from(lkRoom.participants.values()));

        lkRoom.on("participantConnected", (p) =>
          setParticipants((prev) => [...prev, p])
        );
        lkRoom.on("participantDisconnected", (p) =>
          setParticipants((prev) =>
            prev.filter((part) => part.identity !== p.identity)
          )
        );
      })
      .catch((err) => console.error("LiveKit connect error:", err));

    setRoom(lkRoom);

    return () => {
      lkRoom.disconnect();
    };
  }, [token, serverUrl]);

  const muteMic = () =>
    room?.localParticipant.audioTracks.forEach((pub) => pub.track?.disable());

  const unmuteMic = () =>
    room?.localParticipant.audioTracks.forEach((pub) => pub.track?.enable());

  return { room, participants, muteMic, unmuteMic };
}
