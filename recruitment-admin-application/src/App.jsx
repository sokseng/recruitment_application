import { Box, Typography, Button, Stack, IconButton } from '@mui/material';
import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import useAuthStore from './store/useAuthStore'
import { useGlobalWebSocket } from './hooks/useGlobalWebSocket';
import CallRoom from './components/chat/CallRoom';
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallRoom, setActiveCallRoom] = useState(null);

  const { send } = useGlobalWebSocket((data) => {
    switch (data.type) {
      case "call.incoming":
        setIncomingCall({ roomId: data.roomId, fromUserId: data.fromUserId })
        break

      case "call.accepted":
        setActiveCallRoom(data.roomId);
        break;

      case "call.declined":
        console.log("call.declined")
        break;

      case "call.ended":
        if (activeCallRoom === data.roomId) {
          setActiveCallRoom(null);
        }
        setIncomingCall(null);
        break

      default:
        break
    }
  });

  const acceptCall = () => {
    if (incomingCall) {
      setActiveCallRoom(incomingCall.roomId);
      setIncomingCall(null);

      send({
        type: "call.accept",
        payload: { room_id: incomingCall.roomId }
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

  useEffect(() => {
    hydrate()
  }, [hydrate])

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
            height:  '100%',
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
            roomId={activeCallRoom}
            userId={useAuthStore.getState().user_data.pk_id}
          />
        </Box>
      )}

      {incomingCall && !activeCallRoom && (
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1600,
            backgroundColor: 'primary.main',
            color: 'white',
            width: { xs: '90%', sm: '400px' },
            borderRadius: 3,
            boxShadow: 3,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Incoming Call
          </Typography>

          <Typography variant="body1">
            From user <strong>{incomingCall.fromUserId}</strong>
          </Typography>

          <Stack direction="row" spacing={2}>
            <IconButton
              onClick={acceptCall}
              sx={{
                backgroundColor: 'green',
                color: 'white',
                '&:hover': { backgroundColor: 'darkgreen' },
                width: 60,
                height: 60,
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
                width: 60,
                height: 60,
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
