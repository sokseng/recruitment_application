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
  const onMessageRef = useRef(onMessage);

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
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const send = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  useEffect(() => {
    if (!roomId || !token) return;

    intentionalClose.current = true;

    socketRef.current?.close(1000, "room switch");
    intentionalClose.current = false;

    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);

    // Reset flags
    currentRoomId.current = roomId;

    const wsUrl = `${WS_BASE_URI}/ws/chat/room/${roomId}?token=${token}`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        // console.log("WS connected", wsUrl);
        intentionalClose.current = false;
        setConnected(true);

        reconnectAttempts.current = 0;
        resetHeartbeat();
      };

      ws.onmessage = (event) => {
        // console.log("WS raw:", event.data);
        if (event.data.room_id && event.data.room_id !== currentRoomId.current) {
          return;
        }

        try {
          const data = JSON.parse(event.data);

          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            resetHeartbeat();
            return;
          }

          onMessageRef.current?.(data);
        } catch (err) {
          console.error("WS message error", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        socketRef.current = null;
        if (heartbeatTimeout.current) clearTimeout(heartbeatTimeout.current);

        if (intentionalClose.current) return; // do not reconnect if we intentionally closed

        if (!autoReconnect) return;

        const attempt = reconnectAttempts.current;
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        reconnectAttempts.current += 1;

        reconnectTimeout.current = setTimeout(() => {
          if (!intentionalClose.current && currentRoomId.current === roomId) {
            connect();
          }
        }, delay);
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
