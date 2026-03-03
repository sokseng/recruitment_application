import { useEffect, useRef, useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { useUnreadStore } from "../store/unreadStore";

export function useGlobalWebSocket(onGlobalEvent) {
  const WS_BASE_URI = import.meta.env.VITE_API_BASE_URL.replace(
    /^http:/,
    "ws:",
  ).replace(/^https:/, "wss:");
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const intentionalClose = useRef(false);
  const messageQueue = useRef([]);
  const [connect, setConnect] = useState(false);
  const heartbeatTimeout = useRef(null);

  const setAllChats = useUnreadStore((state) => state.setAllChats);
  const token = useAuthStore((state) => state.access_token);

  useEffect(() => {
    if (!token) return;
    intentionalClose.current = false;

    const wsUrl = `${WS_BASE_URI}/ws/?token=${token}`;

    const connectWS = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        // console.log("🌍 Global WS connected");
        setConnect(true);
        reconnectAttempts.current = 0;

        // Flush queued messages
        while (messageQueue.current.length > 0) {
          const msg = messageQueue.current.shift();
          ws.send(JSON.stringify(msg));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (["unread_snapshot", "unread_update"].includes(data.type)) {
            setAllChats(data.counts);
          }

          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));

            clearTimeout(heartbeatTimeout.current);
            heartbeatTimeout.current = setTimeout(() => {
              ws.close(); // force reconnect if no ping for too long
            }, 30000);
            return;
          }

          if (
            [
              "call.incoming",
              "call.ended",
              "call.accepted",
              "call.declined",
              "call.restore",
              "call.toggle",
            ].includes(data.type)
          ) {
            if (onGlobalEvent) onGlobalEvent(data);
            return;
          }

          if (onGlobalEvent) onGlobalEvent(data);
        } catch (err) {
          console.error("Global WS parse error", err);
        }
      };

      ws.onclose = () => {
        setConnect(false);

        if (intentionalClose.current) return;

        const attempt = reconnectAttempts.current;
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        reconnectAttempts.current += 1;

        reconnectTimeout.current = setTimeout(connectWS, delay);
      };

      ws.onerror = () => ws.close();
    };

    connectWS();

    return () => {
      intentionalClose.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      socketRef.current?.close();
    };
  }, [token]);

  const send = (data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      messageQueue.current.push(data);
    }
  };

  return {
    send,
    connected: connect,
  };
}
