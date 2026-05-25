import { useEffect, useState } from "react";
import { API_URL, api } from "../services/api";
import type { Alert, RealtimePayload } from "../types";

const WS_URL =
  import.meta.env.VITE_WS_URL ??
  API_URL.replace(/^http/, "ws").replace(/\/api$/, "");

export function useRealtime() {
  const [snapshot, setSnapshot] = useState<RealtimePayload | null>(null);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "live" | "offline">("connecting");
  const [lastMessageAt, setLastMessageAt] = useState<string | null>(null);

  useEffect(() => {
    api.getRealtimeSnapshot().then((data) => {
      setSnapshot(data);
      setLatestAlert(data?.latestAlert ?? null);
      setLastMessageAt(new Date().toISOString());
    }).catch(() => setConnectionState("offline"));

    // WebSocket mantém mapa, dashboard e alertas sincronizados sem polling do frontend.
    const token = localStorage.getItem("agritrack-token");
    const socket = new WebSocket(`${WS_URL}${token ? `?token=${encodeURIComponent(token)}` : ""}`);
    const fallbackTimer = window.setInterval(() => {
      api.getRealtimeSnapshot()
        .then((data) => {
          setSnapshot(data);
          setLatestAlert(data?.latestAlert ?? null);
          setLastMessageAt(new Date().toISOString());
        })
        .catch(() => undefined);
    }, 15000);

    socket.onopen = () => {
      setConnectionState("live");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RealtimePayload;
        setSnapshot(payload);
        setConnectionState("live");
        setLastMessageAt(new Date().toISOString());
        setLatestAlert(payload.latestAlert);
      } catch {
        setConnectionState("offline");
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
