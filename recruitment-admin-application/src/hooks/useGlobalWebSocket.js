import { useEffect, useRef } from "react";
import { useUnreadStore } from "../store/unreadStore";
import useAuthStore from "../store/useAuthStore";

export function useGlobalWebSocket() {
  const WS_BASE_URI = import.meta.env.VITE_API_BASE_URL
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");

  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const intentionalClose = useRef(false);

  const setAllChats = useUnreadStore(state => state.setAllChats);

  // ✅ Subscribe to token changes
  const token = useAuthStore(state => state.access_token);

  useEffect(() => {
    if (!token) return; // wait until token exists

    const wsUrl = `${WS_BASE_URI}/ws/?token=${token}`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("🌍 Global WS connected");
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "unread_snapshot":
            case "unread_update":
              setAllChats(data.counts);
              break;

            case "ping":
              ws.send(JSON.stringify({ type: "pong" }));
              break;

            default:
              break;
          }
        } catch (err) {
          console.error("Global WS parse error", err);
        }
      };

      ws.onclose = () => {
        if (intentionalClose.current) return;

        const attempt = reconnectAttempts.current;
        const delay = Math.min(1000 * 2 ** attempt, 10000);
        reconnectAttempts.current += 1;

        reconnectTimeout.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      intentionalClose.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      socketRef.current?.close();
    };
  }, [token]); // ✅ Reconnect when token becomes available
}
