import { useEffect, useRef, useState } from "react";

export function useWebSocket({
  roomId,
  token,
  onMessage,
  autoReconnect = true,
}) {
  const WS_BASE_URI = import.meta.env.VITE_API_BASE_URL
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");

  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const heartbeatTimeout = useRef(null);
  const intentionalClose = useRef(false);

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
    if (!roomId  || !token) return;

    const wsUrl = `${WS_BASE_URI}/ws/chat/room/${roomId}?token=${token}`;

    const connect = () => {
      intentionalClose.current = false;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WS connected", wsUrl);
        setConnected(true);
        reconnectAttempts.current = 0;
        resetHeartbeat(); // start heartbeat immediately
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          resetHeartbeat();

          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }

          onMessage?.(data);
        } catch (err) {
          console.error("Invalid WS message", err);
        }
      };

      ws.onclose = (event) => {
        console.log("WS disconnected", event.code, event.reason);
        setConnected(false);
        socketRef.current = null;

        if (heartbeatTimeout.current) {
          clearTimeout(heartbeatTimeout.current);
        }

        if (intentionalClose.current) return; // CRITICAL

        if (autoReconnect) {
          const delay = Math.min(
            1000 * 2 ** reconnectAttempts.current,
            10000,
          );
          reconnectAttempts.current += 1;
          reconnectTimeout.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      intentionalClose.current = true;

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

      if (heartbeatTimeout.current) {
        clearTimeout(heartbeatTimeout.current);
      }

      socketRef.current?.close(1000, "room switch");
      socketRef.current = null;
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
