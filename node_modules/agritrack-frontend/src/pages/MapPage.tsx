import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { AlertBanner } from "../components/AlertBanner";
import { Card } from "../components/Card";
import { MapViewportController } from "../components/MapViewportController";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../services/api";
import { useRealtime } from "../hooks/useRealtime";
import type { Position } from "../types";

const tractorIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41]
});

export function MapPage() {
  const { snapshot, latestAlert, connectionState } = useRealtime();
  const [followVehicle, setFollowVehicle] = useState(true);
  const [recentPositions, setRecentPositions] = useState<Position[]>([]);

  useEffect(() => {
    api.getHistory("1").then((data) => setRecentPositions(data.slice(0, 8)));
  }, [snapshot?.latestPosition.id]);

  const center = useMemo<[number, number]>(() => {
    if (!snapshot) {
      return [-23.533773, -46.62529];
    }
    return [snapshot.device.lastLatitude, snapshot.device.lastLongitude];
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <AlertBanner alert={latestAlert} />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="h-[420px] overflow-hidden p-0 sm:h-[540px] xl:h-[620px]">
          <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportController center={center} enabled={followVehicle} />
            {snapshot?.geofence ? (
              <Polygon pathOptions={{ color: "#2d8a4d", fillOpacity: 0.18 }} positions={snapshot.geofence.coordinates} />
            ) : null}
            {recentPositions.length > 1 ? (
              <Polyline
                pathOptions={{ color: "#174c33", dashArray: "6 8", opacity: 0.7 }}
                positions={recentPositions.map((position) => [position.latitude, position.longitude])}
              />
            ) : null}
            {snapshot ? (
              <Marker position={[snapshot.device.lastLatitude, snapshot.device.lastLongitude]} icon={tractorIcon}>
                <Popup>
                  <strong>{snapshot.device.name}</strong>
                  <br />
                  {snapshot.device.deviceCode}
                </Popup>
              </Marker>
            ) : null}
          </MapContainer>
        </Card>

        <div className="space-y-6">
          <Card title="Telemetria">
            {snapshot ? (
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                  <span>Conexão</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connectionState === "live" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {connectionState === "live" ? "Ao vivo" : "Fallback ativo"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trator</span>
                  <strong className="text-slate-850">{snapshot.device.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dispositivo</span>
                  <strong className="text-slate-850">{snapshot.device.deviceCode}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge value={snapshot.device.geofenceStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Latitude</span>
                  <strong className="text-slate-850">{snapshot.device.lastLatitude.toFixed(6)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Longitude</span>
                  <strong className="text-slate-850">{snapshot.device.lastLongitude.toFixed(6)}</strong>
                </div>
                <button
                  className={`w-full rounded-2xl px-4 py-3 font-semibold transition ${
                    followVehicle ? "bg-brand-500 text-white" : "border border-slate-200 text-slate-700"
                  }`}
                  onClick={() => setFollowVehicle((current) => !current)}
                >
                  {followVehicle ? "Seguindo trator automaticamente" : "Ativar seguimento automático"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aguardando dados do simulador GPS.</p>
            )}
          </Card>

          <Card title="Últimos pontos">
            <div className="space-y-3">
              {recentPositions.map((position) => (
                <div key={position.id} className="rounded-2xl border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-800">{new Date(position.recordedAt).toLocaleTimeString("pt-BR")}</span>
                    <StatusBadge value={position.status} />
                  </div>
                  <p className="mt-2 text-slate-500">
                    {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
