import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Alert, RealtimePayload } from "../types";

export function useRealtime() {
  const [snapshot, setSnapshot] = useState<RealtimePayload | null>(null);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);

  useEffect(() => {
    api.getRealtimeSnapshot().then((data) => {
      setSnapshot(data);
      setLatestAlert(data.latestAlert);
    });

    // WebSocket mantém mapa, dashboard e alertas sincronizados sem polling do frontend.
    const socket = new WebSocket("ws://localhost:4000");

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RealtimePayload;
      setSnapshot(payload);
      if (payload.latestAlert) {
        setLatestAlert(payload.latestAlert);
      }
    };

    return () => socket.close();
  }, []);

  return { snapshot, latestAlert };
}
