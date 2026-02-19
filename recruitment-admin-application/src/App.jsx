import { Box, Typography, Button, Stack, IconButton, Avatar } from '@mui/material';
import { useEffect, useState, useRef } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import useAuthStore from './store/useAuthStore'
import { useGlobalWebSocket } from './hooks/useGlobalWebSocket';
import CallRoom from './components/chat/CallRoom';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ringtone from './assets/ringing.mp3';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallRoom, setActiveCallRoom] = useState(null);
  const [userData, setUserData] = useState(null);
  const ringtoneRef = useRef(null);

  const { send } = useGlobalWebSocket((data) => {
    switch (data.type) {
      case "call.incoming":
        setIncomingCall({ roomId: data.roomId, fromUserId: data.fromUserId, fromUsername: data.fromUsername, mode: data.mode || "video" })
        setUserData({ username: data.fromUsername, mode: data.mode || "video" });
        break

      case "call.accepted":
        setActiveCallRoom({
          roomId: data.roomId,
          mode: data.mode,
          fromUsername: data.fromUsername
        });
        ;
        setUserData({ username: data.fromUsername, mode: data.mode || "video" });
        break;

      case "call.declined":
        setIncomingCall(null);
        break;

      case "call.ended":
        setActiveCallRoom(null);
        setIncomingCall(null);
        break

      default:
        break
    }
  });

  const acceptCall = () => {
    if (incomingCall) {
      setActiveCallRoom(incomingCall);
      setIncomingCall(null);

      send({
        type: "call.accept",
        payload: { room_id: incomingCall.roomId, mode: incomingCall.mode }
      });
    }
  }

  const declineCall = () => {
    if (incomingCall) {
      send({
        type: "call.decline",
        payload: { room_id: incomingCall.roomId }
      });
      setIncomingCall(null);
    }
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
    if (incomingCall && !activeCallRoom) {
      ringtoneRef.current?.play().catch((err) => {
        console.log("Autoplay blocked:", err);
      });
    } else {
      ringtoneRef.current?.pause();
      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0;
      }
    }
  }, [incomingCall, activeCallRoom]);

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
            userId={useAuthStore.getState().user_data.pk_id}
            mode={userData.mode}
            onEndCall={endCall}
            userData={userData}
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
            >
              {incomingCall.fromUsername.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {incomingCall.fromUsername}
            </Typography>
            <Typography variant="body1" >
              Incoming Call
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <IconButton
              onClick={acceptCall}
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
