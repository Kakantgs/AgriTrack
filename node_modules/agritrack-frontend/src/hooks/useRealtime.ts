import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Alert, RealtimePayload } from "../types";

export function useRealtime() {
  const [snapshot, setSnapshot] = useState<RealtimePayload | null>(null);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "live" | "offline">("connecting");
  const [lastMessageAt, setLastMessageAt] = useState<string | null>(null);

  useEffect(() => {
    api.getRealtimeSnapshot().then((data) => {
      setSnapshot(data);
      setLatestAlert(data.latestAlert);
      setLastMessageAt(new Date().toISOString());
    });

    // WebSocket mantém mapa, dashboard e alertas sincronizados sem polling do frontend.
    const socket = new WebSocket("ws://localhost:4000");
    const fallbackTimer = window.setInterval(() => {
      api.getRealtimeSnapshot()
        .then((data) => {
          setSnapshot(data);
          setLatestAlert(data.latestAlert);
          setLastMessageAt(new Date().toISOString());
        })
        .catch(() => undefined);
    }, 15000);

    socket.onopen = () => {
      setConnectionState("live");
    };

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RealtimePayload;
      setSnapshot(payload);
      setConnectionState("live");
      setLastMessageAt(new Date().toISOString());
      if (payload.latestAlert) {
        setLatestAlert(payload.latestAlert);
      }
    };

    socket.onerror = () => {
      setConnectionState("offline");
    };

    socket.onclose = () => {
      setConnectionState("offline");
    };

    return () => {
      window.clearInterval(fallbackTimer);
      socket.close();
    };
  }, []);

  return { snapshot, latestAlert, connectionState, lastMessageAt };
}
