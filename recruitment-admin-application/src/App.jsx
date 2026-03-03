import { Box, Typography, Button, Stack, IconButton, Avatar } from '@mui/material';
import { useEffect, useState, useRef } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import useAuthStore from './store/useAuthStore'
import { useGlobalWebSocket } from './hooks/useGlobalWebSocket';
import CallRoom from './components/chat/CallRoom';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ringtone from './assets/ringing1.mp3';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallRoom, setActiveCallRoom] = useState(null);
  const [userData, setUserData] = useState(null);
  const ringtoneRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const userId = useAuthStore((s) => s.user_data?.pk_id);
  const [firstData, setFirstData] = useState(null);

  const [remoteParticipants, setRemoteParticipants] = useState([]);

  const { send } = useGlobalWebSocket((data) => {
    // console.log("data", data);
    switch (data.type) {
      case "call.incoming":
        setIncomingCall({ roomId: data.roomId, fromUserId: data.fromUserId, fromUsername: data.fromUsername, profileImage: data.fromProfileImage, mode: data.mode || "video" })
        setUserData({ username: data.fromUsername, profileImage: data.fromProfileImage, mode: data.mode || "video" });
        setRemoteParticipants([{
          userId: data.fromUserId,
          username: data.fromUsername,
          profileImage: data.fromProfileImage,
          mic: true,
          cam: true
        }]);
        setFirstData(data.mode || "video");
        break

      case "call.accepted":
        setIncomingCall(null);
        setActiveCallRoom({
          roomId: data.roomId,
          mode: data.mode,
        });
        ;
        setUserData({ username: data.fromUsername, profileImage: data.fromProfileImage, mode: data.mode || "video" });
        setRemoteParticipants([{
          userId: data.fromUserId,
          username: data.fromUsername,
          mic: true,
          cam: true
        }]);
        setFirstData(data.mode || "video");
        break;

      case "call.restore":
        setIncomingCall(null);

        setActiveCallRoom({
          roomId: data.roomId,
          mode: data.mode,
        });

        setUserData({
          username: data.fromUsername,
          profileImage: data.fromProfileImage,
          mode: data.mode
        });

        setRemoteParticipants([{
          userId: data.fromUserId,
          username: data.fromUsername,
          profileImage: data.fromProfileImage,
          mic: true,
          cam: true
        }]);

        setFirstData(data.mode);
        break;

      case "call.declined":
      case "call.missed":
      case "call.ended":
        setIncomingCall(null);
        setActiveCallRoom(null);
        break

      case "call.toggle":
        const { mic, cam, fromUserId } = data;

        setRemoteParticipants((prev) =>
          prev.map((p) =>
            p.userId === fromUserId ? { ...p, mic, cam } : p
          )
        );
        if (cam) {
          setFirstData(null);
        }
        break;

      default:
        break
    }
  });

  const acceptCall = () => {
    if (!incomingCall || isProcessing) return;

    setIsProcessing(true);

    send({
      type: "call.accept",
      payload: { room_id: incomingCall.roomId, mode: incomingCall.mode }
    });

    setActiveCallRoom(incomingCall);
    setIncomingCall(null);
    setIsProcessing(false);
  }

  const declineCall = () => {
    if (!incomingCall || isProcessing) return;

    setIsProcessing(true);
    send({
      type: "call.decline",
      payload: { room_id: incomingCall.roomId }
    });

    setIncomingCall(null);
    setIsProcessing(false);
  }

  const endCall = () => {
    if (!activeCallRoom) return;

    send({
      type: "call.end",
      payload: { room_id: activeCallRoom.roomId }
    });

    setActiveCallRoom(null);
    setIncomingCall(null);
  }

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    ringtoneRef.current = new Audio(ringtone);
    ringtoneRef.current.loop = true; // keep ringing
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.play().then(() => {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        });
      }
      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
  }, []);

  useEffect(() => {
    if (!ringtoneRef.current) return;

    if (incomingCall && !activeCallRoom) {
      ringtoneRef.current.play().catch(() => { });
    } else {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, [incomingCall, activeCallRoom]);

  return (
    <BrowserRouter>
      <AppRoutes />

      {activeCallRoom && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1600,
            width: '100%',
            height: '100%',
            backgroundColor: '#676767b0',
            boxShadow: 3,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2,
          }}
        >
          <CallRoom
            roomId={activeCallRoom.roomId}
            userId={userId}
            mode={userData?.mode}
            onEndCall={endCall}
            userData={userData}
            send={send}
            remoteParticipants={remoteParticipants}
            firstData={firstData}
            BASE_URL={BASE_URL}
          />
        </Box>
      )}

      {incomingCall && !activeCallRoom && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            zIndex: 1600,
            backgroundColor: 'grey',
            color: 'white',
            width: '100%',
            height: '100%',
            boxShadow: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            justifyContent: 'space-between',
            gap: 2,
            py: 10
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              justifyContent: 'center',
            }}
          >
            <Avatar
              sx={{
                width: 50,
                height: 50
              }}
              src={`${BASE_URL}/uploads/user/profile/${incomingCall.profileImage}`}
            >
              {incomingCall.fromUsername.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {incomingCall.fromUsername}
            </Typography>
            <Typography variant="body1" >
              {incomingCall.mode === "video" ? "Incoming Video Call" : "Incoming Audio Call"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <IconButton
              onClick={acceptCall}
              disabled={isProcessing}
              sx={{
                backgroundColor: 'green',
                color: 'white',
                '&:hover': { backgroundColor: 'darkgreen' },
                width: 45,
                height: 45,
              }}
            >
              <CallIcon />
            </IconButton>

            <IconButton
              onClick={declineCall}
              disabled={isProcessing}
              sx={{
                backgroundColor: 'red',
                color: 'white',
                '&:hover': { backgroundColor: 'darkred' },
                width: 45,
                height: 45,
              }}
            >
              <CallEndIcon />
            </IconButton>
          </Stack>
        </Box>
      )}
    </BrowserRouter>
  )
}
