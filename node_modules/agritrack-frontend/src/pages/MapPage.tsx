import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { AlertBanner } from "../components/AlertBanner";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { useRealtime } from "../hooks/useRealtime";

const tractorIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41]
});

export function MapPage() {
  const { snapshot, latestAlert } = useRealtime();

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
        <Card className="h-[620px] overflow-hidden p-0">
          <MapContainer key={center.join(",")} center={center} zoom={16} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {snapshot?.geofence ? (
              <Polygon pathOptions={{ color: "#2d8a4d", fillOpacity: 0.18 }} positions={snapshot.geofence.coordinates} />
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
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aguardando dados do simulador GPS.</p>
            )}
          </Card>

          <Card title="Como funciona">
            <ul className="space-y-3 text-sm text-slate-600">
              <li>O backend movimenta automaticamente o trator por um trajeto simulado.</li>
              <li>A cada atualização, a posição é validada contra a cerca virtual ativa.</li>
              <li>Quando a posição sai do polígono, um alerta visual e um WhatsApp simulado são gerados.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
