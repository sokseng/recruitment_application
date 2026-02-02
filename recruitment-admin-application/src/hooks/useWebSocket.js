import { useEffect, useRef, useState } from "react";

export function useWebSocket({ otherUserId, token, onMessage, autoReconnect = true }) {
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!otherUserId || !token) return;

    const wsUrl = `ws://localhost:8000/ws/chat/${otherUserId}?token=${token}`;
    let ws;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WS connected");
        setConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage && onMessage(data);
        } catch (err) {
          console.error("Invalid WS message", err);
        }
      };

      ws.onclose = (event) => {
        console.log("WS disconnected", event.code, event.reason);
        setConnected(false);
        socketRef.current = null;

        if (autoReconnect) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
          reconnectAttempts.current += 1;
          reconnectTimeout.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (err) => {
        console.error("WS error", err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      ws?.close();
    };
  }, [otherUserId, token]);

  const send = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    socketRef.current?.close();
    socketRef.current = null;
    setConnected(false);
  };

  return { connected, send, disconnect };
}
