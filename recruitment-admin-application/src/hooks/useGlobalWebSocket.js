import { useEffect, useRef } from "react";
import useAuthStore from "../store/useAuthStore";
import { useUnreadStore } from '../store/unreadStore';

export function useGlobalWebSocket(onGlobalEvent) {
  const WS_BASE_URI = import.meta.env.VITE_API_BASE_URL
    .replace(/^http:/, "ws:")
    .replace(/^https:/, "wss:");

  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const intentionalClose = useRef(false);

  const setAllChats = useUnreadStore(state => state.setAllChats);

  const token = useAuthStore(state => state.access_token);

  useEffect(() => {
    if (!token) return;

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

          if(data.type === "unread_snapshot" || data.type === "unread_update"){
            setAllChats(data.counts);
          }

          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
            return;
          }

          if (onGlobalEvent) {
            onGlobalEvent(data);
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
  }, [token]);
}