import { useEffect, useRef, useState } from "react";

export function useWebSocket({
  roomId,
  token,
  onMessage,
  autoReconnect = true,
}) {
  const WS_BASE_URI = import.meta.env.VITE_API_BASE_URL.replace(
    /^http:/,
    "ws:",
  ).replace(/^https:/, "wss:");

  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const heartbeatTimeout = useRef(null);
  const intentionalClose = useRef(false);
  const currentRoomId = useRef(roomId);

  const [connected, setConnected] = useState(false);

  const resetHeartbeat = () => {
    if (heartbeatTimeout.current) {
      clearTimeout(heartbeatTimeout.current);
    }

    heartbeatTimeout.current = setTimeout(() => {
      console.warn("WS heartbeat timeout — force close");
      socketRef.current?.close();
    }, 45000);
  };

  useEffect(() => {
    if (!roomId || !token) return;

    // Close previous socket if any
    if (socketRef.current) {
      socketRef.current.close(1000, "room switch");
    }
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);

    // Reset flags
    intentionalClose.current = false;
    currentRoomId.current = roomId;

    const wsUrl = `${WS_BASE_URI}/ws/chat/room/${roomId}?token=${token}`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WS connected", wsUrl);
        setConnected(true);
        reconnectAttempts.current = 0;
        resetHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.room_id && data.room_id !== currentRoomId.current) return;
          resetHeartbeat();
          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }
          onMessage?.(data);
        } catch (err) {
          console.error("WS message error", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        socketRef.current = null;
        if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);

        if (intentionalClose.current) return; // do not reconnect if we intentionally closed

        if (autoReconnect) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
          reconnectAttempts.current += 1;
          reconnectTimeout.current = setTimeout(() => {
            // Only reconnect if still same room
            if (!intentionalClose.current && currentRoomId.current === roomId) {
              connect();
            }
          }, delay);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      intentionalClose.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);
      socketRef.current?.close(1000, "cleanup");
      socketRef.current = null;
      setConnected(false);
    };
  }, [roomId, token]);

  const send = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  const disconnect = () => {
    intentionalClose.current = true;

    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);

    socketRef.current?.close(1000, "manual disconnect");
    socketRef.current = null;
    setConnected(false);
  };

  return { connected, send, disconnect };
}
